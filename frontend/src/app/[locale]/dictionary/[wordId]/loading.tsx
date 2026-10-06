import { Box, Skeleton, Stack } from "@mui/material";

import { PageContainer } from "@/components/layout";
import MainHeaderSkeleton from "@/components/layout/header-nav/MainHeaderSkeleton";
import { KslPalette, KslRadii } from "@/theme/theme";

export default function DictionaryWordLoading() {
  return (
    <Box
      aria-busy
      aria-label="Loading dictionary word"
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
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Skeleton width={220} height={36} />
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rounded" width={64} height={34} sx={{ borderRadius: "999px" }} />
              <Skeleton variant="rounded" width={64} height={34} sx={{ borderRadius: "999px" }} />
            </Stack>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: { xs: 3, md: 5 },
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 7fr) minmax(0, 5fr)" },
              alignItems: "center",
            }}
          >
            <Skeleton
              variant="rounded"
              sx={{
                width: "100%",
                height: "auto",
                aspectRatio: "1 / 1",
                maxHeight: { md: 560 },
                borderRadius: `${KslRadii.signImage}px`,
                bgcolor: KslPalette.primary.lighter,
              }}
            />
            <Stack spacing={2}>
              <Skeleton width="45%" height={120} />
              <Skeleton width="30%" height={32} />
              <Skeleton width="60%" height={20} />
              <Skeleton variant="rounded" width={220} height={52} sx={{ borderRadius: `${KslRadii.button}px` }} />
            </Stack>
          </Box>
        </Stack>
      </PageContainer>
    </Box>
  );
}
