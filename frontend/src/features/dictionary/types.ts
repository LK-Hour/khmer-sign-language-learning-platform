export type DictionaryEntryType = "character" | "word";

export interface DictionaryWord {
  id: number;
  textEn: string;
  textKh: string;
  entryType: DictionaryEntryType;
  /** Image or video poster URL */
  mediaUrl?: string | null;
  /** When set, detail view plays sign video instead of the image */
  videoUrl?: string | null;
  category?: string | null;
  description?: string | null;
  /** Linked lesson for practice */
  lessonId?: number | null;
  /** Curriculum chapter level (1, 2, 3, …) */
  level?: number | null;
}

export type DictionarySortOrder = "default" | "az" | "za";

export type DictionaryTypeFilter = "all" | DictionaryEntryType;

export const DICTIONARY_PAGE_SIZE = 12;
