"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { refreshAuthSession } from "@/utils/api/client";

const TOKEN_REFRESH_BUFFER_MS = 2 * 60 * 1000;
const TOKEN_WATCH_INTERVAL_MS = 60 * 1000;

function shouldRefresh(tokenExpiresAt: number | null): boolean {
  if (tokenExpiresAt == null) return true;
  return tokenExpiresAt <= Date.now() + TOKEN_REFRESH_BUFFER_MS;
}

type AuthProviderProps = {
  children: React.ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const tokenExpiresAt = useAuthStore((state) => state.tokenExpiresAt);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!hasHydrated || !user || user.is_guest) return;
    if (token && !shouldRefresh(tokenExpiresAt)) return;

    void refreshAuthSession();
  }, [hasHydrated, token, tokenExpiresAt, user]);

  useEffect(() => {
    if (!hasHydrated) return;

    const intervalId = window.setInterval(() => {
      const state = useAuthStore.getState();
      if (!state.user || state.user.is_guest) return;
      if (!shouldRefresh(state.tokenExpiresAt)) return;

      void refreshAuthSession();
    }, TOKEN_WATCH_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [hasHydrated]);

  return children;
}
