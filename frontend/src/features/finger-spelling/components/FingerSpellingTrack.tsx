"use client";

import { LearningTrack } from "@/components/track";
import { ROUTES } from "@/constants/routes";
import { useTranslation } from "@/i18n/useTranslation";
import type { FsLesson } from "../types";
import {
  selectCurrentUnit,
  selectResumeLesson,
  useFingerSpellingStore,
  type FsTrackUnit,
} from "../store";
import { getLessonDisplayLetter, getPracticeDisplayRange } from "../utils/chapter";

type FingerSpellingTrackProps = {
  units: FsTrackUnit[];
};

/** Fields a learner might type to find a finger-spelling lesson. */
function getLessonSearchText(lesson: FsLesson) {
  return [lesson?.letter, lesson?.romanization, lesson?.letterNameEn, lesson?.letterNameKh];
}

export default function FingerSpellingTrack({ units }: FingerSpellingTrackProps) {
  const { locale, t } = useTranslation();
  const expandedUnitId = useFingerSpellingStore((state) => state.expandedUnitId);
  const expandedChapterIds = useFingerSpellingStore((state) => state.expandedChapterIds);
  const toggleUnitExpanded = useFingerSpellingStore((state) => state.toggleUnitExpanded);
  const toggleChapterExpanded = useFingerSpellingStore((state) => state.toggleChapterExpanded);
  const collapseAll = useFingerSpellingStore((state) => state.collapseAll);
  const resumeLesson = useFingerSpellingStore(selectResumeLesson);
  const currentUnit = useFingerSpellingStore(selectCurrentUnit);

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
        eyebrow: t("FINGER_SPELLING.TRACK.EYEBROW"),
        title: t("FINGER_SPELLING.TRACK.TITLE"),
        searchPlaceholder: t("TRACK_FILTER.SEARCH_PLACEHOLDER_FINGER"),
        unit: t("FINGER_SPELLING.LABELS.UNIT"),
        chapter: t("FINGER_SPELLING.LABELS.CHAPTER"),
        fallbackUnitTitle: t("FINGER_SPELLING.TRACK.FALLBACK_UNIT_TITLE"),
        summaryDescription: t("FINGER_SPELLING.TRACK.SUMMARY_DESCRIPTION"),
        exerciseTitle: t("FINGER_SPELLING.EXERCISE_LIST.EXERCISE_LABEL"),
        exerciseDescription: t("FINGER_SPELLING.TRACK.EXERCISE_DESCRIPTION"),
        lessonAction: t("FINGER_SPELLING.TRACK.CONTINUE"),
        practiceTitle:
          locale === "kh"
            ? t("FINGER_SPELLING.PRACTICE.CARD_LABEL_KH")
            : t("FINGER_SPELLING.PRACTICE.CARD_LABEL"),
        practiceAction: t("FINGER_SPELLING.PRACTICE.CARD_ACTION"),
      }}
      getLessonSearchText={getLessonSearchText}
      formatUnitProgress={(completed, total) =>
        locale === "kh"
          ? `${t("PHRASES.COMPLETED")} ${completed}/${total} ${t("PHRASES.LESSON")}`
          : `${t("PHRASES.LESSON")} ${completed} / ${total} ${t("PHRASES.COMPLETED")}`
      }
      exercisesHref={`/${locale}${ROUTES.fingerSpelling.exercises}`}
      lessonVariant="inline"
      getLessonSubtitle={getLessonDisplayLetter}
      lessonHref={(lessonId) => `/${locale}${ROUTES.fingerSpelling.lesson(lessonId)}`}
      getPracticeSubtitle={(chapter) => getPracticeDisplayRange(chapter?.lessons ?? [])}
      practiceHref={(chapterId) => `/${locale}${ROUTES.fingerSpelling.practice(chapterId)}`}
    />
  );
}
