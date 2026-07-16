/** Client for the admin analytics API (/api/admin/analytics/...). */

import { apiFetch } from "@/utils/api/client";
import type { AdminTrack } from "./types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface OverviewStats {
  total_users: number;
  total_lessons_completed: number;
  active_learners_today: number;
}

export interface TrackCompletionStats {
  track: "finger" | "word_detection";
  completed_lessons: number;
  total_lessons: number;
  completion_rate: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_completed: number;
  last_active_at: string | null;
}

export interface LessonDifficultyEntry {
  lesson_id: number;
  lesson_name: string;
  avg_attempts: number;
  completion_rate: number;
  unique_users: number;
}

// ── Unified Dashboard Analytics Types ────────────────────────────────────────

export interface KpiValue {
  value: number;
  change: number;
}

export interface LessonRankEntry {
  label: string;
  value: number;
}

export interface FeedbackDistribution {
  label: string;
  value: number;
}

export interface MonthlyActiveUsers {
  categories: string[];
  series: number[];
}

export interface LearningProgressDonut {
  completed: number;
  remaining: number;
}

export interface TrackProgress {
  label: string;
  value: number;
}

export interface DashboardAnalyticsResponse {
  total_users: KpiValue;
  active_users_today: KpiValue;
  completed_lessons: KpiValue;
  quiz_attempts: KpiValue;
  avg_quiz_score: KpiValue;
  ai_recognition_accuracy: KpiValue;
  monthly_active_users: MonthlyActiveUsers;
  learning_progress_donut: LearningProgressDonut;
  track_progress: TrackProgress[];
  most_practiced: LessonRankEntry[];
  most_difficult: LessonRankEntry[];
  feedback_distribution: FeedbackDistribution[];
}

// ── API Functions ────────────────────────────────────────────────────────────

const BASE = "/api/admin/analytics";

/** Fetch platform-wide overview statistics. */
export const getOverviewStats = () =>
  apiFetch<OverviewStats>(`${BASE}/overview`);

/** Fetch per-track completion rates. */
export const getTrackCompletion = () =>
  apiFetch<TrackCompletionStats[]>(`${BASE}/track-completion`);

/** Fetch top learners leaderboard. */
export const getLeaderboard = (limit?: number) =>
  apiFetch<LeaderboardEntry[]>(
    `${BASE}/leaderboard${limit != null ? `?limit=${limit}` : ""}`,
  );

/** Fetch per-lesson difficulty metrics for a given track. */
export const getLessonDifficulty = (track: AdminTrack) =>
  apiFetch<LessonDifficultyEntry[]>(`${BASE}/lesson-difficulty?track=${track}`);

/** Fetch unified dashboard analytics (all KPIs and chart data in one call). */
export const getDashboardAnalytics = () =>
  apiFetch<DashboardAnalyticsResponse>(`${BASE}`);
