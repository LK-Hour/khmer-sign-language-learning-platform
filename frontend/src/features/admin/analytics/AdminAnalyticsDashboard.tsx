"use client";

import Refresh from "@mui/icons-material/Refresh";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Skeleton,
  Stack,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import PageHeader from "@/features/admin/components/shared/PageHeader";
import AreaChart from "@/features/admin/components/charts/AreaChart";
import DonutChart from "@/features/admin/components/charts/DonutChart";
import { useTranslation } from "@/i18n/useTranslation";

import {
  getDashboardAnalytics,
  type DashboardAnalyticsResponse,
} from "@/features/admin/api/analyticsAdminApi";

import StatCards from "./StatCards";
import type { KpiData } from "./StatCards";
import BarListChart from "./BarListChart";
import type { BarListItem } from "./BarListChart";

// ── Section-level loading/error state ────────────────────────────────────────

interface SectionState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function initialSection<T>(): SectionState<T> {
  return { data: null, loading: true, error: null };
}

// ── Section error display ────────────────────────────────────────────────────

function SectionError({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          {t("PAGE.RETRY")}
        </Button>
      }
    >
      {error}
    </Alert>
  );
}

// ── Skeleton placeholders ────────────────────────────────────────────────────

function DonutChartSkeleton() {
  return (
    <Card elevation={0} sx={{ height: "100%" }}>
      <CardContent>
        <Skeleton variant="text" width={140} height={28} sx={{ mb: 2 }} />
        <Skeleton variant="circular" width={200} height={200} sx={{ mx: "auto", mb: 2 }} />
        <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
          <Skeleton variant="rounded" width={60} height={16} />
          <Skeleton variant="rounded" width={60} height={16} />
        </Stack>
      </CardContent>
    </Card>
  );
}

