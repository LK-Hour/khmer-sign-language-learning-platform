/**
 * Reference-image lookup for individual Khmer characters, backed by the
 * finger-spelling `finger_letter_medias`/`medias` tables.
 */

import { apiFetch } from "@/utils/api/client";

type LetterMediaResponse = {
  items: { letterKh: string; imageUrl: string }[];
};

/** Batch-resolves reference sign images for a set of characters. */
export async function fetchLetterMedia(chars: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(chars));
  if (unique.length === 0) return {};

  const params = new URLSearchParams();
  unique.forEach((char) => params.append("chars", char));

  const raw = await apiFetch<LetterMediaResponse>(
    `/api/finger_spelling/letters/media?${params.toString()}`
  );

  const map: Record<string, string> = {};
  raw?.items?.forEach((item) => {
    map[item.letterKh] = item.imageUrl;
  });
  return map;
}
