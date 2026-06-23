import { apiFetch } from "@/utils/api/client";
import type { DictionaryWord } from "../types";
import { resolveApiAssetUrl } from "./config";

type BackendDictionaryWord = {
  id: number;
  text_en: string;
  text_kh: string;
  media_url?: string | null;
  video_url?: string | null;
  category?: string | null;
  entry_type?: "character" | "word" | null;
  description?: string | null;
  lesson_id?: number | null;
};

type BackendDictionaryListResponse = {
  items: BackendDictionaryWord[];
  total: number;
  page: number;
  page_size: number;
  character_count: number;
  word_count: number;
};

function normalizeWord(raw: BackendDictionaryWord): DictionaryWord {
  return {
    id: raw?.id,
    textEn: raw?.text_en,
    textKh: raw?.text_kh,
    mediaUrl: resolveApiAssetUrl(raw?.media_url ?? undefined) ?? null,
    videoUrl: resolveApiAssetUrl(raw?.video_url ?? undefined) ?? null,
    category: raw?.category ?? null,
    entryType: raw?.entry_type ?? "character",
    description: raw?.description ?? null,
    lessonId: raw?.lesson_id ?? null,
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
