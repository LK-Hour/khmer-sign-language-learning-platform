import type { FsChapter, FsLesson, FsLessonDetail, FsUnit } from "../types";

/** Dev mock — replace via API when /api/finger_spelling/* is live */
export const mockUnits: FsUnit[] = [
  {
    id: 1,
    title: "Consonants",
    titleKh: "ព្យញ្ជនៈ",
    category: "basics",
    orderIndex: 1,
    chapterCount: 2,
    completedLessonCount: 3,
    totalLessonCount: 8,
  },
  {
    id: 2,
    title: "Vowels",
    titleKh: "ស្រៈ",
    category: "basics",
    orderIndex: 2,
    chapterCount: 1,
    completedLessonCount: 0,
    totalLessonCount: 4,
  },
];

export const mockChapters: Record<number, FsChapter[]> = {
  1: [
    {
      id: 101,
      unitId: 1,
      title: "Chapter 1",
      titleKh: "ជំពូក ១",
      description: "First group of consonant signs",
      descriptionKh: "ព្យញ្ជនៈក្រុមទីមួយ",
      orderIndex: 1,
      lessonCount: 4,
      completedLessonCount: 2,
      isExerciseUnlocked: false,
    },
    {
      id: 102,
      unitId: 1,
      title: "Chapter 2",
      titleKh: "ជំពូក ២",
      orderIndex: 2,
      lessonCount: 4,
      completedLessonCount: 1,
      isExerciseUnlocked: true,
    },
  ],
  2: [
    {
      id: 201,
      unitId: 2,
      title: "Independent vowels",
      titleKh: "ស្រៈឯករាជ្យ",
      orderIndex: 1,
      lessonCount: 4,
      completedLessonCount: 0,
      isExerciseUnlocked: false,
    },
  ],
};

export const mockLessons: Record<number, FsLesson[]> = {
  101: [
    {
      id: 1001,
      chapterId: 101,
      letter: "ក",
      romanization: "ka",
      letterNameEn: "Ko",
      letterNameKh: "កោ",
      imageUrl: "/finger-spelling/placeholder-sign.svg",
      orderIndex: 1,
      isLocked: false,
      progressStatus: "COMPLETED",
    },
    {
      id: 1002,
      chapterId: 101,
      letter: "ខ",
      romanization: "kha",
      letterNameEn: "Kho",
      letterNameKh: "ខោ",
      imageUrl: "/finger-spelling/placeholder-sign.svg",
      orderIndex: 2,
      isLocked: false,
      progressStatus: "IN_PROGRESS",
    },
    {
      id: 1003,
      chapterId: 101,
      letter: "គ",
      romanization: "ko",
      letterNameEn: "Ko",
      letterNameKh: "គោ",
      imageUrl: "/finger-spelling/placeholder-sign.svg",
      orderIndex: 3,
      isLocked: false,
      progressStatus: "NOT_STARTED",
    },
    {
      id: 1004,
      chapterId: 101,
      letter: "ឃ",
      romanization: "kho",
      letterNameEn: "Kho",
      letterNameKh: "ឃោ",
      imageUrl: "/finger-spelling/placeholder-sign.svg",
      orderIndex: 4,
      isLocked: true,
      progressStatus: "NOT_STARTED",
    },
  ],
};

const lessonDetails: Record<number, FsLessonDetail> = {};
for (const lessons of Object.values(mockLessons)) {
  for (const lesson of lessons) {
    lessonDetails[lesson.id] = {
      ...lesson,
      description: "Practice this hand shape until you can sign it clearly.",
      descriptionKh: "ហាត់សញ្ញាដៃនេះរហូតអាចធ្វើបានច្បាស់លាស់។",
    };
  }
}

export const mockLessonDetails = lessonDetails;

export function getMockUnit(id: number): FsUnit | undefined {
  return mockUnits.find((u) => u.id === id);
}

export function getMockChapters(unitId: number): FsChapter[] {
  return mockChapters[unitId] ?? [];
}

export function getMockChapter(id: number): FsChapter | undefined {
  return Object.values(mockChapters).flat().find((c) => c.id === id);
}

export function getMockLessons(chapterId: number): FsLesson[] {
  return mockLessons[chapterId] ?? [];
}

export function getMockLesson(id: number): FsLessonDetail | undefined {
  return mockLessonDetails[id];
}
