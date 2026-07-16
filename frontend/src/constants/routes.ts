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
    lesson: (lessonId: string | number) =>
      `/finger-spelling/lessons/${lessonId}`,
    practice: (chapterId: string | number) =>
      `/finger-spelling/chapters/${chapterId}/practice`,
    exercises: "/finger-spelling/exercises",
    exercise: (unitId: string | number) =>
      `/finger-spelling/units/${unitId}/exercise`,
  },

  words: {
    root: "/words",
    lesson: (lessonId: string | number) => `/words/lessons/${lessonId}`,
    practice: (chapterId: string | number) =>
      `/words/chapters/${chapterId}/practice`,
  },

  admin: {
    root: "/admin",
    curriculum: "/admin/curriculum",
    quiz: "/admin/learning/quiz",
    users: "/admin/users",
    media: "/admin/media",
    analytics: "/admin/analytics",
    contributions: "/admin/contributions",
  },
} as const;
