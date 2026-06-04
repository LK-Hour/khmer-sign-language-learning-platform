import {
  getMockDictionaryWord,
  searchMockDictionaryWords,
} from "../data/mockDictionary";
import type { DictionarySearchResult, DictionaryWord } from "../types";
import { DICT_USE_MOCK, resolveApiAssetUrl } from "./config";
import { dictFetch } from "./client";

type BackendDictionaryWord = {
  id: number;
  text_en: string;
  text_kh: string;
  media_url?: string | null;
  video_url?: string | null;
  category?: string | null;
};

type BackendDictionaryListResponse = {
  items: BackendDictionaryWord[];
  total: number;
};

function normalizeWord(raw: BackendDictionaryWord): DictionaryWord {
  return {
    id: raw.id,
    textEn: raw.text_en,
    textKh: raw.text_kh,
    mediaUrl: resolveApiAssetUrl(raw.media_url ?? undefined) ?? null,
    videoUrl: resolveApiAssetUrl(raw.video_url ?? undefined) ?? null,
    category: raw.category ?? null,
  };
}

export async function fetchDictionaryWords(
  search?: string
): Promise<DictionarySearchResult> {
  if (DICT_USE_MOCK) {
    const items = searchMockDictionaryWords(search);
    return { items, total: items.length };
  }

  const params = new URLSearchParams();
  if (search?.trim()) params.set("search", search.trim());
  const query = params.toString();
  const path = query ? `/api/dictionary?${query}` : "/api/dictionary";

  const raw = await dictFetch<BackendDictionaryListResponse>(path);
  const items = raw.items.map(normalizeWord);
  return { items, total: raw.total ?? items.length };
}

export async function fetchDictionaryWord(
  wordId: number
): Promise<DictionaryWord | null> {
  if (DICT_USE_MOCK) {
    return getMockDictionaryWord(wordId);
  }

  try {
    const raw = await dictFetch<BackendDictionaryWord>(
      `/api/dictionary/${wordId}`
    );
    return normalizeWord(raw);
  } catch {
    return null;
  }
}
