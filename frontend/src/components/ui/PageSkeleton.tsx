import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { KslColors, KslRadii } from "@/theme/theme";

type PageSkeletonVariant =
  | "list"
  | "dictionary"
  | "detail"
  | "exercise"
  | "lesson"
  | "profile";

type PageSkeletonProps = {
  variant?: PageSkeletonVariant;
  showContext?: boolean;
  fullWidth?: boolean;
};

const listRows = Array.from({ length: 4 }, (_, index) => index);
const compactRows = Array.from({ length: 6 }, (_, index) => index);

function HeaderSkeleton() {
  return (
    <Box
      sx={{
        bgcolor: KslColors.primary,
        borderBottomLeftRadius: { xs: 24, md: KslRadii.headerBottom },
        borderBottomRightRadius: { xs: 24, md: KslRadii.headerBottom },
        px: { xs: 2, md: 4 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Skeleton variant="circular" width={52} height={52} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton width="42%" height={34} />
            <Skeleton width="28%" height={24} />
          </Box>
          <Skeleton variant="rounded" width={132} height={42} />
        </Stack>
      </Box>
    </Box>
  );
}

function ContextSkeleton() {
  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 2, md: 2.5 },
        borderRadius: `${KslRadii.wordCard}px`,
        border: `1px solid ${KslColors.border}`,
        bgcolor: "background.paper",
      }}
    >
      <Skeleton width={84} height={20} />
      <Skeleton width="45%" height={32} />
      <Skeleton width="32%" height={22} />
    </Box>
  );
}

function ListSkeleton() {
  return (
    <Stack spacing={0}>
      {listRows.map((row) => (
        <Box
          key={row}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "96px 1fr 160px" },
            gap: 2,
            alignItems: "center",
            minHeight: { xs: 136, md: 124 },
            p: { xs: 2, md: 2.5 },
            borderBottom: `1px solid ${KslColors.border}`,
            bgcolor: "background.paper",
          }}
        >
          <Skeleton variant="rounded" width={72} height={72} />
          <Box>
            <Skeleton width="54%" height={30} />
            <Skeleton width="36%" height={22} />
            <Skeleton width="70%" height={18} />
          </Box>
          <Skeleton variant="rounded" width="100%" height={44} />
        </Box>
      ))}
    </Stack>
  );
}

function DictionarySkeleton() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="rounded" width="100%" height={56} />
      {compactRows.map((row) => (
        <Box
          key={row}
          sx={{
            display: "grid",
            gridTemplateColumns: "72px 1fr 28px",
            gap: 2,
            alignItems: "center",
            minHeight: 88,
            p: 2,
            borderRadius: `${KslRadii.wordCard}px`,
            border: `1px solid ${KslColors.border}`,
            bgcolor: "background.paper",
          }}
        >
          <Skeleton variant="rounded" width={64} height={64} />
          <Box>
            <Skeleton width="35%" height={28} />
            <Skeleton width="58%" height={20} />
          </Box>
          <Skeleton variant="circular" width={28} height={28} />
        </Box>
      ))}
    </Stack>
  );
}

function DetailSkeleton() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "minmax(280px, 420px) 1fr" },
        gap: { xs: 3, md: 5 },
        alignItems: "start",
      }}
    >
      <Skeleton variant="rounded" width="100%" height={360} />
      <Stack spacing={2}>
        <Skeleton width="45%" height={44} />
        <Skeleton width="80%" height={24} />
        <Skeleton width="72%" height={24} />
        <Skeleton width="64%" height={24} />
        <Skeleton variant="rounded" width={180} height={48} />
      </Stack>
    </Box>
  );
}

function LessonSkeleton() {
  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Skeleton variant="circular" width={44} height={44} />
        <Skeleton variant="rounded" width="100%" height={18} />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: { xs: 3, lg: 5 },
          alignItems: "start",
        }}
      >
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <Skeleton variant="rounded" width="100%" height={420} />
          <Skeleton variant="rounded" width="70%" height={84} />
        </Stack>
        <Stack spacing={2}>
          <Skeleton width="85%" height={24} />
          <Skeleton variant="rounded" width="100%" height={420} />
          <Box sx={{ display: "flex", gap: 2 }}>
            <Skeleton variant="rounded" width="50%" height={72} />
            <Skeleton variant="rounded" width="50%" height={72} />
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}

function ProfileSkeleton() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
        gap: 3,
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Skeleton variant="circular" width={128} height={128} />
        <Skeleton width="60%" height={32} />
        <Skeleton width="42%" height={20} />
      </Stack>
      <Stack spacing={2}>
        {compactRows.slice(0, 4).map((row) => (
          <Skeleton key={row} variant="rounded" width="100%" height={76} />
        ))}
      </Stack>
    </Box>
  );
}

function ContentSkeleton({ variant }: { variant: PageSkeletonVariant }) {
  if (variant === "dictionary") return <DictionarySkeleton />;
  if (variant === "detail") return <DetailSkeleton />;
  if (variant === "lesson") return <LessonSkeleton />;
  if (variant === "profile") return <ProfileSkeleton />;
  return <ListSkeleton />;
}

export default function PageSkeleton({
  variant = "list",
  showContext,
  fullWidth,
}: PageSkeletonProps) {
  return (
    <Box
      role="status"
      aria-label="Loading"
      sx={{
        minHeight: "100dvh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <HeaderSkeleton />
      <Box
        component="main"
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: fullWidth ? "none" : 1200,
          mx: "auto",
          px: { xs: 2, md: 4 },
          pt: { xs: 2, md: 3 },
          pb: { xs: 10, md: 16 },
        }}
      >
        {showContext && <ContextSkeleton />}
        <ContentSkeleton variant={variant} />
      </Box>
    </Box>
  );
}
