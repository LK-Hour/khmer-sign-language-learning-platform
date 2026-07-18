import { Box, Grid, Paper, Skeleton, Stack } from "@mui/material";

import { PageContainer } from "@/components/layout";
import MainHeaderSkeleton from "@/components/layout/header-nav/MainHeaderSkeleton";
import { KslColors, KslRadii } from "@/theme/theme";

function NumberBadgeSkeleton() {
  return (
    <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: 2.5 }} />
  );
}

function SummaryCardSkeleton() {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        p: { xs: 2.25, md: 3 },
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
        >
          <NumberBadgeSkeleton />
          <Skeleton width={150} height={22} />
        </Stack>
        <Stack spacing={0.75}>
          <Skeleton width="62%" height={30} />
          <Skeleton width="90%" height={20} />
          <Skeleton width="70%" height={20} />
        </Stack>
      </Stack>
    </Paper>
  );
}

function LessonRowSkeleton({ secondWidth }: { secondWidth: number }) {
  return (
    <Paper
      elevation={0}
      sx={{
        alignItems: "center",
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.wordCard + 4}px`,
        display: "flex",
        gap: { xs: 1.25, md: 2 },
        px: { xs: 1.25, md: 2 },
        py: 1.25,
      }}
    >
      <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton width={86} height={26} />
        <Skeleton width={secondWidth} height={26} />
      </Stack>
      <Skeleton variant="circular" width={34} height={34} />
    </Paper>
  );
}

function UnitCardSkeleton({
  expanded = false,
  lessonRowSecondWidth,
}: {
  expanded?: boolean;
  lessonRowSecondWidth: number;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          p: { xs: 1.5, md: 2 },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", minWidth: 0, flex: 1 }}
        >
          <NumberBadgeSkeleton />
          <Skeleton width="42%" height={30} />
        </Stack>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", flexShrink: 0 }}
        >
          <Skeleton
            width={220}
            height={22}
            sx={{ display: { xs: "none", md: "block" } }}
          />
          <Skeleton variant="circular" width={34} height={34} />
        </Stack>
      </Stack>

      {expanded ? (
        <Stack
          spacing={1.5}
          sx={{ borderTop: `1px solid ${KslColors.border}`, p: 2 }}
        >
          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${KslColors.border}`,
              borderRadius: `${KslRadii.wordCard + 6}px`,
              overflow: "hidden",
            }}
          >
            <Stack
              direction="row"
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                p: { xs: 1.5, md: 2 },
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: "center", flex: 1, minWidth: 0 }}
              >
                <Skeleton width={96} height={24} />
                <Skeleton width="32%" height={24} />
              </Stack>
              <Skeleton variant="circular" width={34} height={34} />
            </Stack>
            <Stack
              spacing={0.75}
              sx={{ borderTop: `1px solid ${KslColors.border}`, p: 1 }}
            >
              <LessonRowSkeleton secondWidth={lessonRowSecondWidth} />
              <LessonRowSkeleton secondWidth={lessonRowSecondWidth} />
              <LessonRowSkeleton secondWidth={lessonRowSecondWidth} />
            </Stack>
          </Paper>
        </Stack>
      ) : null}
    </Paper>
  );
}

export type TrackSkeletonProps = {
  /** Render inline (no PageContainer wrapper) when true. */
  embedded?: boolean;
  /** Number of unit cards to render (the first is always expanded). */
  unitCount?: number;
  /** Width of the second skeleton bar in each lesson row. */
  lessonRowSecondWidth?: number;
};

export function TrackSkeleton({
  embedded = false,
  unitCount = 3,
  lessonRowSecondWidth = 68,
}: TrackSkeletonProps) {
  const content = (
    <Stack spacing={{ xs: 2.5, md: 3 }} sx={{ width: "100%" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
        }}
      >
        <Stack spacing={1.5}>
          <Skeleton width={170} height={20} />
          <Skeleton width={330} height={54} />
        </Stack>
        <Skeleton variant="rounded" width={164} height={46} sx={{ borderRadius: 3 }} />
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SummaryCardSkeleton />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SummaryCardSkeleton />
        </Grid>
      </Grid>

      <Stack spacing={1.5}>
        {Array.from({ length: unitCount }).map((_, index) => (
          <UnitCardSkeleton
            key={index}
            expanded={index === 0}
            lessonRowSecondWidth={lessonRowSecondWidth}
          />
        ))}
      </Stack>
    </Stack>
  );

  if (embedded) {
    return content;
  }

  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>{content}</PageContainer>
  );
}

export type TrackPageLoadingProps = {
  /** Accessible label for the loading overlay. */
  ariaLabel: string;
} & Pick<TrackSkeletonProps, "unitCount" | "lessonRowSecondWidth">;

/** Full-page overlay used by route loaders and client fetch gates. */
export function TrackPageLoading({
  ariaLabel,
  unitCount,
  lessonRowSecondWidth,
}: TrackPageLoadingProps) {
  return (
    <Box
      aria-busy
      aria-label={ariaLabel}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        bgcolor: "background.default",
        overflowY: "auto",
      }}
    >
      <MainHeaderSkeleton />
      <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
        <TrackSkeleton
          embedded
          unitCount={unitCount}
          lessonRowSecondWidth={lessonRowSecondWidth}
        />
      </PageContainer>
    </Box>
  );
}
