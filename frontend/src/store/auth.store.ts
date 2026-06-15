import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Matches backend `OAuthUserResponse`. */
export interface AuthUser {
  id: string;
  email: string | null;
  first_name: string;
  last_name: string | null;
  picture: string | null;
  provider: string;
  account_type?: string;
  is_guest?: boolean;
}

/** Matches backend `AuthTokenResponse`. */
export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
  expires_at?: string | number | null;
  expires_in?: number | null;
}

interface AuthState {
  token: string | null;
  tokenExpiresAt: number | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  hasHydrated: boolean;

  /** Set auth state from a login response. */
  setAuth: (response: AuthTokenResponse) => void;

  /** Start a local-only guest session. */
  setGuestAuth: () => void;

  /** Update only the access token after a background refresh. */
  setAccessToken: (response: { access_token: string; token_type: string }) => void;

  setRefreshing: (isRefreshing: boolean) => void;

  setHasHydrated: (hasHydrated: boolean) => void;

  /** Clear all auth state (logout). */
  clear: () => void;

  /** Restore a session from a stored token (e.g. after page refresh). */
  restoreSession: (token: string, user: AuthUser, tokenExpiresAt?: number | null) => void;

  /** True when the persisted token has a known expiry and is no longer valid. */
  isTokenExpired: () => boolean;

  /** Clear auth only when the persisted token has expired. */
  clearExpiredAuth: () => void;
}

function decodeJwtExpiry(token: string): number | null {
  const [, payload] = token.split('.');
  if (!payload || typeof globalThis.atob !== 'function') return null;

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(globalThis.atob(normalizedPayload)) as {
      exp?: unknown;
    };

    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

function resolveTokenExpiresAt(response: AuthTokenResponse): number | null {
  if (typeof response.expires_at === 'number') {
    return response.expires_at;
  }

  if (typeof response.expires_at === 'string') {
    const parsed = Date.parse(response.expires_at);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (typeof response.expires_in === 'number') {
    return Date.now() + response.expires_in * 1000;
  }

  return decodeJwtExpiry(response.access_token);
}

const isExpired = (tokenExpiresAt: number | null) =>
  tokenExpiresAt != null && tokenExpiresAt <= Date.now();

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      tokenExpiresAt: null,
      user: null,
      isAuthenticated: false,
      isRefreshing: false,
      hasHydrated: false,

      setAuth: (response) =>
        set({
          token: response.access_token,
          tokenExpiresAt: resolveTokenExpiresAt(response),
          user: response.user,
          isAuthenticated: true,
        }),

      setGuestAuth: () =>
        set({
          token: null,
          tokenExpiresAt: null,
          user: {
            id: "local-guest",
            email: null,
            first_name: "Guest",
            last_name: null,
            picture: null,
            provider: "guest",
            account_type: "student",
            is_guest: true,
          },
          isAuthenticated: true,
        }),

      setAccessToken: (response) =>
        set((state) => {
          if (!state.user) return state;
          return {
            token: response.access_token,
            tokenExpiresAt: resolveTokenExpiresAt({
              access_token: response.access_token,
              token_type: response.token_type,
              user: state.user,
            }),
            isAuthenticated: true,
          };
        }),

      setRefreshing: (isRefreshing) => set({ isRefreshing }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      clear: () =>
        set({
          token: null,
          tokenExpiresAt: null,
          user: null,
          isAuthenticated: false,
          isRefreshing: false,
        }),

      restoreSession: (token, user, tokenExpiresAt = decodeJwtExpiry(token)) =>
        set({
          token,
          tokenExpiresAt,
          user,
          isAuthenticated: !isExpired(tokenExpiresAt),
        }),

      isTokenExpired: () => isExpired(get().tokenExpiresAt),

      clearExpiredAuth: () => {
        if (get().isTokenExpired()) {
          const user = get().user;
          set({
            token: null,
            tokenExpiresAt: null,
            isAuthenticated: Boolean(user?.is_guest),
          });
        }
      },
    }),
    {
      name: 'ksl-auth',
      partialize: (state) => ({
        token: state.token,
        tokenExpiresAt: state.tokenExpiresAt,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.clearExpiredAuth();
        state?.setHasHydrated(true);
      },
    }
  )
);