function BarListSkeleton() {
  return (
    <Card elevation={0} sx={{ height: "100%" }}>
      <CardContent>
        <Skeleton variant="text" width={140} height={28} sx={{ mb: 2 }} />
        <Stack spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Box key={i}>
              <Skeleton variant="text" width="80%" height={20} sx={{ mb: 0.5 }} />
              <Skeleton variant="rounded" height={6} sx={{ borderRadius: 3 }} />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Helper: format KPI value for display ─────────────────────────────────────

function formatKpiValue(key: string, value: number): string {
  if (key === "avg_quiz_score" || key === "ai_recognition_accuracy") {
    return `${Math.round(value)}%`;
  }
  return value.toLocaleString();
}

// ── Helper: map API response to KpiData[] ────────────────────────────────────

function mapKpis(
  response: DashboardAnalyticsResponse,
  t: ReturnType<typeof useTranslation>["t"],
): KpiData[] {
  const entries: { key: string; title: string }[] = [
    { key: "total_users", title: t("ANALYTICS.TOTAL_USERS") },
    { key: "active_users_today", title: t("ANALYTICS.ACTIVE_USERS_WEEK") },
    { key: "completed_lessons", title: t("ANALYTICS.COMPLETED_LESSONS") },
    { key: "quiz_attempts", title: t("ANALYTICS.QUIZ_ATTEMPTS") },
    { key: "avg_quiz_score", title: t("ANALYTICS.AVG_QUIZ_SCORE") },
    { key: "ai_recognition_accuracy", title: t("ANALYTICS.AI_RECOGNITION_ACCURACY") },
  ];

  return entries.map(({ key, title }) => {
    const kpi = response[key as keyof DashboardAnalyticsResponse] as {
      value: number;
      change: number;
    };
    return {
      title,
      value: formatKpiValue(key, kpi.value),
      change: kpi.change,
    };
  });
}

// ── Chart data types from API ────────────────────────────────────────────────

interface ChartsData {
  activeUsersSeries: { name: string; data: number[] }[];
  activeUsersCategories: string[];
  donutSeries: number[];
  donutLabels: string[];
  trackProgress: BarListItem[];
  mostPracticed: BarListItem[];
  mostDifficult: BarListItem[];
  feedbackDistribution: BarListItem[];
}

function mapCharts(
  response: DashboardAnalyticsResponse,
  t: ReturnType<typeof useTranslation>["t"],
): ChartsData {
  return {
    activeUsersSeries: [
      { name: "Active Users", data: response.monthly_active_users.series },
    ],
    activeUsersCategories: response.monthly_active_users.categories,
    donutSeries: [
      response.learning_progress_donut.completed,
      response.learning_progress_donut.remaining,
    ],
    donutLabels: [t("ANALYTICS.COMPLETED"), t("ANALYTICS.REMAINING")],
    trackProgress: response.track_progress.map((tp) => ({
      label: tp.label,
      value: tp.value,
    })),
    mostPracticed: response.most_practiced.map((mp) => ({
      label: mp.label,
      value: mp.value,
    })),
    mostDifficult: response.most_difficult.map((md) => ({
      label: md.label,
      value: md.value,
    })),
    feedbackDistribution: response.feedback_distribution.map((fd) => ({
      label: fd.label,
      value: fd.value,
    })),
  };
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AdminAnalyticsDashboard() {
  const { t } = useTranslation();
  const [kpis, setKpis] = useState<SectionState<KpiData[]>>(initialSection());
  const [charts, setCharts] = useState<SectionState<ChartsData>>(initialSection());

  const fetchData = useCallback(async () => {
    setKpis({ data: null, loading: true, error: null });
    setCharts({ data: null, loading: true, error: null });

    try {
      const response = await getDashboardAnalytics();
      setKpis({ data: mapKpis(response, t), loading: false, error: null });
      setCharts({ data: mapCharts(response, t), loading: false, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("ANALYTICS.FAILED_TO_LOAD");
      setKpis({ data: null, loading: false, error: message });
      setCharts({ data: null, loading: false, error: message });
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isAnyLoading = kpis.loading || charts.loading;

  return (
    <Stack spacing={3}>
      {/* Page Header */}
      <PageHeader
        title={t("ANALYTICS.TITLE")}
        subtitle={t("ANALYTICS.SUBTITLE")}
        breadcrumbs={[
          { label: t("PAGE.ANALYTICS"), href: "/admin" },
          { label: t("ANALYTICS.TITLE") },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchData}
            disabled={isAnyLoading}
          >
            {t("PAGE.REFRESH")}
          </Button>
        }
      />

      {/* KPI Stat Cards — 6 cards (3 cols desktop, 2 tablet, 1 mobile) */}
      <Box>
        {kpis.error ? (
          <SectionError error={kpis.error} onRetry={fetchData} />
        ) : (
          <StatCards kpis={kpis.data} loading={kpis.loading} />
        )}
      </Box>

      {/* Area Chart "Active Users" + DonutChart "Learning Progress" */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          {charts.error ? (
            <SectionError error={charts.error} onRetry={fetchData} />
          ) : charts.loading ? (
            <BarListSkeleton />
          ) : (
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardHeader
                title={t("ANALYTICS.ACTIVE_USERS")}
                subheader={t("ANALYTICS.MONTHLY_ACTIVE_USERS")}
                slotProps={{ title: { variant: "h6" }, subheader: { variant: "body2" } }}
              />
              <CardContent sx={{ pt: 0 }}>
                <AreaChart
                  series={charts.data!.activeUsersSeries}
                  categories={charts.data!.activeUsersCategories}
                  height={300}
                />
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {charts.error ? (
            <SectionError error={charts.error} onRetry={fetchData} />
          ) : charts.loading ? (
            <DonutChartSkeleton />
          ) : (
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardHeader
                title={t("ANALYTICS.LEARNING_PROGRESS")}
                subheader={t("ANALYTICS.OVERALL_COMPLETION")}
                slotProps={{ title: { variant: "h6" }, subheader: { variant: "body2" } }}
              />
              <CardContent sx={{ pt: 0 }}>
                <DonutChart
                  series={charts.data!.donutSeries}
                  labels={charts.data!.donutLabels}
                  height={300}
                />
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* BarList "Learning Progress" + BarList "Most Practiced" */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          {charts.error ? (
            <SectionError error={charts.error} onRetry={fetchData} />
          ) : charts.loading ? (
            <BarListSkeleton />
          ) : (
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardHeader
                title={t("ANALYTICS.LEARNING_PROGRESS")}
                subheader={t("ANALYTICS.PROGRESS_BY_CATEGORY")}
                slotProps={{ title: { variant: "h6" }, subheader: { variant: "body2" } }}
              />
              <CardContent sx={{ pt: 0 }}>
                <BarListChart items={charts.data!.trackProgress} />
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {charts.error ? (
            <SectionError error={charts.error} onRetry={fetchData} />
          ) : charts.loading ? (
            <BarListSkeleton />
          ) : (
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardHeader
                title={t("ANALYTICS.MOST_PRACTICED")}
                subheader={t("ANALYTICS.MOST_FREQUENTLY_PRACTICED")}
                slotProps={{ title: { variant: "h6" }, subheader: { variant: "body2" } }}
              />
              <CardContent sx={{ pt: 0 }}>
                <BarListChart items={charts.data!.mostPracticed} />
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* BarList "Most Difficult" + BarList "Feedback" */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          {charts.error ? (
            <SectionError error={charts.error} onRetry={fetchData} />
          ) : charts.loading ? (
            <BarListSkeleton />
          ) : (
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardHeader
                title={t("ANALYTICS.MOST_DIFFICULT")}
                subheader={t("ANALYTICS.LOWEST_SCORING")}
                slotProps={{ title: { variant: "h6" }, subheader: { variant: "body2" } }}
              />
              <CardContent sx={{ pt: 0 }}>
                <BarListChart items={charts.data!.mostDifficult} danger />
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {charts.error ? (
            <SectionError error={charts.error} onRetry={fetchData} />
          ) : charts.loading ? (
            <BarListSkeleton />
          ) : (
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardHeader
                title={t("ANALYTICS.FEEDBACK")}
                subheader={t("ANALYTICS.FEEDBACK_BREAKDOWN")}
                slotProps={{ title: { variant: "h6" }, subheader: { variant: "body2" } }}
              />
              <CardContent sx={{ pt: 0 }}>
                <BarListChart items={charts.data!.feedbackDistribution} />
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Stack>
  );
}