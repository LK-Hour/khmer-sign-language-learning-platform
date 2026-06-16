import { Skeleton, Stack } from "@mui/material";
import { PageContainer } from "@/components/layout";

export default function RootLoading() {
  return (
    <PageContainer>
      <Stack
        spacing={3}
        sx={{
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60dvh",
        }}
      >
        <Skeleton variant="circular" width={56} height={56} />
        <Skeleton width="32%" height={28} />
      </Stack>
    </PageContainer>
  );
}
