import { apiFetch } from '@/utils/api/client';
import { getOrCreateLocalGuestId } from '@/utils/localGuest';
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
  password: string,
  rememberMe = false
): Promise<AuthTokenResponse> {
  return apiFetch<AuthTokenResponse>('/api/auth/login/email', {
    method: 'POST',
    body: JSON.stringify({ email, password, remember_me: rememberMe }),
    skipAuth: true,
  });
}

export type GuestLessonProgressImport = {
  lesson_id: number;
  is_completed?: boolean;
  attempt_count?: number;
  completed_at?: string | null;
};

export type GuestPracticeSummaryImport = {
  lesson_id: number;
  attempt_count?: number;
  completed_at?: string | null;
};

export type GuestChapterPracticeImport = {
  chapter_id: number;
  avg_score?: number;
  completed_at?: string | null;
};

export type GuestUnitExerciseImport = {
  unit_id: number;
  score: number;
  max_score: number;
  question_ids?: number[];
  completed_at?: string | null;
};

export type GuestProgressImportPayload = {
  lessons: GuestLessonProgressImport[];
  practice_summaries: GuestPracticeSummaryImport[];
  last_accessed_lesson_id?: number | null;
  chapter_practices?: GuestChapterPracticeImport[];
  unit_exercises?: GuestUnitExerciseImport[];
};

export function importGuestProgress(payload: GuestProgressImportPayload) {
  return apiFetch<{ imported_lessons: number; skipped_lessons: number }>(
    '/api/auth/import-guest-progress',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
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

/**
 * Exchanges the short-lived one-time code from the Telegram widget redirect
 * for the real access token. Keeps the token out of the URL/browser history.
 */
export function exchangeTelegramCode(code: string): Promise<AuthTokenResponse> {
  return apiFetch<AuthTokenResponse>('/api/auth/login/telegram/exchange', {
    method: 'POST',
    body: JSON.stringify({ code }),
    skipAuth: true,
  });
}

export function loginAsGuest(): Promise<AuthTokenResponse> {
  return Promise.resolve({
    access_token: '',
    token_type: 'bearer',
    user: {
      id: getOrCreateLocalGuestId(),
      email: null,
      first_name: 'Guest',
      last_name: null,
      picture: null,
      provider: 'guest',
      account_type: 'student',
      is_guest: true,
    },
  });
}

export function fetchCurrentUser(accessToken?: string): Promise<CurrentUserResponse> {
  return apiFetch<CurrentUserResponse>('/api/auth/login/me', { accessToken });
}

export function logout(): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>('/api/auth/logout', {
    method: 'POST',
    headers: {
      'X-Requested-With': 'KSL-Client',
    },
    skipAuth: true,
  });
}
