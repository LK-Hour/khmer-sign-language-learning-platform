/**
 * Preservation Property Tests — Legitimate Security and Session Behavior
 *
 * These property-based tests are written BEFORE implementing the fix.
 * They MUST PASS on unfixed code — passing confirms baseline behavior to preserve.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 *
 * Property 2: Preservation — Legitimate Security and Session Behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Property: For all valid (non-expired) access tokens, no refresh request is made
// **Validates: Requirements 3.4**
// ---------------------------------------------------------------------------

describe('Preservation: Valid non-expired access token used directly', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  it('should use valid token directly without triggering refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a token expiry time that is in the future (1 min to 30 min from now)
        fc.integer({ min: 1, max: 30 }),
        async (minutesUntilExpiry) => {
          vi.resetModules();

          let refreshCalled = false;
          const validExpiresAt = Date.now() + minutesUntilExpiry * 60_000;

          globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = typeof input === 'string' ? input : input.toString();
            if (url.includes('/api/auth/refresh')) {
              refreshCalled = true;
              return new Response(
                JSON.stringify({ access_token: 'refreshed-token', token_type: 'bearer' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              );
            }
            // Simulate a normal API response
            return new Response(JSON.stringify({ data: 'ok' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }) as typeof fetch;

          vi.doMock('@/store/auth.store', () => ({
            useAuthStore: {
              getState: () => ({
                token: 'valid-access-token-xyz',
                tokenExpiresAt: validExpiresAt,
                user: {
                  id: 'user-1',
                  is_guest: false,
                  email: 'test@test.com',
                  first_name: 'Test',
                  last_name: null,
                  picture: null,
                  provider: 'email',
                },
                isAuthenticated: true,
                isRefreshing: false,
                isTokenExpired: () => false,
                setRefreshing: vi.fn(),
                setAccessToken: vi.fn(),
                clear: vi.fn(),
              }),
            },
          }));

          const { apiFetch } = await import('../client');

          // Make an API call with a valid non-expired token
          const result = await apiFetch<{ data: string }>('/api/test');

          // PROPERTY: No refresh request should be made when token is valid
          expect(refreshCalled).toBe(false);
          expect(result).toEqual({ data: 'ok' });
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property: For all guest sessions, refresh mechanism is skipped
// **Validates: Requirements 3.5**
// ---------------------------------------------------------------------------

describe('Preservation: Guest user skips refresh mechanism', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  it('should skip refresh for guest users even when token state suggests expiry', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate guest user IDs
        fc.uuid(),
        async (guestId) => {
          vi.resetModules();

          let refreshCalled = false;

          globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = typeof input === 'string' ? input : input.toString();
            if (url.includes('/api/auth/refresh')) {
              refreshCalled = true;
              return new Response(
                JSON.stringify({ access_token: 'new-token', token_type: 'bearer' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              );
            }
            return new Response(JSON.stringify({ data: 'guest-ok' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }) as typeof fetch;

          vi.doMock('@/store/auth.store', () => ({
            useAuthStore: {
              getState: () => ({
                token: null,
                tokenExpiresAt: null,
                user: {
                  id: guestId,
                  is_guest: true,
                  email: null,
                  first_name: 'Guest',
                  last_name: null,
                  picture: null,
                  provider: 'guest',
                  account_type: 'student',
                },
                isAuthenticated: true,
                isRefreshing: false,
                isTokenExpired: () => true, // Token "expired" but user is guest
                setRefreshing: vi.fn(),
                setAccessToken: vi.fn(),
                clear: vi.fn(),
              }),
            },
          }));

          const { refreshAuthSession } = await import('../client');

          // Call refresh directly — should be skipped for guest
          const result = await refreshAuthSession();

          // PROPERTY: Refresh mechanism is completely skipped for guest users
          expect(refreshCalled).toBe(false);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 15 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property: For all successful single-caller refreshes, rotation occurs correctly
// **Validates: Requirements 3.6**
// ---------------------------------------------------------------------------

describe('Preservation: Successful single-caller refresh performs rotation', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  it('should issue new token and update store on successful single refresh', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate different token values to simulate rotation
        fc.string({ minLength: 16, maxLength: 32, unit: fc.constantFrom(...'0123456789abcdef'.split('')) }),
        async (newTokenSuffix) => {
          vi.resetModules();

          const newAccessToken = `new-access-token-${newTokenSuffix}`;
          let setAccessTokenCalledWith: { access_token: string; token_type: string } | null = null;

          globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = typeof input === 'string' ? input : input.toString();
            if (url.includes('/api/auth/refresh')) {
              return new Response(
                JSON.stringify({ access_token: newAccessToken, token_type: 'bearer' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              );
            }
            return new Response('{}', { status: 200 });
          }) as typeof fetch;

          vi.doMock('@/store/auth.store', () => ({
            useAuthStore: {
              getState: () => ({
                token: 'expired-token',
                tokenExpiresAt: Date.now() - 60_000,
                user: {
                  id: 'user-1',
                  is_guest: false,
                  email: 'test@test.com',
                  first_name: 'Test',
                  last_name: null,
                  picture: null,
                  provider: 'email',
                },
                isAuthenticated: true,
                isRefreshing: false,
                isTokenExpired: () => true,
                setRefreshing: vi.fn(),
                setAccessToken: (resp: { access_token: string; token_type: string }) => {
                  setAccessTokenCalledWith = resp;
                },
                clear: vi.fn(),
              }),
            },
          }));

          const { refreshAuthSession } = await import('../client');

          // Single caller refresh
          const result = await refreshAuthSession();

          // PROPERTY: Successful single-caller refresh returns new token
          // and calls setAccessToken with the new token data
          expect(result).toBe(newAccessToken);
          expect(setAccessTokenCalledWith).not.toBeNull();
          expect(setAccessTokenCalledWith!.access_token).toBe(newAccessToken);
          expect(setAccessTokenCalledWith!.token_type).toBe('bearer');
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property: For all explicit logout calls, frontend state is cleared
// **Validates: Requirements 3.3**
// ---------------------------------------------------------------------------

describe('Preservation: Explicit logout clears frontend state', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  it('should clear auth state when logout API call succeeds and subsequent 401 triggers clear', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          vi.resetModules();

          let clearCalled = false;
          let logoutRequestMade = false;

          globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : input.toString();
            if (url.includes('/api/auth/logout')) {
              logoutRequestMade = true;
              return new Response(
                JSON.stringify({ detail: 'Logged out successfully' }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
              );
            }
            // After logout, the refresh token is revoked, so refresh returns 401
            if (url.includes('/api/auth/refresh')) {
              return new Response(
                JSON.stringify({ detail: 'Invalid refresh token' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
              );
            }
            // Simulate any API call returning 401 after logout
            return new Response(JSON.stringify({ detail: 'Unauthorized' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            });
          }) as typeof fetch;

          vi.doMock('@/store/auth.store', () => ({
            useAuthStore: {
              getState: () => ({
                token: 'some-access-token',
                tokenExpiresAt: Date.now() - 60_000, // expired so refresh will be triggered
                user: {
                  id: userId,
                  is_guest: false,
                  email: 'user@test.com',
                  first_name: 'User',
                  last_name: null,
                  picture: null,
                  provider: 'email',
                },
                isAuthenticated: true,
                isRefreshing: false,
                isTokenExpired: () => true,
                setRefreshing: vi.fn(),
                setAccessToken: vi.fn(),
                clear: () => {
                  clearCalled = true;
                },
              }),
            },
          }));

          const { apiFetch } = await import('../client');

          // First, call the logout endpoint
          const logoutResult = await apiFetch<{ detail: string }>('/api/auth/logout', {
            method: 'POST',
            skipAuth: true,
            headers: { 'X-Requested-With': 'KSL-Client' },
          });
          expect(logoutRequestMade).toBe(true);
          expect(logoutResult.detail).toBe('Logged out successfully');

          // After logout, when the access token is expired and refresh returns 401,
          // the store.clear() is called (this is the preservation behavior)
          const { refreshAuthSession } = await import('../client');
          const refreshResult = await refreshAuthSession();

          // PROPERTY: On 401 from refresh (token revoked via logout), auth state is cleared
          expect(refreshResult).toBeNull();
          expect(clearCalled).toBe(true);
        }
      ),
      { numRuns: 15 }
    );
  });
});
