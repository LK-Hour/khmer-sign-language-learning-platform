/**
 * Sentence-spelling sample sentence API.
 * Mirrors word-detection/api/curriculum.ts's `apiFetch` usage.
 */

import { apiFetch } from "@/utils/api/client";

import { findNextSentence } from "../utils/nextSentence";

export type SentenceSpellingSentence = {
  id: number;
  textKh: string;
  textEn: string | null;
};

type SentenceResponse = {
  id: number;
  text_kh: string;
  text_en: string | null;
};

function normalizeSentence(raw: SentenceResponse): SentenceSpellingSentence {
  return { id: raw.id, textKh: raw.text_kh, textEn: raw.text_en };
}

export async function fetchSentences(): Promise<SentenceSpellingSentence[]> {
  const raw = await apiFetch<SentenceResponse[]>("/api/sentence_spelling/sentences");
  return raw?.map(normalizeSentence) ?? [];
}

/**
 * Best-effort lookup of the sample sentence after `currentId`. A failed fetch
 * just means no "Next sentence" shortcut-it must never break the practice page.
 */
export async function fetchNextSentence(
  currentId: number | undefined
): Promise<SentenceSpellingSentence | null> {
  if (currentId === undefined) return null;
  try {
    return findNextSentence(await fetchSentences(), currentId);
  } catch {
    return null;
  }
}
