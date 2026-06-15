"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import PageSkeleton from "@/components/ui/PageSkeleton";
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
    return <PageSkeleton variant="list" fullWidth />;
  }

  return children;
}
