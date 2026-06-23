import { Box, Grid, Paper, Skeleton, Stack } from "@mui/material";

import { PageContainer } from "@/components/layout";
import MainHeaderSkeleton from "@/components/layout/header-nav/MainHeaderSkeleton";
import { KslColors, KslPalette, KslRadii } from "@/theme/theme";

function DictionaryHeroSkeleton() {
  return (
    <Stack
      spacing={2}
      sx={{
        borderRadius: `${KslRadii.card}px`,
        px: { xs: 2.5, md: 4 },
        py: { xs: 3, md: 4 },
        bgcolor: KslPalette.primary.lighter,
        border: `1px solid ${KslPalette.primary.light}`,
      }}
    >
      <Stack spacing={1}>
        <Skeleton width={120} height={18} />
        <Skeleton width="70%" height={36} />
        <Skeleton width="90%" height={24} />
        <Skeleton width="60%" height={24} />
      </Stack>
    </Stack>
  );
}

function DictionaryCardSkeleton() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        height: 196,
        borderRadius: `${KslRadii.card}px`,
        border: `1px solid ${KslColors.border}`,
      }}
    >
      <Stack spacing={1.5}>
        <Skeleton width={88} height={26} sx={{ borderRadius: 999 }} />
        <Skeleton width="72%" height={32} />
        <Skeleton width="48%" height={24} />
        <Skeleton width="100%" height={40} />
      </Stack>
    </Paper>
  );
}

function DictionaryToolbarSkeleton() {
  return (
    <Paper
      elevation={0}
      component={Stack}
      spacing={{ xs: 2, md: 2.5 }}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: `${KslRadii.card}px`,
        border: `1px solid ${KslColors.border}`,
        bgcolor: "background.paper",
      }}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton
            variant="rounded"
            height={56}
            sx={{ borderRadius: `${KslRadii.button}px` }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton
            variant="rounded"
            height={56}
            sx={{ borderRadius: `${KslRadii.button}px` }}
          />
        </Grid>
      </Grid>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Skeleton variant="rounded" width={91} height={36} sx={{ borderRadius: `${KslRadii.button}px` }} />
          <Skeleton variant="rounded" width={74} height={36} sx={{ borderRadius: `${KslRadii.button}px` }} />
          <Skeleton variant="rounded" width={72} height={36} sx={{ borderRadius: `${KslRadii.button}px` }} />
        </Stack>
        <Skeleton width={120} height={20} />
      </Stack>
    </Paper>
  );
}

export default function DictionaryListLoading() {
  return (
    <Box
      aria-busy
      aria-label="Loading dictionary"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        bgcolor: "background.default",
        overflowY: "auto",
      }}
    >
      <MainHeaderSkeleton />
      <PageContainer>
        <Stack spacing={{ xs: 3, md: 4 }}>
          <DictionaryHeroSkeleton />

          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Skeleton
                  variant="rounded"
                  height={88}
                  sx={{
                    borderRadius: `${KslRadii.card}px`,
                    bgcolor: KslPalette.primary.lighter,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Skeleton
                  variant="rounded"
                  height={88}
                  sx={{
                    borderRadius: `${KslRadii.card}px`,
                    bgcolor: KslPalette.secondary.lighter,
                  }}
                />
              </Grid>
            </Grid>

            <DictionaryToolbarSkeleton />

            <Grid container spacing={2}>
              {Array.from({ length: 6 }, (_, index) => (
                <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <DictionaryCardSkeleton />
                </Grid>
              ))}
            </Grid>

            <Stack sx={{ alignItems: "center" }}>
              <Skeleton
                variant="rounded"
                width={280}
                height={40}
                sx={{ borderRadius: `${KslRadii.button}px` }}
              />
            </Stack>
          </Stack>
        </Stack>
      </PageContainer>
    </Box>
  );
}
