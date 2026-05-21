/**
 * Route map — keep finger spelling and words on separate URL trees
 * so both tracks can evolve on the same branch without merge conflicts.
 */

export const ROUTES = {
  home: "/",

  fingerSpelling: {
    root: "/finger-spelling",
    unit: (unitId: string | number) => `/finger-spelling/units/${unitId}`,
    chapter: (chapterId: string | number) =>
      `/finger-spelling/chapters/${chapterId}`,
    lesson: (lessonId: string | number) =>
      `/finger-spelling/lessons/${lessonId}`,
    practice: "/finger-spelling/practice",
    dictionary: "/finger-spelling/dictionary",
    profile: "/finger-spelling/profile",
  },

  words: {
    root: "/words",
  },

  admin: {
    quiz: "/admin/quiz",
  },
} as const;
