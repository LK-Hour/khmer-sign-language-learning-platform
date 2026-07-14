/** Client for the admin media management API (/api/admin/media). */

import { apiFetch } from "@/utils/api/client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MediaAssociation {
  target_type: "letter" | "word";
  target_id: number;
  target_name: string;
}

export interface MediaResponse {
  id: number;
  media_type: "video" | "gif" | "image";
  file_url: string;
  created_at: string;
  associations: MediaAssociation[];
}

export interface PaginatedMediaResponse {
  items: MediaResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ListMediaParams {
  page?: number;
  size?: number;
  media_type?: string;
  search?: string;
}

export interface AssociateMediaBody {
  target_type: "letter" | "word";
  target_id: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

// ── API Functions ────────────────────────────────────────────────────────────

/** List media assets with optional pagination and media_type filter. */
export const listMedia = (params: ListMediaParams = {}) =>
  apiFetch<PaginatedMediaResponse>(
    `/api/admin/media${buildQuery(params as Record<string, unknown>)}`,
  );

/** Upload a new media file. Sends as multipart/form-data. */
export const uploadMedia = (file: File, mediaType: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("media_type", mediaType);

  return apiFetch<MediaResponse>("/api/admin/media", {
    method: "POST",
    body: formData,
  });
};

/** Get media detail including associations. */
export const getMediaDetail = (id: number) =>
  apiFetch<MediaResponse>(`/api/admin/media/${id}`);

/** Delete a media asset and its file. */
export const deleteMedia = (id: number) =>
  apiFetch<void>(`/api/admin/media/${id}`, { method: "DELETE" });

/** Associate a media asset with a letter or word. */
export const associateMedia = (id: number, body: AssociateMediaBody) =>
  apiFetch<MediaResponse>(`/api/admin/media/${id}/associate`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Disassociate a media asset from a letter or word. */
export const disassociateMedia = (id: number, body: AssociateMediaBody) =>
  apiFetch<MediaResponse>(`/api/admin/media/${id}/associate`, {
    method: "DELETE",
    body: JSON.stringify(body),
  });
