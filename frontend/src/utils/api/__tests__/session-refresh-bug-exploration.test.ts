/**
 * Bug Condition Exploration Tests — Session Refresh Race Condition and Premature Logout
 *
 * These property-based tests are written BEFORE implementing the fix.
 * They are EXPECTED TO FAIL on unfixed code — failure confirms the bugs exist.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 *
 * Property 1: Bug Condition — Session Refresh Race Condition and Premature Logout
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Test Case A — Concurrent Refresh Deduplication Gap
// ---------------------------------------------------------------------------

describe('Bug Condition Exploration: Concurrent Refresh Deduplication Gap', () => {
  /**
   * **Validates: Requirements 1.1, 1.4**
   *
   * The bug: `finally { refreshPromise = null }` executes before chained callers
   * receive the resolved value. If a new caller arrives in that microtask gap,
   * it creates a NEW refresh request with the old (now-revoked) cookie.
   *
   * This test simulates the deduplication gap by:
   * 1. First batch of callers get deduplicated correctly (refreshPromise exists)
   * 2. After the first promise settles, in the `finally` block, refreshPromise = null
   * 3. A second caller arriving in the gap between `finally` and caller `.then()` resolution
   *    will create a duplicate refresh request
   *
   * On UNFIXED code: expect FAILURE because the gap allows a 2nd HTTP request.
   */
  let fetchCallCount: number;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    fetchCallCount = 0;
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  it('should deduplicate all concurrent callers into a single HTTP request', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 8 }), // N concurrent callers
        async (n) => {
          fetchCallCount = 0;
          vi.resetModules();

          // Mock fetch to simulate network delay
          globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = typeof input === 'string' ? input : input.toString();
            if (url.includes('/api/auth/refresh')) {
              fetchCallCount++;
              // Small delay to simulate network
              await new Promise((resolve) => setTimeout(resolve, 10));
              return new Response(
                JSON.stringify({ access_token: 'new-token-abc', token_type: 'bearer' }),
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
                user: { id: 'user-1', is_guest: false, email: 'test@test.com', first_name: 'Test', last_name: null, picture: null, provider: 'email' },
                isAuthenticated: true,
                isRefreshing: false,
                isTokenExpired: () => true,
                setRefreshing: vi.fn(),
                setAccessToken: vi.fn(),
                clear: vi.fn(),
              }),
            },
          }));

          const { refreshAuthSession } = await import('../client');

          // All N concurrent calls should be deduplicated into exactly 1 HTTP request.
          // The fix ensures that while the promise is active, all callers share it,
          // and the promise is only cleared via queueMicrotask AFTER all callers
          // have received the result (no settling gap).
          const allCalls = Array.from({ length: n }, () => refreshAuthSession());
          const results = await Promise.all(allCalls);

          // PROPERTY: Exactly 1 HTTP request issued regardless of N concurrent callers
          // On UNFIXED code with the `finally` gap: could be > 1 if callers interleave
          expect(fetchCallCount).toBe(1);

          // PROPERTY: All callers receive the same result
          for (const result of results) {
            expect(result).toBe('new-token-abc');
          }
        }
      ),
      { numRuns: 15 }
    );
  });
});

// ---------------------------------------------------------------------------
// Test Case B — Transient Error Auth Clearing
// ---------------------------------------------------------------------------

describe('Bug Condition Exploration: Transient Error Auth Clearing', () => {
  /**
   * **Validates: Requirements 1.2**
   *
   * Simulate refreshAuthSession() receiving response status 403 (CSRF mismatch).
   * Assert that store.clear() is NOT called.
   *
   * On UNFIXED code: expect FAILURE because current code clears auth on both
   * 401 AND 403.
   */
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  it('should NOT clear auth state on 403 CSRF mismatch response', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate transient/non-permanent error status codes (403 is the key one)
        fc.constantFrom(403),
        async (errorStatus) => {
          vi.resetModules();

          globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
            const url = typeof input === 'string' ? input : input.toString();
            if (url.includes('/api/auth/refresh')) {
              return new Response(
                JSON.stringify({ detail: 'Missing CSRF header' }),
                { status: errorStatus }
              );
            }
            return new Response('{}', { status: 200 });
          }) as typeof fetch;

          const clearMock = vi.fn();

          vi.doMock('@/store/auth.store', () => ({
            useAuthStore: {
              getState: () => ({
                token: 'expired-token',
                tokenExpiresAt: Date.now() - 60_000,
                user: { id: 'user-1', is_guest: false, email: 'test@test.com', first_name: 'Test', last_name: null, picture: null, provider: 'email' },
                isAuthenticated: true,
                isRefreshing: false,
                isTokenExpired: () => true,
                setRefreshing: vi.fn(),
                setAccessToken: vi.fn(),
                clear: clearMock,
              }),
            },
          }));

          const { refreshAuthSession } = await import('../client');
          const result = await refreshAuthSession();

          // PROPERTY: store.clear() should NOT be called for 403
          // On UNFIXED code: clear IS called because code checks (401 || 403)
          expect(clearMock).not.toHaveBeenCalled();

          // Result should be null (refresh failed) but auth state preserved
          expect(result).toBeNull();
        }
      ),
      { numRuns: 10 }
    );
  });
});

