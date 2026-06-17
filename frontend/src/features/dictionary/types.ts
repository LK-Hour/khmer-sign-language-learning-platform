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

export interface DictionarySearchResult {
  items: DictionaryWord[];
  total: number;
}

export type DictionarySortOrder = "az" | "za";

export type DictionaryTypeFilter = "all" | DictionaryEntryType;
