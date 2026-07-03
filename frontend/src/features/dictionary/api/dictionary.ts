import { apiFetch } from "@/utils/api/client";
import type { DictionaryWord } from "../types";
import { resolveApiAssetUrl } from "./config";

type BackendDictionaryWord = {
  id: number;
  text_en: string;
  text_kh: string;
  entry_type: "character" | "word";
  media_url?: string | null;
  video_url?: string | null;
  category?: string | null;
  description?: string | null;
  lesson_id?: number | null;
  level?: number | null;
};

type BackendDictionaryListResponse = {
  items: BackendDictionaryWord[];
  total: number;
  page: number;
  page_size: number;
  character_count: number;
  word_count: number;
};

function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return resolveApiAssetUrl(url) ?? url;
}

function normalizeWord(raw: BackendDictionaryWord): DictionaryWord {
  return {
    id: raw.id,
    textEn: raw.text_en,
    textKh: raw.text_kh,
    entryType: raw.entry_type,
    mediaUrl: resolveMediaUrl(raw.media_url),
    videoUrl: resolveMediaUrl(raw.video_url),
    category: raw.category ?? null,
    description: raw.description ?? null,
    lessonId: raw.lesson_id ?? null,
    level: raw.level ?? null,
  };
}

/** Load the full dictionary in one request (dataset is small). */
export async function fetchAllDictionaryWords(): Promise<DictionaryWord[]> {
  const raw = await apiFetch<BackendDictionaryListResponse>(
    "/api/dictionary?page=1&page_size=500&sort=default",
  );
  return raw?.items?.map(normalizeWord) ?? [];
}

export async function fetchDictionaryWord(
  wordId: number,
): Promise<DictionaryWord | null> {
  try {
    const raw = await apiFetch<BackendDictionaryWord>(
      `/api/dictionary/${wordId}`,
    );
    return normalizeWord(raw);
  } catch {
    return null;
  }
}
