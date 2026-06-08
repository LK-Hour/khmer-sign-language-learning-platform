import { Button, Link, Stack, Typography } from "@mui/material";
import Image from "next/image";

export default function Home() {
  return (
    <Stack
      sx={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Stack
        component="main"
        spacing={6}
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: 768,
          minHeight: "100vh",
          alignItems: { xs: "center", sm: "flex-start" },
          justifyContent: "space-between",
          bgcolor: "background.paper",
          px: { xs: 3, sm: 8 },
          py: { xs: 8, sm: 16 },
        }}
      >
        <Image
          src="/assets/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <Stack
          spacing={3}
          sx={{
            alignItems: { xs: "center", sm: "flex-start" },
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          <Typography
            component="h1"
            sx={{
              maxWidth: 320,
              fontSize: 30,
              lineHeight: "40px",
              fontWeight: 600,
              color: "text.primary",
            }}
          >
            To get started, edit the page.tsx file.
          </Typography>
          <Typography sx={{ maxWidth: 448, fontSize: 18, lineHeight: "32px", color: "text.secondary" }}>
            Looking for a starting point or more instructions? Head over to{" "}
            <Link
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              color="inherit"
              sx={{ fontWeight: 600 }}
            >
              Templates
            </Link>{" "}
            or the{" "}
            <Link
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              color="inherit"
              sx={{ fontWeight: 600 }}
            >
              Learning
            </Link>{" "}
            center.
          </Typography>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            component="a"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            sx={{ height: 48, minWidth: { xs: "100%", md: 158 }, borderRadius: 999, gap: 1 }}
          >
            <Image
              src="/favicon/favicon.ico"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </Button>
          <Button
            component="a"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            sx={{ height: 48, minWidth: { xs: "100%", md: 158 }, borderRadius: 999 }}
          >
            Documentation
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
