export type DictionaryEntryType = "character" | "word";

export interface DictionaryWord {
  id: number;
  textEn: string;
  textKh: string;
  /** Image or video poster URL */
  mediaUrl?: string | null;
  /** When set, detail view plays sign video */
  videoUrl?: string | null;
  category?: string | null;
  entryType?: DictionaryEntryType | null;
  description?: string | null;
  /** Linked finger-spelling lesson for practice */
  lessonId?: number | null;
}

export type DictionarySortOrder = "default" | "az" | "za";

export type DictionaryTypeFilter = "all" | DictionaryEntryType;

export const DICTIONARY_PAGE_SIZE = 12;
