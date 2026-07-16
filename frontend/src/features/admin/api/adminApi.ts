/** Client for the centralized admin API (single admin role, confirm-publish workflow).
 *
 * Create/update responses come back as drafts; the publish* calls are the
 * explicit confirm actions that make content learner-visible.
 */

import { apiFetch } from "@/utils/api/client";
import type {
  AdminChapter,
  AdminChapterPayload,
  AdminExercise,
  AdminExercisePayload,
  AdminExerciseOption,
  AdminExerciseOptionPayload,
  AdminLesson,
  AdminLessonPayload,
  AdminTrack,
  AdminUnit,
  AdminUnitPayload,
} from "./types";

const base = (track: AdminTrack) => `/api/admin/${track}`;

// ── Units ────────────────────────────────────────────────────────────────────

export const listUnits = (track: AdminTrack) =>
  apiFetch<AdminUnit[]>(`${base(track)}/units`);

export const getUnit = (track: AdminTrack, id: number) =>
  apiFetch<AdminUnit>(`${base(track)}/units/${id}`);

export const createUnit = (track: AdminTrack, body: AdminUnitPayload) =>
  apiFetch<AdminUnit>(`${base(track)}/units`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateUnit = (
  track: AdminTrack,
  id: number,
  body: Partial<AdminUnitPayload>,
) =>
  apiFetch<AdminUnit>(`${base(track)}/units/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const deleteUnit = (track: AdminTrack, id: number) =>
  apiFetch<AdminUnit>(`${base(track)}/units/${id}`, { method: "DELETE" });

export const restoreUnit = (track: AdminTrack, id: number) =>
  apiFetch<AdminUnit>(`${base(track)}/units/${id}/restore`, { method: "POST" });

export const publishUnit = (track: AdminTrack, id: number) =>
  apiFetch<AdminUnit>(`${base(track)}/units/${id}/publish`, { method: "POST" });

// ── Chapters ─────────────────────────────────────────────────────────────────

export const listChapters = (track: AdminTrack, unitId?: number) =>
  apiFetch<AdminChapter[]>(
    `${base(track)}/chapters${unitId ? `?unit_id=${unitId}` : ""}`,
  );

export const getChapter = (track: AdminTrack, id: number) =>
  apiFetch<AdminChapter>(`${base(track)}/chapters/${id}`);

export const createChapter = (track: AdminTrack, body: AdminChapterPayload) =>
  apiFetch<AdminChapter>(`${base(track)}/chapters`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateChapter = (
  track: AdminTrack,
  id: number,
  body: Partial<AdminChapterPayload>,
) =>
  apiFetch<AdminChapter>(`${base(track)}/chapters/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const deleteChapter = (track: AdminTrack, id: number) =>
  apiFetch<AdminChapter>(`${base(track)}/chapters/${id}`, { method: "DELETE" });

export const restoreChapter = (track: AdminTrack, id: number) =>
  apiFetch<AdminChapter>(`${base(track)}/chapters/${id}/restore`, {
    method: "POST",
  });

export const publishChapter = (track: AdminTrack, id: number) =>
  apiFetch<AdminChapter>(`${base(track)}/chapters/${id}/publish`, {
    method: "POST",
  });

// ── Lessons ──────────────────────────────────────────────────────────────────

export const listLessons = (track: AdminTrack, chapterId?: number) =>
  apiFetch<AdminLesson[]>(
    `${base(track)}/lessons${chapterId ? `?chapter_id=${chapterId}` : ""}`,
  );

export const getLesson = (track: AdminTrack, id: number) =>
  apiFetch<AdminLesson>(`${base(track)}/lessons/${id}`);

export const createLesson = (track: AdminTrack, body: AdminLessonPayload) =>
  apiFetch<AdminLesson>(`${base(track)}/lessons`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateLesson = (
  track: AdminTrack,
  id: number,
  body: Partial<AdminLessonPayload>,
) =>
  apiFetch<AdminLesson>(`${base(track)}/lessons/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const deleteLesson = (track: AdminTrack, id: number) =>
  apiFetch<AdminLesson>(`${base(track)}/lessons/${id}`, { method: "DELETE" });

export const restoreLesson = (track: AdminTrack, id: number) =>
  apiFetch<AdminLesson>(`${base(track)}/lessons/${id}/restore`, {
    method: "POST",
  });

export const publishLesson = (track: AdminTrack, id: number) =>
  apiFetch<AdminLesson>(`${base(track)}/lessons/${id}/publish`, {
    method: "POST",
  });

// ── Exercises ────────────────────────────────────────────────────────────────

export const listExercises = (
  track: AdminTrack,
  params?: { lesson_id?: number; unit_id?: number },
) =>
  apiFetch<AdminExercise[]>(
    `${base(track)}/exercises${
      params
        ? "?" +
          new URLSearchParams(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)]),
          ).toString()
        : ""
    }`,
  );

export const getExercise = (track: AdminTrack, id: number) =>
  apiFetch<AdminExercise>(`${base(track)}/exercises/${id}`);

export const createExercise = (track: AdminTrack, body: AdminExercisePayload) =>
  apiFetch<AdminExercise>(`${base(track)}/exercises`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const updateExercise = (
  track: AdminTrack,
  id: number,
  body: Partial<Omit<AdminExercisePayload, "options">>,
) =>
  apiFetch<AdminExercise>(`${base(track)}/exercises/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const deleteExercise = (track: AdminTrack, id: number) =>
  apiFetch<AdminExercise>(`${base(track)}/exercises/${id}`, {
    method: "DELETE",
  });

export const restoreExercise = (track: AdminTrack, id: number) =>
  apiFetch<AdminExercise>(`${base(track)}/exercises/${id}/restore`, {
    method: "POST",
  });

export const publishExercise = (track: AdminTrack, id: number) =>
  apiFetch<AdminExercise>(`${base(track)}/exercises/${id}/publish`, {
    method: "POST",
  });

// ── Exercise options ─────────────────────────────────────────────────────────

export const createExerciseOption = (
  track: AdminTrack,
  exerciseId: number,
  body: AdminExerciseOptionPayload,
) =>
  apiFetch<AdminExerciseOption>(
    `${base(track)}/exercises/${exerciseId}/options`,
    { method: "POST", body: JSON.stringify(body) },
  );

export const updateExerciseOption = (
  track: AdminTrack,
  optionId: number,
  body: AdminExerciseOptionPayload,
) =>
  apiFetch<AdminExerciseOption>(`${base(track)}/exercise-options/${optionId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const deleteExerciseOption = (track: AdminTrack, optionId: number) =>
  apiFetch<void>(`${base(track)}/exercise-options/${optionId}`, {
    method: "DELETE",
  });
