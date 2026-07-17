/** Client for the admin feedback API (/api/admin/feedback). */

import { apiFetch } from "@/utils/api/client";

export interface FeedbackItem {
  id: number;
  type: "finger_spelling" | "words" | null;
  category: string;
  lesson_id: number;
  characteristic: string;
  mood: "very_bad" | "bad" | "okay" | "good" | "excellent" | null;
  comment: string | null;
  created_at: string | null;
}

export interface PaginatedFeedbackResponse {
  items: FeedbackItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ListFeedbackParams {
  page?: number;
  size?: number;
  mood?: string;
  type?: string;
  search?: string;
}

function buildQuery(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

export const listFeedback = (params: ListFeedbackParams = {}) =>
  apiFetch<PaginatedFeedbackResponse>(
    `/api/admin/feedback${buildQuery(params as Record<string, unknown>)}`,
  );

/** Get a single feedback entry by ID. */
export const getFeedback = (id: number) =>
  apiFetch<FeedbackItem>(`/api/admin/feedback/${id}`);

/** Delete a feedback entry. */
export const deleteFeedback = (id: number) =>
  apiFetch<void>(`/api/admin/feedback/${id}`, { method: "DELETE" });
