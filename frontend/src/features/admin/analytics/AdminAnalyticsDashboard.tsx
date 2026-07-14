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
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Retry
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

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_KPIS: KpiData[] = [
  { title: "Total Users", value: "2,847", change: 12 },
  { title: "Active Users Today", value: "183", change: 8 },
  { title: "Completed Lessons", value: "1,264", change: 15 },
  { title: "Quiz Attempts", value: "3,891", change: 5 },
  { title: "Average Quiz Score", value: "78%", change: 3 },
  { title: "AI Recognition Accuracy", value: "92%", change: -2 },
];

// Active Users: show Jan → current month only.
// "Active" = user has a valid (non-expired) 7-day refresh token.
const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ALL_ACTIVE_USERS_DATA = [120, 180, 150, 220, 280, 310, 290, 350, 380, 420, 390, 450];
const CURRENT_MONTH_INDEX = new Date().getMonth(); // 0-based
const ACTIVE_USERS_CATEGORIES = ALL_MONTHS.slice(0, CURRENT_MONTH_INDEX + 1);
const ACTIVE_USERS_SERIES = [
  {
    name: "Active Users",
    data: ALL_ACTIVE_USERS_DATA.slice(0, CURRENT_MONTH_INDEX + 1),
  },
];

const COMPLETION_RATE_SERIES = [72, 28]; // Completed, Remaining
const COMPLETION_RATE_LABELS = ["Completed", "Remaining"];

const LEARNING_PROGRESS_DATA: BarListItem[] = [
  { label: "Finger Spelling", value: 78 },
  { label: "Word Detection", value: 65 },
  { label: "Grammar Basics", value: 52 },
  { label: "Sentence Building", value: 40 },
];

const MOST_PRACTICED_DATA: BarListItem[] = [
  { label: "Hello (សួស្ដី)", value: 95 },
  { label: "Thank You (អរគុណ)", value: 88 },
  { label: "Please (សូម)", value: 72 },
  { label: "Sorry (សុំទោស)", value: 65 },
];

const MOST_DIFFICULT_DATA: BarListItem[] = [
  { label: "Complex Sentences", value: 28 },
  { label: "Number Signs (11-20)", value: 35 },
  { label: "Family Relations", value: 42 },
  { label: "Time Expressions", value: 45 },
];

const FEEDBACK_DATA: BarListItem[] = [
  { label: "Content Quality", value: 40 },
  { label: "Recognition Accuracy", value: 30 },
  { label: "Bug Reports", value: 18 },
  { label: "General", value: 12 },
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function AdminAnalyticsDashboard() {
  const [kpis, setKpis] = useState<SectionState<KpiData[]>>(initialSection());
  const [charts, setCharts] = useState<SectionState<boolean>>(initialSection());

  const fetchData = useCallback(async () => {
    setKpis({ data: null, loading: true, error: null });
    setCharts({ data: null, loading: true, error: null });

    // Simulate loading delay for skeleton display
    await new Promise((resolve) => setTimeout(resolve, 800));

    setKpis({ data: MOCK_KPIS, loading: false, error: null });
    setCharts({ data: true, loading: false, error: null });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isAnyLoading = kpis.loading || charts.loading;

  return (
    <Stack spacing={3}>
      {/* Page Header */}
      <PageHeader
        title="Analytics"
        subtitle="Monitor platform usage and learner progress"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Analytics" },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchData}
            disabled={isAnyLoading}
          >
            Refresh
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
          {charts.loading ? (
            <BarListSkeleton />
          ) : (
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardHeader
                title="Active Users"
                subheader="Monthly active users (valid 7-day refresh token)"
                slotProps={{ title: { variant: "h6" }, subheader: { variant: "body2" } }}
              />
              <CardContent sx={{ pt: 0 }}>
                <AreaChart
                  series={ACTIVE_USERS_SERIES}
                  categories={ACTIVE_USERS_CATEGORIES}
                  height={300}
                />
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {charts.loading ? (
            <DonutChartSkeleton />
          ) : (
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardHeader
                title="Learning Progress"
                subheader="Overall lesson completion percentage"
                slotProps={{ title: { variant: "h6" }, subheader: { variant: "body2" } }}
              />
              <CardContent sx={{ pt: 0 }}>
                <DonutChart
                  series={COMPLETION_RATE_SERIES}
                  labels={COMPLETION_RATE_LABELS}
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
          {charts.loading ? (
            <BarListSkeleton />
          ) : (
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardHeader
                title="Learning Progress"
                subheader="Progress by curriculum category"
                slotProps={{ title: { variant: "h6" }, subheader: { variant: "body2" } }}
              />
              <CardContent sx={{ pt: 0 }}>
                <BarListChart items={LEARNING_PROGRESS_DATA} />
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {charts.loading ? (
            <BarListSkeleton />
          ) : (
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardHeader
                title="Most Practiced"
                subheader="Most frequently practiced signs"
                slotProps={{ title: { variant: "h6" }, subheader: { variant: "body2" } }}
              />
              <CardContent sx={{ pt: 0 }}>
                <BarListChart items={MOST_PRACTICED_DATA} />
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* BarList "Most Difficult" + BarList "Feedback" */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          {charts.loading ? (
            <BarListSkeleton />
          ) : (
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardHeader
                title="Most Difficult"
                subheader="Lowest-scoring content items"
                slotProps={{ title: { variant: "h6" }, subheader: { variant: "body2" } }}
              />
              <CardContent sx={{ pt: 0 }}>
                <BarListChart items={MOST_DIFFICULT_DATA} danger />
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {charts.loading ? (
            <BarListSkeleton />
          ) : (
            <Card elevation={0} sx={{ height: "100%" }}>
              <CardHeader
                title="Feedback"
                subheader="Feedback breakdown by category"
                slotProps={{ title: { variant: "h6" }, subheader: { variant: "body2" } }}
              />
              <CardContent sx={{ pt: 0 }}>
                <BarListChart items={FEEDBACK_DATA} />
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Stack>
  );
}
