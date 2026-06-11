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
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;

  /** Set auth state from a login response. */
  setAuth: (response: AuthTokenResponse) => void;

  /** Clear all auth state (logout). */
  clear: () => void;

  /** Restore a session from a stored token (e.g. after page refresh). */
  restoreSession: (token: string, user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (response) =>
        set({
          token: response.access_token,
          user: response.user,
          isAuthenticated: true,
        }),

      clear: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),

      restoreSession: (token, user) =>
        set({
          token,
          user,
          isAuthenticated: true,
        }),
    }),
    {
      name: 'ksl-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
