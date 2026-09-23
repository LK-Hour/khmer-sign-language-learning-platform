/**
 * Sentence-spelling practice attempt API-records completed practice
 * sessions and reads back the learner's most recent one.
 */

import { useAuthStore } from "@/store/auth.store";
import { apiFetch } from "@/utils/api/client";

export type PracticeSource = "sample" | "custom";

/**
 * "Enter as Guest" never creates a real backend session-it's a purely
 * client-side identity with an empty access token (see
 * `features/auth/api/auth.ts::loginAsGuest`), so there's nothing valid to
 * send as a Bearer token. Practice history can only be attributed to a real
 * account, exactly like finger-spelling's own practice recording
 * (`FingerPracticeService`, gated on `get_current_user` too)-checking for
 * a non-empty token (rather than the `is_guest` flag) is what actually
 * matters here, since a real backend-issued guest session would carry one.
 */
export function hasPersistentAccount(): boolean {
  const { token } = useAuthStore.getState();
  return Boolean(token && token.trim().length > 0);
}

export type RecentPractice = {
  source: PracticeSource;
  practicedText: string;
  accuracyPercent: number;
  completedAt: string;
} | null;

type RecentPracticeResponse = {
  source: PracticeSource | null;
  practiced_text: string | null;
  accuracy_percent: number | null;
  completed_at: string | null;
};

export async function submitPracticeAttempt(params: {
  source: PracticeSource;
  sentenceId?: number;
  practicedText: string;
  characterCount: number;
  accuracyPercent: number;
}): Promise<void> {
  if (!hasPersistentAccount()) return;

  await apiFetch("/api/sentence_spelling/practice/attempts", {
    method: "POST",
    body: JSON.stringify({
      source: params.source,
      sentence_id: params.sentenceId ?? null,
      practiced_text: params.practicedText,
      character_count: params.characterCount,
      accuracy_percent: params.accuracyPercent,
    }),
  });
}

export async function fetchRecentPractice(): Promise<RecentPractice> {
  if (!hasPersistentAccount()) return null;

  try {
    const raw = await apiFetch<RecentPracticeResponse>("/api/sentence_spelling/practice/recent");
    if (!raw?.source || !raw.practiced_text || !raw.completed_at) return null;
    return {
      source: raw.source,
      practicedText: raw.practiced_text,
      accuracyPercent: raw.accuracy_percent ?? 0,
      completedAt: raw.completed_at,
    };
  } catch {
    return null;
  }
}

export type CustomHistoryEntry = {
  text: string;
  practicedAt: string;
};

type CustomHistoryEntryResponse = {
  practiced_text: string;
  completed_at: string;
};

export async function fetchCustomHistory(limit = 5): Promise<CustomHistoryEntry[]> {
  if (!hasPersistentAccount()) return [];

  try {
    const raw = await apiFetch<CustomHistoryEntryResponse[]>(
      `/api/sentence_spelling/practice/custom-history?limit=${limit}`
    );
    return raw?.map((entry) => ({ text: entry.practiced_text, practicedAt: entry.completed_at })) ?? [];
  } catch {
    return [];
  }
}
