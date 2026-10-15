/**
 * The API HTTP layer.
 *
 * Pure helpers (`joinUrl`, `parseApiError`) are split out and unit-tested; the
 * `ApiClient` wraps `fetch` with the base URL, bearer token, correlation id and
 * the backend's single error envelope. One error shape reaches the UI, so
 * screens branch on a stable `code`, never on a raw message.
 */

export interface ApiErrorShape {
  statusCode: number;
  code: string;
  message: string;
  details?: string[];
  correlationId?: string;
}

/** A thrown API error carrying the backend envelope (or a synthesised network one). */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: string[];

  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.name = 'ApiError';
    this.statusCode = shape.statusCode;
    this.code = shape.code;
    this.details = shape.details;
  }

  /** True when the failure is a lost/again-able connection rather than a real 4xx/5xx. */
  get isNetwork(): boolean {
    return this.code === 'NETWORK';
  }
}

/** Joins a base URL and path with exactly one slash. Pure. */
export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/** Normalises any failure body into the error envelope. Pure. */
export function parseApiError(status: number, body: unknown): ApiErrorShape {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    if (typeof b.code === 'string' && typeof b.message === 'string') {
      return {
        statusCode: typeof b.statusCode === 'number' ? b.statusCode : status,
        code: b.code,
        message: b.message,
        details: Array.isArray(b.details) ? (b.details as string[]) : undefined,
        correlationId: typeof b.correlationId === 'string' ? b.correlationId : undefined,
      };
    }
  }
  return {
    statusCode: status,
    code: status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
    message: 'Something went wrong. Please try again.',
  };
}

export interface TokenProvider {
  getAccessToken: () => string | null;
  /** Called on a 401 to attempt a refresh; returns true if a new token is ready. */
  onUnauthorized: () => Promise<boolean>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Skip the bearer token (public endpoints). */
  public?: boolean;
  signal?: AbortSignal;
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokens: TokenProvider,
  ) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const doFetch = (): Promise<Response> => {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
      }
      const token = options.public ? null : this.tokens.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      return fetch(joinUrl(this.baseUrl, path), {
        method: options.method ?? 'GET',
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
      });
    };

    let response: Response;
    try {
      response = await doFetch();
    } catch {
      throw new ApiError({ statusCode: 0, code: 'NETWORK', message: 'No connection. Check your network and try again.' });
    }

    // One retry after a successful token refresh on 401.
    if (response.status === 401 && !options.public) {
      const refreshed = await this.tokens.onUnauthorized();
      if (refreshed) {
        try {
          response = await doFetch();
        } catch {
          throw new ApiError({ statusCode: 0, code: 'NETWORK', message: 'No connection. Check your network and try again.' });
        }
      }
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    const json: unknown = text ? safeParse(text) : undefined;

    if (!response.ok) {
      throw new ApiError(parseApiError(response.status, json));
    }
    return json as T;
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
