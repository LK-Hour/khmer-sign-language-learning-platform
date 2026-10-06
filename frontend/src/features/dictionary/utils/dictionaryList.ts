import type {
  DictionaryEntryType,
  DictionarySection,
  DictionaryWord,
} from "../types";

/**
 * The backend already returns entries in curriculum order
 * (see backend dictionary_order.py), so these helpers only filter and group;
 * they never re-sort.
 */

export function matchesDictionarySearch(
  word: DictionaryWord,
  query: string,
  extraFields: (string | null | undefined)[] = [],
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [word.textEn, word.textKh, word.description, word.category, ...extraFields]
    .some((value) => (value ?? "").toLowerCase().includes(normalizedQuery));
}

export function filterByEntryType(
  words: DictionaryWord[],
  entryType: DictionaryEntryType,
): DictionaryWord[] {
  return words.filter((word) => word.entryType === entryType);
}

export function groupDictionaryWords(words: DictionaryWord[]): DictionarySection[] {
  const sections: DictionarySection[] = [];
  const byCategory = new Map<string, DictionarySection>();

  for (const word of words) {
    const category = word.category ?? "";
    let section = byCategory.get(category);
    if (!section) {
      section = { category, words: [] };
      byCategory.set(category, section);
      sections.push(section);
    }
    section.words.push(word);
  }

  return sections;
}

/**
 * The backend falls back to the unit name when a character has no
 * description; that just repeats the category, so treat it as missing.
 */
export function getDictionaryDescription(word: DictionaryWord): string | null {
  const description = word.description?.trim();
  if (!description || description === word.category) return null;
  return description;
}

/** Previous/next entries of the same type, plus siblings from the same unit. */
export function getDictionaryNeighbors(
  words: DictionaryWord[],
  current: DictionaryWord,
) {
  const sameType = filterByEntryType(words, current.entryType);
  const index = sameType.findIndex((word) => word.id === current.id);

  return {
    previous: index > 0 ? sameType[index - 1] : null,
    next: index >= 0 && index < sameType.length - 1 ? sameType[index + 1] : null,
    siblings: sameType.filter((word) => word.category === current.category),
  };
}

export function sectionAnchorId(category: string): string {
  return `unit-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
