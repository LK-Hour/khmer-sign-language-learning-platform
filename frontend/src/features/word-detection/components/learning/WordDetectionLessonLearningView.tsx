"use client";

import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Breadcrumbs, Link, Stack, Typography } from "@mui/material";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { formatOrderIndex } from "@/features/word-detection/utils/chapter";
import type { WdChapter, WdLessonDetail, WdUnit } from "@/features/word-detection/types";
import { KslColors } from "@/theme/theme";
import WdLessonPracticeStep from "./WordDetectionLessonPracticeStep";

type WdLessonLearningViewProps = {
  lesson: WdLessonDetail;
  unit: WdUnit;
  chapter: WdChapter;
  nextLessonId?: number;
};

export default function WdLessonLearningView({
  lesson,
  unit,
  chapter,
  nextLessonId,
}: WdLessonLearningViewProps) {
  const { locale, t } = useTranslation();

  const unitLabel = locale === "kh" ? unit.titleKh || unit.title : unit.title;
  const tip =
    locale === "kh"
      ? lesson.descriptionKh || lesson.description
      : lesson.description || lesson.descriptionKh;

  const unitStep = formatOrderIndex(unit.orderIndex, locale);
  const chapterStep = formatOrderIndex(chapter.orderIndex, locale);
  const lessonStep = formatOrderIndex(lesson.orderIndex, locale);

  const trackHref = ROUTES.words.root;

  return (
    <Stack spacing={3} sx={{ pb: 6 }}>
      {/* ── Breadcrumbs ─────────────────────────────────────────────── */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        <Link underline="hover" color="inherit" href={`/${locale}${trackHref}`}>
          {t("NAV.WORD_DETECTION")}
        </Link>
        <Typography sx={{ color: KslColors.textSecondary, fontWeight: 600 }}>
          {t("WORD_DETECTION.LABELS.UNIT")} {unitStep}
        </Typography>
        <Typography sx={{ color: KslColors.textSecondary, fontWeight: 600 }}>
          {t("WORD_DETECTION.LABELS.CHAPTER")} {chapterStep}
        </Typography>
        <Typography sx={{ color: KslColors.textSecondary, fontWeight: 600 }}>
          {t("WORD_DETECTION.LABELS.LESSON")} {lessonStep}
        </Typography>
        <Typography sx={{ color: KslColors.textPrimary, fontWeight: 700 }}>
          {unitLabel} · {lesson.word}
        </Typography>
      </Breadcrumbs>

      {/* ── Page heading ─────────────────────────────────────────────── */}
      <Stack spacing={0.5}>
        <Typography
          component="h1"
          sx={{
            color: KslColors.textPrimary,
            fontSize: { xs: 26, md: 34 },
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          {t("WORD_DETECTION.LESSON.PAGE_TITLE", { word: lesson.word })}
        </Typography>
        <Typography
          sx={{
            color: KslColors.textSecondary,
            fontSize: { xs: 14, md: 16 },
            lineHeight: 1.5,
          }}
        >
          {lesson.wordEn}
        </Typography>
      </Stack>

      {/* ── Main practice layout ─────────────────────────────────────── */}
      <WdLessonPracticeStep
        word={lesson.word}
        wordEn={lesson.wordEn}
        tip={tip}
        locale={locale}
        nextLessonId={nextLessonId}
        orderIndex={lesson.orderIndex}
        lessonStep={lessonStep}
      />
    </Stack>
  );
}
