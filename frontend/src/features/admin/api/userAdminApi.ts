/**
 * Admin API client for user management operations.
 *
 * Wraps the GET/PUT/DELETE /api/users endpoints that support
 * listing, filtering, role assignment, and soft-delete/reactivation.
 */

import { apiFetch } from "@/utils/api/client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  username: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  account_type: "student" | "admin" | "guest";
  auth_provider: "email" | "google" | "facebook" | "telegram";
  is_guest: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface UserUpdate {
  display_name?: string;
  email?: string | null;
  account_type?: "student" | "admin" | "guest";
  is_active?: boolean;
  avatar_url?: string | null;
}

export interface ListUsersParams {
  skip?: number;
  limit?: number;
  q?: string;
  account_type?: string;
  is_active?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a URL query string from a params object.
 * Omits keys whose values are undefined or null.
 */
export function buildQuery(params: object): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
}

// ── API Functions ────────────────────────────────────────────────────────────

/** Fetch a paginated, optionally filtered list of users. */
export const listUsers = (params: ListUsersParams = {}) =>
  apiFetch<UserResponse[]>(`/api/users?${buildQuery(params)}`);

/** Fetch a single user by ID. */
export const getUser = (userId: string) =>
  apiFetch<UserResponse>(`/api/users/${userId}`);

/** Update user fields (role, display name, active status, etc.). */
export const updateUser = (userId: string, body: Partial<UserUpdate>) =>
  apiFetch<UserResponse>(`/api/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

/** Soft-delete (deactivate) a user account. */
export const deactivateUser = (userId: string) =>
  apiFetch<UserResponse>(`/api/users/${userId}`, { method: "DELETE" });
