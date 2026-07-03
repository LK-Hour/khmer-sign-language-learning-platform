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
  },

  words: {
    root: "/words",
    lesson: (lessonId: string | number) => `/words/lessons/${lessonId}`,
  },

  admin: {
    root: "/admin",
    curriculum: "/admin/curriculum",
    exercises: "/admin/exercises",
    quiz: "/admin/quiz",
  },
} as const;
