import { Box, Paper, Skeleton, Stack } from "@mui/material";
import { KslColors, KslRadii, KslShadows } from "@/theme/theme";

const darkOverlay = "rgba(15, 23, 42, 0.62)";

export default function LoginLoading() {
  return (
    <Stack
      component="main"
      role="status"
      aria-label="Loading login"
      sx={{
        minHeight: "100dvh",
        position: "relative",
        overflowY: "auto",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4, md: 5 },
        gap: { xs: 2.5, md: 3 },
        bgcolor: KslColors.secondaryDark,
        alignItems: "center",
        justifyContent: "space-between",
        backgroundImage: `
          linear-gradient(${darkOverlay}, ${darkOverlay}),
          url("/assets/bg_login_pg.jpg")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Box aria-hidden sx={{ height: { xs: 32, sm: 36 }, flexShrink: 0 }} />

      <Paper
        elevation={0}
        sx={{
          width: { xs: "100%", sm: 720, md: 910 },
          maxWidth: "100%",
          minHeight: { xs: "auto", md: 408 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          overflow: "hidden",
          borderRadius: `${KslRadii.card}px`,
          bgcolor: "background.paper",
          boxShadow: KslShadows.drop,
        }}
      >
        <Stack
          sx={{
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: { xs: 3, sm: 4, md: 5 },
            py: { xs: 3, sm: 3, md: 4 },
            pb: { xs: 0, sm: 0 },
            borderRight: { xs: "none", md: `2px dotted ${KslColors.border}` },
          }}
        >
          <Skeleton variant="rounded" width={78} height={78} sx={{ mb: 1 }} />
          <Skeleton width="72%" height={40} />
          <Skeleton width="46%" height={22} sx={{ mt: 1 }} />
          <Skeleton width="92%" height={24} sx={{ mt: 2 }} />
          <Skeleton width="78%" height={24} />
        </Stack>

        <Stack
          sx={{
            justifyContent: "center",
            px: { xs: 3, sm: 4, md: 4.5 },
            py: { xs: 2, sm: 3, md: 2 },
            pt: { xs: 1, sm: 2 },
          }}
        >
          <Stack spacing={2} sx={{ width: "100%", maxWidth: { xs: "100%", sm: 350 }, mx: "auto" }}>
            <Skeleton
              variant="rounded"
              width="100%"
              height={52}
              sx={{ display: { xs: "none", sm: "block" } }}
            />
            <Stack sx={{ width: "100%", minHeight: { xs: 386, sm: 386, md: 360 } }}>
              <Stack spacing={1.5}>
                <Stack spacing={0.5}>
                  <Skeleton width="52%" height={32} />
                  <Skeleton width="86%" height={22} />
                </Stack>
                <Stack spacing={1.2}>
                  <Skeleton variant="rounded" width="100%" height={50} />
                  <Skeleton variant="rounded" width="100%" height={50} />
                  <Skeleton variant="rounded" width="100%" height={50} />
                </Stack>
                <Skeleton width="100%" height={24} />
                <Skeleton variant="rounded" width="100%" height={50} />
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Paper>

      <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, flexShrink: 0 }}>
        <Skeleton width={84} height={22} sx={{ bgcolor: "rgba(255,255,255,0.24)" }} />
        <Skeleton
          variant="rounded"
          width={72}
          height={28}
          sx={{ bgcolor: "rgba(255,255,255,0.24)", borderRadius: `${KslRadii.wordCard}px` }}
        />
      </Stack>
    </Stack>
  );
}
