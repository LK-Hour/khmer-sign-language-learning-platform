"use client";

import { useMemo, useState } from "react";

export type TrackStatusFilter =
  | "all"
  | "not_started"
  | "in_progress"
  | "completed"
  | "locked";

type TrackLessonLike = { id: number };

type TrackChapterLike<L extends TrackLessonLike> = {
  id: number;
  title: string;
  titleKh: string;
  isLocked?: boolean;
  lessons: L[];
};

type TrackUnitLike<C> = {
  id: number;
  title: string;
  titleKh: string;
  category?: string | null;
  categoryKh?: string | null;
  isLocked?: boolean;
  completedLessonCount: number;
  totalLessonCount: number;
  chapters: C[];
};

type StoreExpansion = {
  expandedUnitId: number | null;
  expandedChapterIds: Record<number, boolean>;
  toggleUnitExpanded: (unitId: number) => void;
  toggleChapterExpanded: (chapterId: number) => void;
  collapseAll: () => void;
};

export function getUnitStatus(unit: TrackUnitLike<unknown>): Exclude<TrackStatusFilter, "all"> {
  if (unit.isLocked === true) return "locked";
  if (unit.totalLessonCount > 0 && unit.completedLessonCount >= unit.totalLessonCount) {
    return "completed";
  }
  return unit.completedLessonCount > 0 ? "in_progress" : "not_started";
}

/**
 * Unit/chapter titles only match from this many characters. Single Khmer
 * letters (and short romanizations) appear inside many titles, e.g. "ខ" in
 * "លេខ", so short queries should only find lessons.
 */
const MIN_TITLE_QUERY_LENGTH = 3;

function includesQuery(query: string, values: (string | null | undefined)[]): boolean {
  return values.some((value) => (value ?? "").toLowerCase().includes(query));
}

/**
 * Search + unit/status filters for a learning track, plus the expansion
 * model the track should render with.
 *
 * Outside a text search the track keeps its stored accordion state. During a
 * text search every matching unit/chapter opens so results are visible; the
 * learner can still fold them, and those overrides reset with each new query.
 */
export function useTrackFilters<
  L extends TrackLessonLike,
  C extends TrackChapterLike<L>,
  U extends TrackUnitLike<C>,
>(units: U[], getLessonText: (lesson: L) => (string | null | undefined)[], store: StoreExpansion) {
  const [query, setQueryState] = useState("");
  const [unitIds, setUnitIds] = useState<number[]>([]);
  const [status, setStatus] = useState<TrackStatusFilter>("all");
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;
  // Count code points, not UTF-16 units, so Khmer clusters measure sensibly.
  const matchTitles = Array.from(normalizedQuery).length >= MIN_TITLE_QUERY_LENGTH;

  const setQuery = (value: string) => {
    setQueryState(value);
    setOverrides({});
  };

  const result = useMemo(() => {
    const visibleChapterIds = new Set<number>();
    const visibleLessonIds = new Set<number>();
    const practiceChapterIds = new Set<number>();

    const visibleUnits = units.filter((unit) => {
      if (unitIds.length > 0 && !unitIds.includes(unit.id)) return false;
      if (status !== "all" && getUnitStatus(unit) !== status) return false;
      if (!isSearching) return true;

      const unitHit =
        matchTitles &&
        includesQuery(normalizedQuery, [
        unit.title,
        unit.titleKh,
        unit.category,
        unit.categoryKh,
      ]);
      let anyChapter = false;

      for (const chapter of unit.chapters ?? []) {
        const chapterHit =
          unitHit ||
          (matchTitles && includesQuery(normalizedQuery, [chapter.title, chapter.titleKh]));
        const lessons = chapterHit
          ? chapter.lessons ?? []
          : (chapter.lessons ?? []).filter((lesson) =>
              includesQuery(normalizedQuery, getLessonText(lesson)),
            );

        if (chapterHit || lessons.length > 0) {
          anyChapter = true;
          visibleChapterIds.add(chapter.id);
          lessons.forEach((lesson) => visibleLessonIds.add(lesson.id));
          // Practice belongs to the whole chapter, so only show it when the
          // chapter itself (not just one lesson) matched.
          if (chapterHit) practiceChapterIds.add(chapter.id);
        }
      }

      return unitHit || anyChapter;
    });

    return { visibleUnits, visibleChapterIds, visibleLessonIds, practiceChapterIds };
  }, [units, unitIds, status, isSearching, matchTitles, normalizedQuery, getLessonText]);

  const isUnitExpanded = (unit: U): boolean => {
    if (unit.isLocked === true) return false;
    if (isSearching) return overrides[`u${unit.id}`] ?? true;
    return store.expandedUnitId === unit.id;
  };

  const isChapterExpanded = (chapter: C): boolean => {
    if (chapter.isLocked === true) return false;
    if (isSearching) return overrides[`c${chapter.id}`] ?? true;
    return store.expandedChapterIds[chapter.id] === true;
  };

  const toggleUnit = (unit: U) => {
    if (unit.isLocked === true) return;
    if (isSearching) {
      setOverrides((prev) => ({ ...prev, [`u${unit.id}`]: !isUnitExpanded(unit) }));
    } else {
      store.toggleUnitExpanded(unit.id);
    }
  };

  const toggleChapter = (chapter: C) => {
    if (chapter.isLocked === true) return;
    if (isSearching) {
      setOverrides((prev) => ({ ...prev, [`c${chapter.id}`]: !isChapterExpanded(chapter) }));
    } else {
      store.toggleChapterExpanded(chapter.id);
    }
  };

  /** True when any visible unit is open (chapters only show inside units). */
  const hasOpenSections = result.visibleUnits.some(isUnitExpanded);

  const collapseAll = () => {
    if (isSearching) {
      const closed: Record<string, boolean> = {};
      for (const unit of result.visibleUnits) {
        closed[`u${unit.id}`] = false;
        unit.chapters?.forEach((chapter) => {
          closed[`c${chapter.id}`] = false;
        });
      }
      setOverrides(closed);
    } else {
      store.collapseAll();
    }
  };

  const activeFilterCount = (unitIds.length > 0 ? 1 : 0) + (status !== "all" ? 1 : 0);

  const clearAll = () => {
    setQuery("");
    setUnitIds([]);
    setStatus("all");
  };

  return {
    query,
    setQuery,
    unitIds,
    setUnitIds,
    status,
    setStatus,
    activeFilterCount,
    clearAll,
    isSearching,
    visibleUnits: result.visibleUnits,
    /** Lessons to render inside a chapter; everything when not searching. */
    isLessonVisible: (lessonId: number) => !isSearching || result.visibleLessonIds.has(lessonId),
    isChapterVisible: (chapterId: number) =>
      !isSearching || result.visibleChapterIds.has(chapterId),
    isPracticeVisible: (chapterId: number) =>
      !isSearching || result.practiceChapterIds.has(chapterId),
    isUnitExpanded,
    isChapterExpanded,
    toggleUnit,
    toggleChapter,
    hasOpenSections,
    collapseAll,
  };
}
