/** Client for the admin analytics API (/api/admin/analytics/...). */

import { apiFetch } from "@/utils/api/client";

// ── Types ────────────────────────────────────────────────────────────────────

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

/** Fetch unified dashboard analytics (all KPIs and chart data in one call). */
export const getDashboardAnalytics = () =>
  apiFetch<DashboardAnalyticsResponse>(`${BASE}`);
