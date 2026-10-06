/** Word range shown on the chapter practice track row. */
export function getPracticeDisplayRange(
  lessons: Array<{ orderIndex: number; word: string }>
): string {
  const sorted = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);
  if (sorted.length === 0) return "";
  const first = sorted[0]?.word?.trim() ?? "";
  const last = sorted[sorted.length - 1]?.word?.trim() ?? "";
  if (!first) return "";
  return first === last ? first : `${first} - ${last}`;
}
