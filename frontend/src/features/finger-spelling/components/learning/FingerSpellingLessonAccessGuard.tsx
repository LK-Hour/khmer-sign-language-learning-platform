"use client";

import { Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { PageContainer } from "@/components/layout";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuthStore } from "@/store/auth.store";
import { fetchFsTree } from "../../api/curriculum";
import { applyGuestProgress } from "../../utils/guestProgressMerge";

type FingerSpellingLessonAccessGuardProps = {
  lessonId: number;
  /** Shown while access is being checked (and while redirecting a locked lesson). */
  fallback: ReactNode;
  children: ReactNode;
};

type AccessResult = { checkKey: string; status: "allowed" | "error" };

/**
 * Keeps locked lessons from rendering when their URL is opened directly.
 *
 * The lesson page fetches on the server, where there is no auth token, so its
 * `isLocked` flag is always the anonymous one. The check therefore runs here in
 * the browser, against the same guest-aware tree the track page uses.
 */
export default function FingerSpellingLessonAccessGuard({
  lessonId,
  fallback,
  children,
}: FingerSpellingLessonAccessGuardProps) {
  const router = useRouter();
  const { locale, t } = useTranslation();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isRefreshing = useAuthStore((state) => state.isRefreshing);
  const [result, setResult] = useState<AccessResult | null>(null);

  const authReady =
    hasHydrated &&
    Boolean(user) &&
    !isRefreshing &&
    (user?.is_guest === true || Boolean(token));
  const checkKey = `${user?.id ?? ""}:${lessonId}`;

  useEffect(() => {
    if (!authReady) return;

    let ignore = false;

    void fetchFsTree()
      .then((units) => {
        if (ignore) return;

        const lesson = applyGuestProgress(units)
          .flatMap((unit) => unit.chapters)
          .flatMap((chapter) => chapter.lessons)
          .find((candidate) => candidate.id === lessonId);

        if (lesson == null || lesson.isLocked === true) {
          router.replace(`/${locale}${ROUTES.fingerSpelling.root}`);
          return;
        }
        setResult({ checkKey, status: "allowed" });
      })
      .catch(() => {
        if (!ignore) setResult({ checkKey, status: "error" });
      });

    return () => {
      ignore = true;
    };
  }, [authReady, checkKey, lessonId, locale, router]);

  const status = result?.checkKey === checkKey ? result.status : "checking";

  if (status === "allowed") return children;

  if (status === "error") {
    return (
      <PageContainer sx={{ py: { xs: 2.5, md: 4 } }}>
        <Alert severity="error" sx={{ mx: "auto" }}>
          {t("FINGER_SPELLING.TRACK.LOAD_ERROR")}
        </Alert>
      </PageContainer>
    );
  }

  return fallback;
}
