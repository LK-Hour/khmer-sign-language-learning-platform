/** Client for admin lesson junction management API.
 *
 * Manages FingerLessonLetter and WordDetectionLessonWord associations.
 * Pattern: /api/admin/{track}/lessons/{lessonId}/letters (finger)
 *          /api/admin/{track}/lessons/{lessonId}/words (word_detection)
 */

import { apiFetch } from "@/utils/api/client";
import type { AdminTrack } from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface LessonLetterItem {
  id: number;
  lesson_id: number;
  letter_id: number;
  order_index: number;
  letter?: {
    id: number;
    letter_en: string | null;
    letter_kh: string;
    is_active: boolean;
  };
}

export interface LessonWordItem {
  id: number;
  lesson_id: number;
  word_id: number;
  order_index: number;
  word?: {
    id: number;
    word_en: string | null;
    word_kh: string;
    is_active: boolean;
  };
}

export interface AddLessonLetterPayload {
  letter_id: number;
  order_index: number;
}

export interface AddLessonWordPayload {
  word_id: number;
  order_index: number;
}

// ── API Functions ────────────────────────────────────────────────────────────

const base = (track: AdminTrack) => `/api/admin/${track}`;

/** Get lesson letters (FingerLessonLetter junction items). */
export const getLessonLetters = (track: AdminTrack, lessonId: number) =>
  apiFetch<LessonLetterItem[]>(`${base(track)}/lessons/${lessonId}/letters`);

/** Add a letter to a lesson. */
export const addLessonLetter = (
  track: AdminTrack,
  lessonId: number,
  body: AddLessonLetterPayload,
) =>
  apiFetch<LessonLetterItem>(`${base(track)}/lessons/${lessonId}/letters`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Remove a letter from a lesson. */
export const removeLessonLetter = (
  track: AdminTrack,
  lessonId: number,
  letterId: number,
) =>
  apiFetch<void>(`${base(track)}/lessons/${lessonId}/letters/${letterId}`, {
    method: "DELETE",
  });

/** Get lesson words (WordDetectionLessonWord junction items). */
export const getLessonWords = (track: AdminTrack, lessonId: number) =>
  apiFetch<LessonWordItem[]>(`${base(track)}/lessons/${lessonId}/words`);

/** Add a word to a lesson. */
export const addLessonWord = (
  track: AdminTrack,
  lessonId: number,
  body: AddLessonWordPayload,
) =>
  apiFetch<LessonWordItem>(`${base(track)}/lessons/${lessonId}/words`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Remove a word from a lesson. */
export const removeLessonWord = (
  track: AdminTrack,
  lessonId: number,
  wordId: number,
) =>
  apiFetch<void>(`${base(track)}/lessons/${lessonId}/words/${wordId}`, {
    method: "DELETE",
  });
