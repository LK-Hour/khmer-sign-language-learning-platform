import { Grid, Paper, Skeleton, Stack } from "@mui/material";
import { DictionaryLayout } from "@/features/dictionary/components";
import { KslColors, KslPalette, KslRadii } from "@/theme/theme";

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

export default function DictionaryListLoading() {
  return (
    <DictionaryLayout>
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

        <Skeleton
          variant="rounded"
          height={168}
          sx={{ borderRadius: `${KslRadii.card}px` }}
        />

        <Grid container spacing={2}>
          {Array.from({ length: 6 }, (_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}>
              <DictionaryCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Stack>
    </DictionaryLayout>
  );
}
