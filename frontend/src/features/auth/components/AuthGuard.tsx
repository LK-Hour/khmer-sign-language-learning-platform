"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { useLocaleStore } from "@/store/locale.store";
import { useAuthStore } from "@/store/auth.store";
import { ROUTES } from "@/constants/routes";

type AuthGuardProps = {
  children: React.ReactNode;
  loadingVariant?: React.ComponentProps<typeof PageSkeleton>["variant"];
};

function loginPath(locale: string) {
  return `/${locale}${ROUTES.home === "/" ? "" : ROUTES.home}/login`.replace("//", "/");
}

export default function AuthGuard({
  children,
  loadingVariant = "list",
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocaleStore((state) => state.locale);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isRefreshing = useAuthStore((state) => state.isRefreshing);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const isAllowed = Boolean(user && isAuthenticated);
  const canRefreshRealUser = Boolean(user && !user.is_guest && !token);
  const isLoading = !hasHydrated || isRefreshing || canRefreshRealUser;

  useEffect(() => {
    if (isLoading || isAllowed) return;

    const redirectTo = encodeURIComponent(pathname);
    router.replace(`${loginPath(locale)}?redirect_to=${redirectTo}`);
  }, [isAllowed, isLoading, locale, pathname, router]);

  if (isLoading || !isAllowed) {
    return <PageSkeleton variant={loadingVariant} />;
  }

  return children;
}
