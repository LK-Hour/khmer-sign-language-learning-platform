import { Box, Grid, Paper, Skeleton, Stack } from "@mui/material";
import { PageContainer } from "@/components/layout";
import { KslColors, KslRadii } from "@/theme/theme";

function ModeCardSkeleton() {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: { xs: 2.5, md: 3 },
        borderRadius: `${KslRadii.card}px`,
        border: `1px solid ${KslColors.border}`,
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}
        >
          <Skeleton width={84} height={18} />
          <Skeleton width={92} height={20} />
        </Stack>
        <Skeleton width="48%" height={42} />
        <Stack spacing={0.75}>
          <Skeleton width="94%" height={20} />
          <Skeleton width="72%" height={20} />
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function LandingPageLoading() {
  return (
    <PageContainer>
      <Stack spacing={{ xs: 3, md: 4 }}>
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ alignItems: "center" }}>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{ minWidth: 0, position: "relative", zIndex: 1 }}
          >
            <Stack spacing={{ xs: 1.5, md: 2 }} sx={{ alignItems: "flex-start" }}>
              <Skeleton width={180} height={28} />
              <Skeleton width="86%" height={54} />
              <Skeleton width="94%" height={24} />
              <Skeleton width="72%" height={24} />
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ pt: 0.5, width: "100%", flexWrap: "wrap" }}
              >
                <Skeleton
                  variant="rounded"
                  width={190}
                  height={56}
                  sx={{ flex: { xs: "1 1 100%", sm: "0 1 auto" } }}
                />
                <Skeleton
                  variant="rounded"
                  width={190}
                  height={56}
                  sx={{ flex: { xs: "1 1 100%", sm: "0 1 auto" } }}
                />
              </Stack>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }} sx={{ minWidth: 0 }}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: { xs: 220, sm: 280, md: 320, lg: 380 },
                borderRadius: `${KslRadii.card}px`,
                overflow: "hidden",
                bgcolor: "#0a1628",
              }}
            >
              <Skeleton
                variant="rectangular"
                width="100%"
                height="100%"
                sx={{ bgcolor: "rgba(255,255,255,0.12)" }}
              />
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ModeCardSkeleton />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ModeCardSkeleton />
          </Grid>
        </Grid>
      </Stack>
    </PageContainer>
  );
}
