export type SampleSentence = {
  id: string;
  textKh: string;
  textEn: string;
  wordCount: number;
};

/**
 * Hard-coded placeholder set until the sentence-spelling curriculum has a backend.
 */
export const SAMPLE_SENTENCES: SampleSentence[] = [
  { id: "s1", textKh: "ខ្ញុំទៅសាលារៀន", textEn: "I go to school", wordCount: 4 },
  { id: "s2", textKh: "គ្រូបង្រៀនខ្ញុំចិត្តល្អ", textEn: "My teacher is kind", wordCount: 4 },
  { id: "s3", textKh: "ខ្ញុំចូលចិត្តអានសៀវភៅ", textEn: "I like to read books", wordCount: 5 },
  { id: "s4", textKh: "ខ្ញុំធ្វើកិច្ចការផ្ទះរាល់ថ្ងៃ", textEn: "I do my homework every day", wordCount: 6 },
  { id: "s5", textKh: "ថ្នាក់រៀនរបស់ខ្ញុំស្អាត", textEn: "My classroom is clean", wordCount: 4 },
  { id: "s6", textKh: "ខ្ញុំរៀនភាសាខ្មែរ", textEn: "I study the Khmer language", wordCount: 5 },
];
