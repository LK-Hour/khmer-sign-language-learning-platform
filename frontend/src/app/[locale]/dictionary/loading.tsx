import { IconButton, Paper, Skeleton, Stack } from "@mui/material";
import { FingerSpellingDictionaryLayout } from "@/features/finger-spelling/components";
import { KslColors, KslRadii, KslShadows } from "@/theme/theme";

function DictionaryRowSkeleton() {
  return (
    <Paper
      elevation={0}
      component={Stack}
      direction="row"
      sx={{
        alignItems: "center",
        gap: { xs: 1.5, md: 2 },
        px: { xs: 2, md: 2.5 },
        py: { xs: 1.5, md: 2 },
        mb: 1.5,
        bgcolor: "background.paper",
        borderRadius: `${KslRadii.card}px`,
        boxShadow: KslShadows.card,
        border: "1px solid transparent",
      }}
    >
      <Skeleton width="32%" height={26} sx={{ flex: 1 }} />
      <Skeleton width="32%" height={26} sx={{ flex: 1 }} />
      <Skeleton variant="circular" width={40} height={40} />
    </Paper>
  );
}

export default function DictionaryListLoading() {
  return (
    <FingerSpellingDictionaryLayout>
      <Stack sx={{ maxWidth: 1120, mx: "auto" }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, mb: 2 }}>
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              height: 56,
              borderRadius: `${KslRadii.card}px`,
              boxShadow: KslShadows.card,
              border: `1px solid ${KslColors.border}`,
              bgcolor: "background.paper",
              px: 2,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Skeleton width="42%" height={24} />
          </Paper>
          <IconButton
            disabled
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              bgcolor: "background.paper",
              border: `1px solid ${KslColors.border}`,
              borderRadius: `${KslRadii.card}px`,
              boxShadow: KslShadows.card,
            }}
          >
            <Skeleton variant="circular" width={22} height={22} />
          </IconButton>
        </Stack>

        <Stack spacing={0}>
          {Array.from({ length: 6 }, (_, index) => (
            <DictionaryRowSkeleton key={index} />
          ))}
        </Stack>
      </Stack>
    </FingerSpellingDictionaryLayout>
  );
}
