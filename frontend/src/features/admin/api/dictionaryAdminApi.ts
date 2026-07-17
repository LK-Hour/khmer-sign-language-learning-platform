/** Client for the admin dictionary API (/api/admin/dictionary). */

import { apiFetch } from "@/utils/api/client";
import type { MediaResponse } from "./mediaAdminApi";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DictionaryItem {
  id: number;
  name_en: string | null;
  name_kh: string;
  media_count: number;
  is_active: boolean;
  created_at: string;
}

export interface PaginatedDictionaryResponse {
  items: DictionaryItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ListDictionaryParams {
  page?: number;
  size?: number;
  search?: string;
}

/** Detailed letter/word record returned from individual GET endpoints. */
export interface LetterDetail {
  id: number;
  letter_en: string | null;
  letter_kh: string;
  description_en: string | null;
  description_kh: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  medias: MediaResponse[];
}

export interface WordDetail {
  id: number;
  word_en: string | null;
  word_kh: string;
  description_en: string | null;
  description_kh: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  medias: MediaResponse[];
}

/** Payload for creating/updating a letter. */
export interface LetterPayload {
  letter_en: string;
  letter_kh: string;
  description_en?: string | null;
  description_kh?: string | null;
  is_active?: boolean;
}

/** Payload for creating/updating a word. */
export interface WordPayload {
  word_en: string;
  word_kh: string;
  description_en?: string | null;
  description_kh?: string | null;
  is_active?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

// ── API Functions ────────────────────────────────────────────────────────────

/** List finger letters (characters) with optional pagination and search. */
export const listCharacters = (params: ListDictionaryParams = {}) =>
  apiFetch<PaginatedDictionaryResponse>(
    `/api/admin/dictionary/characters${buildQuery(params as Record<string, unknown>)}`,
  );

/** List word detection words with optional pagination and search. */
export const listWords = (params: ListDictionaryParams = {}) =>
  apiFetch<PaginatedDictionaryResponse>(
    `/api/admin/dictionary/words${buildQuery(params as Record<string, unknown>)}`,
  );

// ── Individual Letter CRUD ───────────────────────────────────────────────────

/** Get a single letter by ID with its media associations. */
export const getCharacter = (id: number) =>
  apiFetch<LetterDetail>(`/api/admin/dictionary/characters/${id}`);

/** Create a new letter. */
export const createCharacter = (body: LetterPayload) =>
  apiFetch<LetterDetail>(`/api/admin/dictionary/characters`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Update an existing letter. */
export const updateCharacter = (id: number, body: Partial<LetterPayload>) =>
  apiFetch<LetterDetail>(`/api/admin/dictionary/characters/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

// ── Individual Word CRUD ─────────────────────────────────────────────────────

/** Get a single word by ID with its media associations. */
export const getWord = (id: number) =>
  apiFetch<WordDetail>(`/api/admin/dictionary/words/${id}`);

/** Create a new word. */
export const createWord = (body: WordPayload) =>
  apiFetch<WordDetail>(`/api/admin/dictionary/words`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Update an existing word. */
export const updateWord = (id: number, body: Partial<WordPayload>) =>
  apiFetch<WordDetail>(`/api/admin/dictionary/words/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

/** Delete a letter. */
export const deleteCharacter = (id: number) =>
  apiFetch<void>(`/api/admin/dictionary/characters/${id}`, {
    method: "DELETE",
  });

/** Delete a word. */
export const deleteWord = (id: number) =>
  apiFetch<void>(`/api/admin/dictionary/words/${id}`, {
    method: "DELETE",
  });
