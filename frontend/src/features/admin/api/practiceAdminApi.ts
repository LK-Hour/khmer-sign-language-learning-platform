/** Client for admin practice management API (/api/admin/{track}/practices). */

import { apiFetch } from "@/utils/api/client";
import type { AdminTrack } from "./types";
import type { MediaResponse } from "./mediaAdminApi";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminPractice {
  id: number;
  chapter_id: number;
  lesson_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  practice_medias?: PracticeMediaItem[];
}

export interface PracticeMediaItem {
  id: number;
  practice_id: number;
  media_id: number;
  media?: MediaResponse;
}

export interface AdminPracticePayload {
  chapter_id: number;
  lesson_count: number;
  is_active?: boolean;
}

export interface PracticeMediaPayload {
  media_id: number;
}

// ── API Functions ────────────────────────────────────────────────────────────

const base = (track: AdminTrack) => `/api/admin/${track}/practices`;

/** List all practices for the given track. */
export const listPractices = (track: AdminTrack) =>
  apiFetch<AdminPractice[]>(`${base(track)}`);

/** Get a single practice by ID. */
export const getPractice = (track: AdminTrack, id: number) =>
  apiFetch<AdminPractice>(`${base(track)}/${id}`);

/** Create a new practice. */
export const createPractice = (track: AdminTrack, body: AdminPracticePayload) =>
  apiFetch<AdminPractice>(`${base(track)}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Update an existing practice. */
export const updatePractice = (
  track: AdminTrack,
  id: number,
  body: Partial<AdminPracticePayload>,
) =>
  apiFetch<AdminPractice>(`${base(track)}/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

/** Delete a practice. */
export const deletePractice = (track: AdminTrack, id: number) =>
  apiFetch<void>(`${base(track)}/${id}`, { method: "DELETE" });

/** Add a media association to a practice. */
export const addPracticeMedia = (
  track: AdminTrack,
  practiceId: number,
  body: PracticeMediaPayload,
) =>
  apiFetch<PracticeMediaItem>(`${base(track)}/${practiceId}/media`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Remove a media association from a practice. */
export const removePracticeMedia = (
  track: AdminTrack,
  practiceId: number,
  mediaId: number,
) =>
  apiFetch<void>(`${base(track)}/${practiceId}/media/${mediaId}`, {
    method: "DELETE",
  });
