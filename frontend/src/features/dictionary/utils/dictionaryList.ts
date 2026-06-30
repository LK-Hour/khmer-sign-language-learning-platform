import type {
  DictionarySortOrder,
  DictionaryTypeFilter,
  DictionaryWord,
} from "../types";
import { DICTIONARY_PAGE_SIZE } from "../types";

/** Keep in sync with backend dictionary_order.py */
const DICTIONARY_UNIT_ORDER: Record<string, number> = {
  Numbers: 0,
  "Dependent Vowels": 1,
  "Main Consonants": 2,
  "Sub Consonants": 3,
  "Independent Vowels": 4,
  Diacritics: 5,
};

const UNIT_LETTER_ORDERS: Record<string, string[]> = {
  Numbers: ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"],
  "Dependent Vowels": [
    "ា", "ិ", "ី", "ឹ", "ឺ", "ុ", "ូ", "ួ", "ើ", "ឿ", "ៀ", "េ", "ែ", "ៃ",
    "ោ", "ៅ", "ុំ", "ំ", "ាំ", "ះ", "ុះ", "េះ", "ោះ",
  ],
  "Main Consonants": [
    "ក", "ខ", "គ", "ឃ", "ង", "ច", "ឆ", "ជ", "ឈ", "ញ", "ដ", "ឋ", "ឌ", "ឍ",
    "ណ", "ត", "ថ", "ទ", "ធ", "ន", "ប", "ផ", "ព", "ភ", "ម", "យ", "រ", "ល",
    "វ", "ស", "ហ", "ឡ", "អ",
  ],
  "Sub Consonants": [
    "្ក", "្ខ", "្គ", "្ឃ", "្ង", "្ច", "្ឆ", "្ជ", "្ឈ", "្ញ", "្ដ", "្ឋ",
    "្ឌ", "្ឍ", "្ណ", "្ត", "្ថ", "្ទ", "្ធ", "្ន", "្ប", "្ផ", "្ព", "្ភ",
    "្ម", "្យ", "្រ", "្ល", "្វ", "្ស", "្ហ", "្អ",
  ],
  "Independent Vowels": [
    "ឣ", "ឤ", "ឥ", "ឦ", "ឧ", "ឩ", "ឫ", "ឬ", "ឭ", "ឮ", "ឯ", "ឰ", "ឱ", "ឳ",
  ],
  Diacritics: [
    "់", "៉", "៊", "៌", "៍", "៎", "៏", "័", "។", "។ល។", "៖", "ៗ", "៚", "!", "?",
  ],
};

const LETTER_INDEX = new Map<string, number>(
  Object.entries(UNIT_LETTER_ORDERS).flatMap(([unitName, letters]) =>
    letters.map((letter, index) => [`${unitName}:${letter}`, index]),
  ),
);

type DictionaryListFilters = {
  search?: string;
  entryType?: DictionaryTypeFilter;
  sort?: DictionarySortOrder;
};

function dictionaryUnitRank(category: string | null | undefined): number {
  return DICTIONARY_UNIT_ORDER[category ?? ""] ?? 99;
}

function dictionaryLetterIndex(
  category: string | null | undefined,
  textKh: string,
): number {
  const normalized = textKh.trim();
  if (!normalized) return 9999;
  return LETTER_INDEX.get(`${category ?? ""}:${normalized}`) ?? 9999;
}

function dictionarySortKey(word: DictionaryWord): [number, number, string] {
  return [
    dictionaryUnitRank(word.category),
    dictionaryLetterIndex(word.category, word.textKh),
    word.textKh,
  ];
}

function compareSortKeys(
  left: [number, number, string],
  right: [number, number, string],
): number {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] < right[index]) return -1;
    if (left[index] > right[index]) return 1;
  }
  return 0;
}

export function matchesDictionarySearch(
  word: DictionaryWord,
  query: string,
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const fields = [
    word.textEn,
    word.textKh,
    word.description,
    word.category,
  ];

  return fields.some((value) =>
    (value ?? "").toLowerCase().includes(normalizedQuery),
  );
}

export function matchesDictionaryType(
  word: DictionaryWord,
  entryType: DictionaryTypeFilter,
): boolean {
  if (entryType === "all") return true;
  return word.entryType === entryType;
}

export function filterDictionaryWords(
  words: DictionaryWord[],
  { search = "", entryType = "all" }: DictionaryListFilters,
): DictionaryWord[] {
  return words.filter(
    (word) =>
      matchesDictionarySearch(word, search) &&
      matchesDictionaryType(word, entryType),
  );
}

export function sortDictionaryWords(
  words: DictionaryWord[],
  sort: DictionarySortOrder = "default",
): DictionaryWord[] {
  const sorted = [...words].sort((left, right) =>
    compareSortKeys(dictionarySortKey(left), dictionarySortKey(right)),
  );

  if (sort === "za") {
    return sorted.reverse();
  }

  return sorted;
}

export function paginateDictionaryWords(
  words: DictionaryWord[],
  page: number,
  pageSize = DICTIONARY_PAGE_SIZE,
): DictionaryWord[] {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return words.slice(start, start + pageSize);
}

export function countDictionaryEntryTypes(words: DictionaryWord[]): {
  characterCount: number;
  wordCount: number;
} {
  let characterCount = 0;
  let wordCount = 0;

  for (const word of words) {
    if (word.entryType === "word") {
      wordCount += 1;
    } else {
      characterCount += 1;
    }
  }

  return { characterCount, wordCount };
}
