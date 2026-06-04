import type { FsChapter, FsLesson, FsLessonDetail, FsUnit } from "../types";

/** Dev mock — replace via API when /api/finger_spelling/* is live */
export const mockUnits: FsUnit[] = [
  {
    id: 1,
    title: "Main Consonants",
    titleKh: "ព្យញ្ជនៈរួម",
    category: "basics",
    orderIndex: 1,
    chapterCount: 2,
    completedLessonCount: 4,
    totalLessonCount: 7,
    isLocked: false,
  },
  {
    id: 2,
    title: "Sub Consonants",
    titleKh: "ព្យញ្ជនៈរង",
    category: "basics",
    orderIndex: 2,
    chapterCount: 1,
    completedLessonCount: 0,
    totalLessonCount: 4,
    isLocked: true,
  },
  {
    id: 3,
    title: "Dependent Vowels",
    titleKh: "ស្រៈអ្យក់",
    category: "vowels",
    orderIndex: 3,
    chapterCount: 1,
    completedLessonCount: 0,
    totalLessonCount: 4,
    isLocked: true,
  },
  {
    id: 4,
    title: "Independent Vowels",
    titleKh: "ស្រៈឯករាជ្យ",
    category: "vowels",
    orderIndex: 4,
    chapterCount: 1,
    completedLessonCount: 0,
    totalLessonCount: 4,
    isLocked: true,
  },
];

export const mockChapters: Record<number, FsChapter[]> = {
  1: [
    {
      id: 101,
      unitId: 1,
      title: "Foundation Hand Shapes",
      titleKh: "រូបរាងដៃមូលដ្ឋាន",
      description: "Foundation Hand Shape ក - ឃ",
      descriptionKh: "រូបរាងដៃមូលដ្ឋាន ក - ឃ",
      orderIndex: 1,
      lessonCount: 5,
      completedLessonCount: 3,
      isExerciseUnlocked: false,
      isLocked: false,
    },
    {
      id: 102,
      unitId: 1,
      title: "Finger Spelling Accuracy",
      titleKh: "ភាពត្រឹមត្រូវ",
      description: "Finger Spelling Accuracy ច - ឆ",
      descriptionKh: "ភាពត្រឹមត្រូវ ច - ឆ",
      orderIndex: 2,
      lessonCount: 2,
      completedLessonCount: 1,
      isExerciseUnlocked: true,
      isLocked: false,
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
      isLocked: true,
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
      letterNameEn: "Character Ka",
      letterNameKh: "កោ",
      imageUrl: "/finger-spelling/placeholder-sign.svg",
      orderIndex: 1,
      isLocked: false,
      progressStatus: "COMPLETED",
      progressPercent: 96,
    },
    {
      id: 1002,
      chapterId: 101,
      letter: "ខ",
      romanization: "kha",
      letterNameEn: "Character Kha",
      letterNameKh: "ខោ",
      imageUrl: "/finger-spelling/placeholder-sign.svg",
      orderIndex: 2,
      isLocked: false,
      progressStatus: "COMPLETED",
      progressPercent: 94,
    },
    {
      id: 1003,
      chapterId: 101,
      letter: "គ",
      romanization: "ko",
      letterNameEn: "Character Ko",
      letterNameKh: "គោ",
      imageUrl: "/finger-spelling/placeholder-sign.svg",
      orderIndex: 3,
      isLocked: false,
      progressStatus: "COMPLETED",
      progressPercent: 83,
    },
    {
      id: 1004,
      chapterId: 101,
      letter: "ឃ",
      romanization: "kho",
      letterNameEn: "Character Kho",
      letterNameKh: "ឃោ",
      imageUrl: "/finger-spelling/placeholder-sign.svg",
      orderIndex: 4,
      isLocked: false,
      progressStatus: "IN_PROGRESS",
      progressPercent: 42,
    },
    {
      id: 1005,
      chapterId: 101,
      letter: "ង",
      romanization: "ngo",
      letterNameEn: "Character Ngo",
      letterNameKh: "ងោ",
      imageUrl: "/finger-spelling/placeholder-sign.svg",
      orderIndex: 5,
      isLocked: true,
      progressStatus: "NOT_STARTED",
      progressPercent: 0,
    },
  ],
  102: [
    {
      id: 1006,
      chapterId: 102,
      letter: "ច",
      romanization: "ca",
      letterNameEn: "Character Ca",
      letterNameKh: "ចោ",
      imageUrl: "/finger-spelling/placeholder-sign.svg",
      orderIndex: 1,
      isLocked: false,
      progressStatus: "COMPLETED",
      progressPercent: 100,
    },
    {
      id: 1007,
      chapterId: 102,
      letter: "ឆ",
      romanization: "cha",
      letterNameEn: "Character Cha",
      letterNameKh: "ឆោ",
      imageUrl: "/finger-spelling/placeholder-sign.svg",
      orderIndex: 2,
      isLocked: false,
      progressStatus: "NOT_STARTED",
      progressPercent: 0,
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
