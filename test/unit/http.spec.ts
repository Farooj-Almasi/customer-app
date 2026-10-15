import { ApiError, joinUrl, parseApiError } from '../../src/api/http';

describe('http helpers', () => {
  it('joins base and path with exactly one slash', () => {
    expect(joinUrl('http://x/api/v1', 'branches')).toBe('http://x/api/v1/branches');
    expect(joinUrl('http://x/api/v1/', '/branches')).toBe('http://x/api/v1/branches');
    expect(joinUrl('http://x/api/v1', '/orders/1/pay')).toBe('http://x/api/v1/orders/1/pay');
  });

  it('parses the backend error envelope', () => {
    const shape = parseApiError(409, { statusCode: 409, code: 'CONFLICT', message: 'Nope', details: ['a'] });
    expect(shape.code).toBe('CONFLICT');
    expect(shape.statusCode).toBe(409);
    expect(shape.details).toEqual(['a']);
  });

  it('synthesises a safe error for a non-envelope body', () => {
    expect(parseApiError(500, 'html error page').code).toBe('INTERNAL_ERROR');
    expect(parseApiError(400, null).code).toBe('REQUEST_FAILED');
    // Never leaks a raw server message.
    expect(parseApiError(500, '<html>').message).not.toContain('html');
  });

  it('flags network errors', () => {
    const net = new ApiError({ statusCode: 0, code: 'NETWORK', message: 'x' });
    expect(net.isNetwork).toBe(true);
    expect(new ApiError({ statusCode: 404, code: 'NOT_FOUND', message: 'x' }).isNetwork).toBe(false);
  });
});
