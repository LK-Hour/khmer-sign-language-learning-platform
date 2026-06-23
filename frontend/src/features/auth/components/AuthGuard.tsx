"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Container, Skeleton, Stack } from "@mui/material";
import { useLocaleStore } from "@/store/locale.store";
import { useAuthStore } from "@/store/auth.store";
import { ROUTES } from "@/constants/routes";

type AuthGuardProps = {
  children: React.ReactNode;
};

function loginPath(locale: string) {
  return `/${locale}${ROUTES.home === "/" ? "" : ROUTES.home}/login`.replace("//", "/");
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocaleStore((state) => state.locale);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isRefreshing = useAuthStore((state) => state.isRefreshing);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const isAllowed = Boolean(user && isAuthenticated);
  const canRefreshRealUser = Boolean(user && !user?.is_guest && !token);
  const isLoading = !hasHydrated || isRefreshing || canRefreshRealUser;

  useEffect(() => {
    if (isLoading || isAllowed) return;

    const redirectTo = encodeURIComponent(pathname);
    router.replace(`${loginPath(locale)}?redirect_to=${redirectTo}`);
  }, [isAllowed, isLoading, locale, pathname, router]);

  if (isLoading || !isAllowed) {
    return (
      <Container
        maxWidth="xl"
        sx={{ flex: 1, width: "100%", px: { xs: 2, md: 3 }, py: { xs: 3, md: 4, lg: 6 } }}
      >
        <Stack spacing={3} sx={{ maxWidth: 720, mx: "auto" }}>
          <Skeleton width="38%" height={36} />
          <Skeleton variant="rounded" width="100%" height={200} />
          <Skeleton width="62%" height={28} />
          <Skeleton variant="rounded" width="100%" height={56} />
          <Skeleton variant="rounded" width="100%" height={56} />
        </Stack>
      </Container>
    );
  }

  return children;
}
