/**
 * Route map — keep finger spelling and words on separate URL trees
 * so both tracks can evolve on the same branch without merge conflicts.
 */

export const ROUTES = {
  home: "/",

  /** App-wide sections (outside finger-spelling URL tree) */
  dictionary: "/dictionary",
  dictionaryWord: (wordId: string | number) => `/dictionary/${wordId}`,
  profile: "/profile",

  fingerSpelling: {
    root: "/finger-spelling",
    unit: (unitId: string | number) => `/finger-spelling/units/${unitId}`,
    unitChapter: (unitId: string | number, chapterId: string | number) =>
      `/finger-spelling/units/${unitId}?chapter=${chapterId}`,
    chapter: (chapterId: string | number) =>
      `/finger-spelling/chapters/${chapterId}`,
    lesson: (lessonId: string | number) =>
      `/finger-spelling/lessons/${lessonId}`,
    exercise: "/finger-spelling/exercise",
    exerciseChapter: (chapterId: string | number) =>
      `/finger-spelling/exercise/${chapterId}`,
    exerciseQuiz: (chapterId: string | number) =>
      `/finger-spelling/exercise/${chapterId}/quiz`,
  },

  words: {
    root: "/words",
  },

  admin: {
    quiz: "/admin/quiz",
  },
} as const;
