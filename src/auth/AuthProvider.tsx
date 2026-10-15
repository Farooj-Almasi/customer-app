import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { API_BASE_URL } from '../api/config';
import { Api } from '../api/endpoints';
import { ApiClient } from '../api/http';
import { AuthTokens } from '../api/types';
import { clearTokens, loadTokens, saveTokens } from './tokenStore';

interface AuthContextValue {
  api: Api;
  /** True once the stored session has been read (avoids an auth-flash on launch). */
  ready: boolean;
  isAuthenticated: boolean;
  /** Store the tokens returned by OTP verification and mark the session active. */
  signIn: (tokens: AuthTokens) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the auth session and the single `Api` instance.
 *
 * The access token is held in a ref so the HTTP client can read it
 * synchronously on every request; a 401 triggers one refresh using the stored
 * refresh token, and a failed refresh signs the user out cleanly. Tokens are
 * never kept only in React state — they are persisted to the secure store so a
 * session survives a restart.
 */
export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const tokensRef = useRef<AuthTokens | null>(null);

  const setTokens = async (tokens: AuthTokens | null): Promise<void> => {
    tokensRef.current = tokens;
    setIsAuthenticated(!!tokens);
    if (tokens) {
      await saveTokens(tokens);
    } else {
      await clearTokens();
    }
  };

  const api = useMemo(() => {
    const client = new ApiClient(API_BASE_URL, {
      getAccessToken: () => tokensRef.current?.accessToken ?? null,
      onUnauthorized: async () => {
        const refreshToken = tokensRef.current?.refreshToken;
        if (!refreshToken) {
          return false;
        }
        try {
          const next = await new Api(
            new ApiClient(API_BASE_URL, { getAccessToken: () => null, onUnauthorized: async () => false }),
          ).refresh(refreshToken);
          await setTokens(next);
          return true;
        } catch {
          await setTokens(null);
          return false;
        }
      },
    });
    return new Api(client);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadTokens().then((stored) => {
      if (!mounted) {
        return;
      }
      tokensRef.current = stored;
      setIsAuthenticated(!!stored);
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      api,
      ready,
      isAuthenticated,
      signIn: (tokens) => setTokens(tokens),
      signOut: () => setTokens(null),
    }),
    [api, ready, isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
