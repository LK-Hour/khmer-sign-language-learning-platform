/** Client for the contributions admin API (/api/admin/contributions/...).
 *
 * Provides functions for browsing the curriculum tree with pending counts,
 * listing/filtering contributions, and performing approve/reject actions.
 */

import { apiFetch } from "@/utils/api/client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ContributionTreeNode {
  id: number;
  name_en: string;
  name_kh: string;
  node_type: "unit" | "chapter" | "lesson";
  pending_count: number;
  children: ContributionTreeNode[];
}

export interface ContributionListItem {
  id: string;
  contributor_name: string;
  word_kh: string;
  word_en: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface ContributionDetail extends ContributionListItem {
  video_url: string | null;
  word_id: number;
  user_id: string | null;
  guest_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

export interface ContributionListParams {
  status?: string;
  word_id?: number;
  skip?: number;
  limit?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildQuery(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

// ── API Functions ────────────────────────────────────────────────────────────

/** Fetch the curriculum tree with pending contribution counts per node. */
export const getContributionTree = () =>
  apiFetch<ContributionTreeNode[]>("/api/admin/contributions/tree");

/** List contributions with optional status and word_id filters. */
export const listContributions = (params: ContributionListParams = {}) =>
  apiFetch<ContributionListItem[]>(
    `/api/admin/contributions${buildQuery(params as Record<string, unknown>)}`,
  );

/** Get detailed information about a single contribution. */
export const getContribution = (id: string) =>
  apiFetch<ContributionDetail>(`/api/admin/contributions/${id}`);

/** Approve a pending contribution. */
export const approveContribution = (id: string) =>
  apiFetch<ContributionDetail>(`/api/admin/contributions/${id}/approve`, {
    method: "PUT",
  });

/** Reject a pending contribution with a required reason. */
export const rejectContribution = (id: string, rejectionReason: string) =>
  apiFetch<ContributionDetail>(`/api/admin/contributions/${id}/reject`, {
    method: "PUT",
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });
