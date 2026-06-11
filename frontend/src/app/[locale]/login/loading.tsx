import { Paper, Skeleton, Stack } from '@mui/material';
import { KslColors, KslRadii, KslShadows } from '@/theme/theme';

export default function Loading() {
  return (
    <Stack
      component="main"
      role="status"
      aria-label="Loading login"
      sx={{
        minHeight: '100dvh',
        overflowY: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4, md: 5 },
        gap: { xs: 2.5, md: 3 },
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: KslColors.primaryLighter,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: { xs: '100%', sm: 720, md: 910 },
          maxWidth: '100%',
          minHeight: { md: 408 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          overflow: 'hidden',
          borderRadius: `${KslRadii.card}px`,
          bgcolor: 'background.paper',
          boxShadow: KslShadows.drop,
        }}
      >
        <Stack
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            px: { xs: 3, sm: 4, md: 5 },
            py: { xs: 4, sm: 5, md: 4 },
            borderRight: { xs: 'none', md: `2px dotted ${KslColors.border}` },
          }}
        >
          <Skeleton variant="rounded" width={78} height={78} sx={{ mb: 2 }} />
          <Skeleton width="70%" height={44} />
          <Skeleton width="58%" height={26} />
          <Skeleton width="88%" height={24} sx={{ mt: 2 }} />
          <Skeleton width="76%" height={24} />
        </Stack>

        <Stack
          spacing={2}
          sx={{
            justifyContent: 'center',
            px: { xs: 3, sm: 4, md: 4.5 },
            py: { xs: 3, sm: 4, md: 2 },
          }}
        >
          <Skeleton variant="rounded" width="100%" height={52} />
          <Skeleton width="52%" height={32} />
          <Skeleton width="84%" height={20} />
          <Skeleton variant="rounded" width="100%" height={39} />
          <Skeleton variant="rounded" width="100%" height={39} />
          <Skeleton variant="rounded" width="100%" height={39} />
        </Stack>
      </Paper>
    </Stack>
  );
}
