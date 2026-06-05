import { create } from "zustand";

/** Matches backend `OAuthUserResponse`. */
export interface AuthUser {
  id: string;
  email: string | null;
  first_name: string;
  last_name: string | null;
  picture: string | null;
  provider: string;
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
  setAuth: (response: AuthTokenResponse) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,

  setAuth: (response) =>
    set({
      token: response.access_token,
      user: response.user,
    }),

  clear: () => set({ token: null, user: null }),
}));
