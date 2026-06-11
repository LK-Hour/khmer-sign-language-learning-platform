import { apiFetch } from '@/utils/api/client';
import type { AuthTokenResponse } from '@/store/auth.store';

export type CurrentUserResponse = {
  id: string;
  username: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  account_type: 'student' | 'admin' | string;
  auth_provider: string;
  is_guest: boolean;
  is_active: boolean;
};

export function loginWithEmail(
  email: string,
  password: string
): Promise<AuthTokenResponse> {
  return apiFetch<AuthTokenResponse>('/api/auth/login/email', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
}

export function loginWithGoogle(code: string): Promise<AuthTokenResponse> {
  return apiFetch<AuthTokenResponse>('/api/auth/login/google', {
    method: 'POST',
    body: JSON.stringify({ code }),
    skipAuth: true,
  });
}

export function loginWithFacebook(code: string): Promise<AuthTokenResponse> {
  return apiFetch<AuthTokenResponse>('/api/auth/login/facebook', {
    method: 'POST',
    body: JSON.stringify({ code }),
    skipAuth: true,
  });
}

export function loginAsGuest(): Promise<AuthTokenResponse> {
  return apiFetch<AuthTokenResponse>('/api/auth/login/guest', {
    method: 'POST',
    skipAuth: true,
  });
}

export function fetchCurrentUser(): Promise<CurrentUserResponse> {
  return apiFetch<CurrentUserResponse>('/api/auth/login/me');
}
