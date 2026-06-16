import { Paper, Skeleton, Stack } from "@mui/material";
import { FingerSpellingDictionaryLayout } from "@/features/finger-spelling/components";
import { KslColors, KslRadii, KslShadows } from "@/theme/theme";

export default function DictionaryWordLoading() {
  return (
    <FingerSpellingDictionaryLayout>
      <Stack sx={{ maxWidth: 720, mx: "auto" }}>
        <Skeleton
          variant="rounded"
          width={100}
          height={36}
          sx={{ borderRadius: `${KslRadii.button}px` }}
        />

        <Paper
          elevation={0}
          sx={{
            mt: 1,
            borderRadius: `${KslRadii.signImage}px`,
            overflow: "hidden",
            boxShadow: KslShadows.card,
            bgcolor: "background.paper",
            aspectRatio: "4 / 3",
            position: "relative",
          }}
        >
          <Skeleton variant="rectangular" width="100%" height="100%" />
        </Paper>

        <Paper
          elevation={0}
          sx={{
            mt: 2,
            mx: "auto",
            width: "100%",
            maxWidth: 418,
            border: `4px solid ${KslColors.primaryTrack}`,
            borderRadius: `${KslRadii.wordCard}px`,
            boxShadow: KslShadows.button,
            px: { xs: 4, md: 8 },
            py: 1.5,
            textAlign: "center",
            bgcolor: "background.paper",
          }}
        >
          <Stack spacing={0.5} sx={{ alignItems: "center" }}>
            <Skeleton width="82%" height={30} />
            <Skeleton width="55%" height={24} />
          </Stack>
        </Paper>
      </Stack>
    </FingerSpellingDictionaryLayout>
  );
}
