/**
 * The sentence that follows `currentId` in the curated list, or `null` when
 * `currentId` is the last one or isn't in the list at all-callers then fall
 * back to "Back" instead of offering a "Next sentence" that goes nowhere.
 */
export function findNextSentence<T extends { id: number }>(
  sentences: readonly T[],
  currentId: number | undefined
): T | null {
  if (currentId === undefined) return null;
  const index = sentences.findIndex((sentence) => sentence.id === currentId);
  if (index === -1) return null;
  return sentences[index + 1] ?? null;
}
