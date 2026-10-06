const KHMER_SCRIPT = /[\u1780-\u17FF\u19E0-\u19FF]/;

/** Khmer sign character for lesson rows-matches lesson detail display. */
export function getLessonDisplayLetter(lesson: {
  letter: string;
  letterNameKh?: string | null;
  letterNameEn?: string | null;
  romanization?: string | null;
}): string {
  const candidates = [
    lesson?.letter,
    lesson?.letterNameKh,
    lesson?.letterNameEn,
    lesson?.romanization,
  ];

  return (
    candidates.find((value) => value && KHMER_SCRIPT.test(value)) ??
    lesson?.letter ??
    lesson?.letterNameKh ??
    lesson?.letterNameEn ??
    lesson?.romanization ??
    ""
  );
}

/** Letter range shown on the chapter practice track row. */
export function getPracticeDisplayRange(
  lessons: Array<{
    orderIndex: number;
    letter: string;
    letterNameKh?: string | null;
    letterNameEn?: string | null;
    romanization?: string | null;
  }>
): string {
  const sorted = [...lessons].sort((a, b) => a.orderIndex - b.orderIndex);
  if (sorted.length === 0) return "";

  const first = getLessonDisplayLetter(sorted[0]);
  const last = getLessonDisplayLetter(sorted[sorted.length - 1]);
  return first === last ? first : `${first} - ${last}`;
}
