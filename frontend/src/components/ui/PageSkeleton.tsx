import { Container, Grid, Paper, Skeleton, Stack } from "@mui/material";
import { KslColors, KslRadii } from "@/theme/theme";

export type PageSkeletonVariant =
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
    <Paper
      square
      elevation={0}
      sx={{
        bgcolor: KslColors.primary,
        borderBottomLeftRadius: { xs: 24, md: KslRadii.headerBottom },
        borderBottomRightRadius: { xs: 24, md: KslRadii.headerBottom },
        px: { xs: 2, md: 4 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Container maxWidth="lg">
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Skeleton variant="circular" width={52} height={52} />
          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton width="42%" height={34} />
            <Skeleton width="28%" height={24} />
          </Stack>
          <Skeleton variant="rounded" width={132} height={42} />
        </Stack>
      </Container>
    </Paper>
  );
}

function ContextSkeleton() {
  return (
    <Paper
      elevation={0}
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
    </Paper>
  );
}

function ListSkeleton() {
  return (
    <Stack spacing={0}>
      {listRows.map((row) => (
        <Paper
          key={row}
          elevation={0}
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
          <Stack>
            <Skeleton width="54%" height={30} />
            <Skeleton width="36%" height={22} />
            <Skeleton width="70%" height={18} />
          </Stack>
          <Skeleton variant="rounded" width="100%" height={44} />
        </Paper>
      ))}
    </Stack>
  );
}

function DictionarySkeleton() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="rounded" width="100%" height={56} />
      {compactRows.map((row) => (
        <Paper
          key={row}
          elevation={0}
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
          <Stack>
            <Skeleton width="35%" height={28} />
            <Skeleton width="58%" height={20} />
          </Stack>
          <Skeleton variant="circular" width={28} height={28} />
        </Paper>
      ))}
    </Stack>
  );
}

function DetailSkeleton() {
  return (
    <Grid container spacing={{ xs: 3, md: 5 }} sx={{ alignItems: "flex-start" }}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Skeleton variant="rounded" width="100%" height={360} />
      </Grid>
      <Grid size={{ xs: 12, md: 7 }} component={Stack} spacing={2}>
        <Skeleton width="45%" height={44} />
        <Skeleton width="80%" height={24} />
        <Skeleton width="72%" height={24} />
        <Skeleton width="64%" height={24} />
        <Skeleton variant="rounded" width={180} height={48} />
      </Grid>
    </Grid>
  );
}

function LessonSkeleton() {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Skeleton variant="circular" width={44} height={44} />
        <Skeleton variant="rounded" width="100%" height={18} />
      </Stack>
      <Grid container spacing={{ xs: 3, lg: 5 }} sx={{ alignItems: "flex-start" }}>
        <Grid size={{ xs: 12, lg: 6 }} component={Stack} spacing={2} sx={{ alignItems: "center" }}>
          <Skeleton variant="rounded" width="100%" height={420} />
          <Skeleton variant="rounded" width="70%" height={84} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }} component={Stack} spacing={2}>
          <Skeleton width="85%" height={24} />
          <Skeleton variant="rounded" width="100%" height={420} />
          <Stack direction="row" spacing={2}>
            <Skeleton variant="rounded" width="50%" height={72} />
            <Skeleton variant="rounded" width="50%" height={72} />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}

function ProfileSkeleton() {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 4 }} component={Stack} spacing={2} sx={{ alignItems: "center" }}>
        <Skeleton variant="circular" width={128} height={128} />
        <Skeleton width="60%" height={32} />
        <Skeleton width="42%" height={20} />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }} component={Stack} spacing={2}>
        {compactRows.slice(0, 4).map((row) => (
          <Skeleton key={row} variant="rounded" width="100%" height={76} />
        ))}
      </Grid>
    </Grid>
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
    <Stack
      role="status"
      aria-label="Loading"
      sx={{
        minHeight: "100dvh",
        bgcolor: "background.default",
      }}
    >
      <HeaderSkeleton />
      <Container
        component="main"
        maxWidth={fullWidth ? false : "lg"}
        sx={{
          flex: 1,
          width: "100%",
          px: { xs: 2, md: 4 },
          pt: { xs: 2, md: 3 },
          pb: { xs: 10, md: 16 },
        }}
      >
        {showContext && <ContextSkeleton />}
        <ContentSkeleton variant={variant} />
      </Container>
    </Stack>
  );
}

export function ListPageSkeleton() {
  return <PageSkeleton variant="list" />;
}

export function DictionaryPageSkeleton() {
  return <PageSkeleton variant="dictionary" />;
}

export function DetailPageSkeleton() {
  return <PageSkeleton variant="detail" />;
}

export function LessonPageSkeleton() {
  return <PageSkeleton variant="lesson" fullWidth />;
}

export function ProfilePageSkeleton() {
  return <PageSkeleton variant="profile" />;
}
