import type { AdminQuizMockContext, AdminQuizQuestion } from "./types";

export const MOCK_CONTEXT: AdminQuizMockContext = {
  track: "Finger Spelling",
  unit: {
    id: "unit-1",
    title: "Khmer Alphabet Foundations",
    title_kh: "មូលដ្ឋានអក្សរខ្មែរ",
  },
  chapter: {
    id: "chapter-1",
    title: "Independent Vowels",
    title_kh: "ស្រៈពេញតួ",
  },
  lessons: [
    { id: "lesson-1", title: "Letter ក" },
    { id: "lesson-2", title: "Letter ខ" },
    { id: "lesson-3", title: "Letter គ" },
  ],
};

export const INITIAL_QUESTIONS: AdminQuizQuestion[] = [
  {
    id: "q1",
    chapter_id: MOCK_CONTEXT.chapter.id,
    lesson_id: MOCK_CONTEXT.lessons[0]?.id ?? null,
    type: "MULTIPLE_CHOICE",
    prompt: "Which Khmer letter matches this hand sign?",
    prompt_kh: "តើអក្សរខ្មែរមួយណាត្រូវនឹងសញ្ញាដៃនេះ?",
    image_url: "",
    options: ["ក", "ខ", "គ", "ឃ"],
    correct_answer: "ក",
    order_index: 1,
    is_active: true,
  },
  {
    id: "q2",
    chapter_id: MOCK_CONTEXT.chapter.id,
    lesson_id: MOCK_CONTEXT.lessons[1]?.id ?? null,
    type: "TEXT_INPUT",
    prompt: "Type the romanization for ខ.",
    prompt_kh: "វាយអក្សរឡាតាំងសម្រាប់ ខ។",
    image_url: "",
    options: [],
    correct_answer: "kha",
    order_index: 2,
    is_active: true,
  },
];
