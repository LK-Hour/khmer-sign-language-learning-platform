export type CustomSentenceHistoryEntry = {
  id: string;
  text: string;
  practicedAt: string;
};

/**
 * Hard-coded placeholder set until custom sentence history has a backend.
 */
export const CUSTOM_SENTENCE_HISTORY: CustomSentenceHistoryEntry[] = [
  { id: "h1", text: "ខ្ញុំចង់ទៅលេងសួនច្បារ", practicedAt: "2026-09-03" },
  { id: "h2", text: "គ្រួសារខ្ញុំមានបួននាក់", practicedAt: "2026-09-01" },
  { id: "h3", text: "ថ្ងៃនេះខ្ញុំសប្បាយចិត្ត", practicedAt: "2026-08-28" },
];
