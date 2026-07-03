"use client";

import { usePathname } from "next/navigation";

import { Stack } from "@mui/material";

import MainHeader from "./header-nav";

const HIDDEN_NAV_SEGMENTS = ["/login", "/test-login", "/admin"];

type AppLayoutProps = {
  children: React.ReactNode;
};

function shouldHideNav(pathname: string) {
  return HIDDEN_NAV_SEGMENTS.some((segment) => pathname.includes(segment));
}

/** Global web layout — sticky header nav on every page except auth routes. */
export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const hideNav = shouldHideNav(pathname);

  return (
    <Stack
      sx={{
        minHeight: "100dvh",
        bgcolor: "background.default",
      }}
    >
      {!hideNav && <MainHeader />}
      {children}
    </Stack>
  );
}
