"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/i18n";
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
  const locale = useLocale();
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

  if (isLoading) {
    return children;
  }

  if (!isAllowed) {
    return null;
  }

  return children;
}
