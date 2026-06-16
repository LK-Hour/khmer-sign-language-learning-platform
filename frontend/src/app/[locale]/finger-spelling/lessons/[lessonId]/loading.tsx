import { Grid, Paper, Skeleton, Stack } from "@mui/material";
import { PageContainer } from "@/components/layout";
import { KslColors, KslRadii, KslShadows } from "@/theme/theme";

const visualFrameSx = {
  position: "relative" as const,
  width: "100%",
  height: { xs: 240, sm: 360, md: 460 },
  flexShrink: 0,
};

function VisualPanelSkeleton({ dark = false }: { dark?: boolean }) {
  return (
    <Stack sx={visualFrameSx}>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          height: "100%",
          borderRadius: `${KslRadii.signImage}px`,
          overflow: "hidden",
          boxShadow: dark ? "none" : KslShadows.drop,
          bgcolor: dark ? "grey.900" : KslColors.primaryLight,
          position: "relative",
        }}
      >
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{ bgcolor: dark ? "rgba(255,255,255,0.12)" : undefined }}
        />
        {dark ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              right: 12,
              zIndex: 3,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Skeleton variant="rounded" width={144} height={28} sx={{ borderRadius: 999, bgcolor: "rgba(255,255,255,0.18)" }} />
            <Skeleton variant="rounded" width={48} height={26} sx={{ borderRadius: 999, bgcolor: "rgba(255,255,255,0.22)" }} />
          </Stack>
        ) : null}
      </Paper>
    </Stack>
  );
}

function InfoCardSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: 2,
        border: `1px solid ${KslColors.border}`,
        borderRadius: `${KslRadii.card}px`,
        bgcolor: KslColors.primaryLighter,
      }}
    >
      <Skeleton width={wide ? 64 : 96} height={18} />
      <Skeleton width={wide ? "92%" : "54%"} height={34} sx={{ mt: 0.75 }} />
      {wide ? <Skeleton width="74%" height={20} /> : <Skeleton width="66%" height={20} />}
    </Paper>
  );
}

export default function LessonDetailLoading() {
  return (
    <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
      <Stack spacing={3} sx={{ pb: 6 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Skeleton width={112} height={24} />
          <Skeleton width={16} height={16} />
          <Skeleton width={70} height={24} />
          <Skeleton width={16} height={16} />
          <Skeleton width={84} height={24} />
          <Skeleton width={16} height={16} />
          <Skeleton width={78} height={24} />
          <Skeleton width={16} height={16} />
          <Skeleton width={92} height={24} />
        </Stack>

        <Stack spacing={2} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={1}>
                <VisualPanelSkeleton />
                <Skeleton width="68%" height={22} />
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={1}>
                <VisualPanelSkeleton dark />
                <Stack spacing={0.5}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Skeleton width={180} height={22} />
                    <Skeleton width={42} height={22} />
                  </Stack>
                  <Skeleton variant="rounded" width="100%" height={6} sx={{ borderRadius: 3 }} />
                </Stack>
                <Skeleton width="72%" height={22} />
              </Stack>
            </Grid>
          </Grid>

          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, md: 5 }}>
              <InfoCardSkeleton wide />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
              <InfoCardSkeleton />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
              <InfoCardSkeleton />
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              display: "flex",
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              p: 2,
              borderRadius: `${KslRadii.signImage}px`,
              bgcolor: KslColors.primaryLighter,
            }}
          >
            <Stack spacing={0.5} sx={{ flex: 1, width: "100%" }}>
              <Skeleton width={180} height={30} />
              <Skeleton width="86%" height={22} />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Skeleton variant="rounded" width={110} height={46} sx={{ borderRadius: `${KslRadii.button}px` }} />
              <Skeleton variant="rounded" width={150} height={46} sx={{ borderRadius: `${KslRadii.button}px` }} />
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </PageContainer>
  );
}
