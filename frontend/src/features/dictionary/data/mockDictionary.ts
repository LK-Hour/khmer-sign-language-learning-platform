import type { DictionaryWord } from "../types";

const PLACEHOLDER = "/finger-spelling/placeholder-sign.svg";

/** Sample vocabulary aligned with the dictionary design mockup. */
export const mockDictionaryWords: DictionaryWord[] = [
  {
    id: 1,
    textEn: "Water",
    textKh: "ទឹក",
    mediaUrl: PLACEHOLDER,
    category: "common",
  },
  {
    id: 2,
    textEn: "Chair",
    textKh: "ក៏អី",
    mediaUrl: PLACEHOLDER,
    category: "common",
  },
  {
    id: 3,
    textEn: "School",
    textKh: "សាលារៀន",
    mediaUrl: PLACEHOLDER,
    category: "education",
  },
  {
    id: 4,
    textEn: "Class",
    textKh: "ថ្នាក់",
    mediaUrl: PLACEHOLDER,
    category: "education",
  },
  {
    id: 5,
    textEn: "Whiteboard",
    textKh: "ក្តារខៀន",
    mediaUrl: PLACEHOLDER,
    category: "education",
  },
  {
    id: 6,
    textEn: "Teacher (male)",
    textKh: "គ្រូ (ប្រុស)",
    mediaUrl: PLACEHOLDER,
    category: "people",
  },
];

export function getMockDictionaryWord(id: number): DictionaryWord | null {
  return mockDictionaryWords.find((word) => word.id === id) ?? null;
}

export function searchMockDictionaryWords(search?: string): DictionaryWord[] {
  const query = search?.trim().toLowerCase();
  if (!query) return mockDictionaryWords;

  return mockDictionaryWords.filter(
    (word) =>
      word.textEn.toLowerCase().includes(query) ||
      word.textKh.includes(query)
  );
}
