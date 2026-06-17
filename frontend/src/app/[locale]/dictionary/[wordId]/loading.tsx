import { Grid, Paper, Skeleton, Stack } from "@mui/material";
import { DictionaryLayout } from "@/features/dictionary/components";
import { KslColors, KslPalette, KslRadii } from "@/theme/theme";

export default function DictionaryWordLoading() {
  return (
    <DictionaryLayout showHero={false}>
      <Stack spacing={{ xs: 3, md: 4 }} sx={{ width: "100%" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between" }}
        >
          <Stack spacing={1} sx={{ flex: 1 }}>
            <Skeleton width={96} height={18} />
            <Skeleton width="42%" height={52} />
            <Skeleton width="68%" height={24} />
          </Stack>
          <Skeleton
            variant="rounded"
            width={180}
            height={40}
            sx={{ borderRadius: `${KslRadii.button}px` }}
          />
        </Stack>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper
              elevation={0}
              sx={{
                minHeight: { xs: 320, md: 480 },
                borderRadius: `${KslRadii.signImage}px`,
                bgcolor: KslPalette.primary.lighter,
                border: `1px solid ${KslPalette.primary.light}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Skeleton variant="rounded" width="55%" height="55%" />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: `${KslRadii.card}px`,
                  border: `1px solid ${KslColors.border}`,
                }}
              >
                <Stack spacing={1.5}>
                  <Skeleton width="40%" height={16} />
                  <Skeleton width="70%" height={28} />
                  <Skeleton width="100%" height={24} />
                  <Skeleton width="100%" height={24} />
                </Stack>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: `${KslRadii.card}px`,
                  border: `1px solid ${KslColors.border}`,
                }}
              >
                <Stack spacing={1.5}>
                  <Skeleton width="36%" height={16} />
                  <Skeleton width="55%" height={28} />
                  <Skeleton width="100%" height={48} />
                </Stack>
              </Paper>

              <Skeleton
                variant="rounded"
                height={52}
                sx={{ borderRadius: `${KslRadii.button}px` }}
              />
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </DictionaryLayout>
  );
}
