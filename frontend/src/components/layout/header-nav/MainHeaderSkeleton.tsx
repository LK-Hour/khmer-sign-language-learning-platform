"use client";

import { AppBar, Container, Grid, Skeleton, Stack, Toolbar } from "@mui/material";

/** Matches the rendered MainHeader toolbar height to avoid layout shift on hydration. */
export const MAIN_HEADER_HEIGHT = 85;

export default function MainHeaderSkeleton() {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      aria-hidden
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        backdropFilter: "blur(6px)",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: MAIN_HEADER_HEIGHT,
          height: MAIN_HEADER_HEIGHT,
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
          <Grid container sx={{ width: "100%", alignItems: "center" }}>
            <Grid size={4}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Skeleton
                  variant="rounded"
                  width={44}
                  height={44}
                  sx={{ borderRadius: 1.5, flexShrink: 0 }}
                />
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Skeleton width={88} height={12} />
                  <Skeleton width={160} height={18} />
                </Stack>
              </Stack>
            </Grid>

            <Grid
              size={8}
              sx={{
                display: { xs: "none", md: "flex" },
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Skeleton width={72} height={24} />
                <Skeleton width={118} height={24} />
                <Skeleton width={92} height={24} />
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton
                  variant="rounded"
                  width={140}
                  height={52}
                  sx={{ borderRadius: "10px", ml: 1.5 }}
                />
              </Stack>
            </Grid>

            <Grid
              size={8}
              sx={{
                display: { xs: "flex", md: "none" },
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <Skeleton variant="circular" width={40} height={40} />
            </Grid>
          </Grid>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
