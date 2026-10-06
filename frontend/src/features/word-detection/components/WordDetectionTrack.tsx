"use client";

import { LearningTrack } from "@/components/track";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import { fontFamilies } from "@/theme/fonts";
import { KslFontSizes } from "@/theme/theme";
import type { WdLesson } from "../types";
import {
  selectCurrentUnit,
  selectResumeLesson,
  useWordDetectionStore,
  type WdTrackUnit,
} from "../store";
import { getPracticeDisplayRange } from "../utils/chapter";

type WordDetectionTrackProps = {
  units: WdTrackUnit[];
};

/** Fields a learner might type to find a word lesson. */
function getLessonSearchText(lesson: WdLesson) {
  return [lesson?.word, lesson?.wordEn];
}

const PRACTICE_SUBTITLE_SX = { fontSize: KslFontSizes.lg, fontFamily: fontFamilies.khmer };

export default function WordDetectionTrack({ units }: WordDetectionTrackProps) {
  const { locale, t } = useTranslation();
  const expandedUnitId = useWordDetectionStore((s) => s.expandedUnitId);
  const expandedChapterIds = useWordDetectionStore((s) => s.expandedChapterIds);
  const toggleUnitExpanded = useWordDetectionStore((s) => s.toggleUnitExpanded);
  const toggleChapterExpanded = useWordDetectionStore((s) => s.toggleChapterExpanded);
  const collapseAll = useWordDetectionStore((s) => s.collapseAll);
  const resumeLesson = useWordDetectionStore(selectResumeLesson);
  const currentUnit = useWordDetectionStore(selectCurrentUnit);

  return (
    <LearningTrack
      units={units}
      expansion={{
        expandedUnitId,
        expandedChapterIds,
        toggleUnitExpanded,
        toggleChapterExpanded,
        collapseAll,
      }}
      resumeLesson={resumeLesson}
      currentUnit={currentUnit}
      labels={{
        eyebrow: t("WORD_DETECTION.TRACK.EYEBROW"),
        title: t("WORD_DETECTION.TRACK.TITLE"),
        searchPlaceholder: t("TRACK_FILTER.SEARCH_PLACEHOLDER_WORD"),
        unit: t("WORD_DETECTION.LABELS.UNIT"),
        chapter: t("WORD_DETECTION.LABELS.CHAPTER"),
        fallbackUnitTitle: t("WORD_DETECTION.TRACK.FALLBACK_UNIT_TITLE"),
        summaryDescription: t("WORD_DETECTION.TRACK.SUMMARY_DESCRIPTION"),
        exerciseTitle: t("WORD_DETECTION.EXERCISE_LIST.EXERCISE_LABEL"),
        exerciseDescription: t("WORD_DETECTION.TRACK.EXERCISE_DESCRIPTION"),
        lessonAction: t("WORD_DETECTION.TRACK.CONTINUE"),
        practiceTitle:
          locale === "kh"
            ? t("WORD_DETECTION.PRACTICE.CARD_LABEL_KH")
            : t("WORD_DETECTION.PRACTICE.CARD_LABEL"),
        practiceAction: t("WORD_DETECTION.PRACTICE.CARD_ACTION"),
      }}
      getLessonSearchText={getLessonSearchText}
      formatUnitProgress={(completed, total) =>
        locale === "kh"
          ? `${t("PHRASES.COMPLETED")} ${completed}/${total} ${t("PHRASES.LESSONS")}`
          : `${completed} ${t("PHRASES.OF")} ${total} ${t("PHRASES.LESSONS")} ${t("PHRASES.COMPLETED")}`
      }
      showUnitCategory
      exercisesHref={`/${locale}${ROUTES.words.exercises}`}
      lessonVariant="word"
      getLessonSubtitle={(lesson) => lesson?.word}
      lessonHref={(lessonId) => ROUTES.words.lesson(lessonId)}
      getPracticeSubtitle={(chapter) => getPracticeDisplayRange(chapter?.lessons ?? [])}
      practiceSubtitleSx={PRACTICE_SUBTITLE_SX}
      practiceHref={(chapterId) => `/${locale}${ROUTES.words.practice(chapterId)}`}
    />
  );
}
