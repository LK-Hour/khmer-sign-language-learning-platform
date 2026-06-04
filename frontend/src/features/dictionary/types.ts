export interface DictionaryWord {
  id: number;
  textEn: string;
  textKh: string;
  /** Image or video poster URL */
  mediaUrl?: string | null;
  /** When set, detail view plays sign video */
  videoUrl?: string | null;
  category?: string | null;
}

export interface DictionarySearchResult {
  items: DictionaryWord[];
  total: number;
}