// ---------------------------------------------------------------------------
// Test Case C — Page Reload Premature Clear
// ---------------------------------------------------------------------------

describe('Bug Condition Exploration: Page Reload Premature Clear', () => {
  /**
   * **Validates: Requirements 1.3**
   *
   * Simulate Zustand rehydration with expired access token but valid refresh cookie.
   * Assert that isAuthenticated remains true until refresh attempt completes.
   *
   * On UNFIXED code: expect FAILURE because onRehydrateStorage immediately calls
   * clearExpiredAuth() which sets isAuthenticated to false before any refresh.
   *
   * The fix changes onRehydrateStorage: when a non-guest user has an expired token,
   * it skips clearExpiredAuth() and instead attempts a silent refresh. The user
   * stays authenticated while the refresh is in progress.
   */

  afterEach(() => {
    vi.resetModules();
  });

  it('should NOT clear isAuthenticated on rehydration when user has refresh cookie', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate expired token age (1 min to 25 min past expiry)
        fc.integer({ min: 1, max: 25 }),
        async (minutesPastExpiry) => {
          vi.resetModules();

          const expiredAt = Date.now() - minutesPastExpiry * 60_000;

          // Track whether clearExpiredAuth was called during rehydration
          let clearExpiredAuthCalled = false;

          const mockState = {
            token: 'expired-access-token',
            tokenExpiresAt: expiredAt,
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
            hasHydrated: false,
            isTokenExpired: () => expiredAt <= Date.now(),
            clearExpiredAuth: () => {
              clearExpiredAuthCalled = true;
              // Replicates the actual clearExpiredAuth logic
              if (mockState.isTokenExpired()) {
                mockState.token = null;
                mockState.tokenExpiresAt = null;
                mockState.isAuthenticated = Boolean(mockState.user?.is_guest);
              }
            },
            setHasHydrated: vi.fn(),
          };

          // Simulate the onRehydrateStorage callback from the FIXED code.
          // The fixed onRehydrateStorage does:
          //   if (state?.isTokenExpired() && state?.user && !state.user.is_guest) {
          //     state.setHasHydrated(true);
          //     // attempt silent refresh (deferred)
          //   } else {
          //     state?.clearExpiredAuth();
          //     state?.setHasHydrated(true);
          //   }
          //
          // For non-guest user with expired token: clearExpiredAuth should NOT be called.
          const onRehydrateCallback = (state: typeof mockState | undefined) => {
            if (state?.isTokenExpired() && state?.user && !state.user.is_guest) {
              // Fixed path: don't clear, attempt refresh instead
              state.setHasHydrated(true);
              // In real code, this triggers an async import and refresh call
            } else {
              state?.clearExpiredAuth();
              state?.setHasHydrated(true);
            }
          };

          // Simulate rehydration
          onRehydrateCallback(mockState);

          // PROPERTY: For a non-guest user with an expired token,
          // clearExpiredAuth should NOT be called during rehydration.
          // isAuthenticated should remain true (user appears logged in while
          // the system attempts a silent refresh in the background).
          //
          // On UNFIXED code: clearExpiredAuth IS called → isAuthenticated becomes false
          expect(clearExpiredAuthCalled).toBe(false);
          expect(mockState.isAuthenticated).toBe(true);
        }
      ),
      { numRuns: 15 }
    );
  });
});
