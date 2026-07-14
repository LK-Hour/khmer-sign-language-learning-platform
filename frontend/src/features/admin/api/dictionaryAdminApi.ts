/** Client for the admin dictionary API (/api/admin/dictionary). */

import { apiFetch } from "@/utils/api/client";

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
