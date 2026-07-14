"use client";

import Group from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import GradeIcon from "@mui/icons-material/Grade";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { Grid, Skeleton } from "@mui/material";

import StatsCard from "@/features/admin/components/shared/StatsCard";

export interface KpiData {
  title: string;
  value: string | number;
  change: number; // percentage, positive = green, negative = red
}

interface StatCardsProps {
  kpis: KpiData[] | null;
  loading?: boolean;
}

const KPI_ICONS = [
  <Group key="users" sx={{ fontSize: 36, color: "primary.main", opacity: 0.7 }} />,
  <PersonIcon key="active" sx={{ fontSize: 36, color: "info.main", opacity: 0.7 }} />,
  <SchoolIcon key="lessons" sx={{ fontSize: 36, color: "success.main", opacity: 0.7 }} />,
  <QuizIcon key="quiz" sx={{ fontSize: 36, color: "warning.main", opacity: 0.7 }} />,
  <GradeIcon key="score" sx={{ fontSize: 36, color: "secondary.main", opacity: 0.7 }} />,
  <SmartToyIcon key="ai" sx={{ fontSize: 36, color: "error.main", opacity: 0.7 }} />,
];

/** KPI summary row: all 6 cards in a single row on desktop. */
export default function StatCards({ kpis, loading }: StatCardsProps) {
  if (loading || !kpis) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={2}>
      {kpis.map((kpi, index) => (
        <Grid key={kpi.title} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatsCard
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            icon={KPI_ICONS[index] ?? KPI_ICONS[0]}
          />
        </Grid>
      ))}
    </Grid>
  );
}
