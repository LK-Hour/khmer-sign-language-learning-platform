"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Container, Skeleton, Stack } from "@mui/material";
import { ROUTES } from "@/constants/routes";
import { useLocaleStore } from "@/store/locale.store";
import { useAuthStore } from "@/store/auth.store";

type AdminGuardProps = {
  children: React.ReactNode;
};

function localizedPath(locale: string, path: string) {
  return `/${locale}${path === ROUTES.home ? "" : path}`;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocaleStore((state) => state.locale);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isRefreshing = useAuthStore((state) => state.isRefreshing);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const isAdmin = Boolean(user && isAuthenticated && user.account_type === "admin");
  const canRefreshRealUser = Boolean(user && !user.is_guest && !token);
  const isAnonymous = hasHydrated && !isRefreshing && !canRefreshRealUser && (!user || !isAuthenticated);
  const isForbidden = hasHydrated && !isRefreshing && !canRefreshRealUser && user && isAuthenticated && !isAdmin;
  const isLoading = !hasHydrated || isRefreshing || canRefreshRealUser;

  useEffect(() => {
    if (isLoading || isAdmin) return;

    if (isAnonymous) {
      const redirectTo = encodeURIComponent(pathname);
      router.replace(`${localizedPath(locale, "/login")}?redirect_to=${redirectTo}`);
      return;
    }

    if (isForbidden) {
      router.replace(localizedPath(locale, ROUTES.home));
    }
  }, [isAdmin, isAnonymous, isForbidden, isLoading, locale, pathname, router]);

  if (isLoading || !isAdmin) {
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
