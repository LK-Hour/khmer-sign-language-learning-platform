import { Box, Skeleton, Stack } from "@mui/material";

import { PageContainer } from "@/components/layout";
import MainHeaderSkeleton from "@/components/layout/header-nav/MainHeaderSkeleton";
import { KslColors, KslRadii } from "@/theme/theme";

function TileGridSkeleton({ count }: { count: number }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: "10px",
        gridTemplateColumns: {
          xs: "repeat(auto-fill, minmax(72px, 1fr))",
          md: "repeat(auto-fill, minmax(88px, 1fr))",
        },
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          variant="rounded"
          sx={{ aspectRatio: "1 / 1", height: "auto", borderRadius: "14px" }}
        />
      ))}
    </Box>
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
        <Stack spacing={3}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <Skeleton width={200} height={48} />
            <Skeleton width={80} height={20} />
          </Stack>
          <Skeleton variant="rounded" height={56} sx={{ borderRadius: `${KslRadii.button}px` }} />
          <Skeleton variant="rounded" width={260} height={48} sx={{ borderRadius: "999px" }} />

          <Stack direction="row" spacing={1} sx={{ py: 1.5, borderBottom: `1px solid ${KslColors.border}` }}>
            {[72, 120, 96, 120, 128, 88].map((width, index) => (
              <Skeleton key={index} variant="rounded" width={width} height={34} sx={{ borderRadius: "999px" }} />
            ))}
          </Stack>

          <Stack spacing={2}>
            <Skeleton width={140} height={30} />
            <TileGridSkeleton count={10} />
          </Stack>
          <Stack spacing={2}>
            <Skeleton width={180} height={30} />
            <TileGridSkeleton count={22} />
          </Stack>
        </Stack>
      </PageContainer>
    </Box>
  );
}
