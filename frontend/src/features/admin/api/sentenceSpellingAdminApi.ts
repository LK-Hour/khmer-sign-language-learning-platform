/** Client for the admin sentence-spelling API (/api/admin/sentence_spelling). */

import { apiFetch } from "@/utils/api/client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SentenceItem {
  id: number;
  text_kh: string;
  text_en: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedSentenceResponse {
  items: SentenceItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ListSentenceParams {
  page?: number;
  size?: number;
  search?: string;
}

/** Payload for creating/updating a sentence. */
export interface SentencePayload {
  text_kh: string;
  text_en?: string | null;
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

/** List sentences with optional pagination and search. */
export const listSentences = (params: ListSentenceParams = {}) =>
  apiFetch<PaginatedSentenceResponse>(
    `/api/admin/sentence_spelling/sentences${buildQuery(params as Record<string, unknown>)}`,
  );

/** Get a single sentence by ID. */
export const getSentence = (id: number) =>
  apiFetch<SentenceItem>(`/api/admin/sentence_spelling/sentences/${id}`);

/** Create a new sentence. */
export const createSentence = (body: SentencePayload) =>
  apiFetch<SentenceItem>(`/api/admin/sentence_spelling/sentences`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Update an existing sentence. */
export const updateSentence = (id: number, body: Partial<SentencePayload>) =>
  apiFetch<SentenceItem>(`/api/admin/sentence_spelling/sentences/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

/** Delete a sentence. */
export const deleteSentence = (id: number) =>
  apiFetch<void>(`/api/admin/sentence_spelling/sentences/${id}`, {
    method: "DELETE",
  });
