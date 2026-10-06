/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getUnitStatus, useTrackFilters } from "./useTrackFilters";

type Lesson = { id: number; letter: string };

const lesson = (id: number, letter: string): Lesson => ({ id, letter });

const units = [
  {
    id: 1,
    title: "Numbers",
    titleKh: "លេខ",
    completedLessonCount: 2,
    totalLessonCount: 2,
    chapters: [
      { id: 10, title: "Zero to four", titleKh: "", lessons: [lesson(100, "០"), lesson(101, "១")] },
    ],
  },
  {
    id: 2,
    title: "Consonants",
    titleKh: "ព្យញ្ជនៈ",
    completedLessonCount: 1,
    totalLessonCount: 3,
    chapters: [
      { id: 20, title: "First row", titleKh: "", lessons: [lesson(200, "ក"), lesson(201, "ខ")] },
      { id: 21, title: "Second row", titleKh: "", lessons: [lesson(210, "ច")] },
    ],
  },
  {
    id: 3,
    title: "Vowels",
    titleKh: "ស្រៈ",
    isLocked: true,
    completedLessonCount: 0,
    totalLessonCount: 1,
    chapters: [{ id: 30, title: "Basics", titleKh: "", isLocked: true, lessons: [lesson(300, "ា")] }],
  },
];

const getLessonText = (item: Lesson) => [item.letter];

function setup(expandedUnitId: number | null = 2) {
  const store = {
    expandedUnitId,
    expandedChapterIds: { 20: true },
    toggleUnitExpanded: vi.fn(),
    toggleChapterExpanded: vi.fn(),
    collapseAll: vi.fn(),
  };
  const hook = renderHook(() => useTrackFilters(units, getLessonText, store));
  return { store, hook };
}

describe("useTrackFilters", () => {
  it("shows everything and uses stored expansion when idle", () => {
    const { hook } = setup();
    const filters = hook.result.current;

    expect(filters.visibleUnits.map((unit) => unit.id)).toEqual([1, 2, 3]);
    expect(filters.isUnitExpanded(units[1])).toBe(true);
    expect(filters.isUnitExpanded(units[0])).toBe(false);
    expect(filters.hasOpenSections).toBe(true);
    expect(filters.isLessonVisible(999)).toBe(true);
  });

  it("disables collapse-all when nothing is open", () => {
    const { hook } = setup(null);
    expect(hook.result.current.hasOpenSections).toBe(false);
  });

  it("narrows to a single matching lesson and hides its chapter practice", () => {
    // "ខ" also appears in the Numbers title "លេខ"; one letter must only find lessons.
    const { hook } = setup();
    act(() => hook.result.current.setQuery("ខ"));
    const filters = hook.result.current;

    expect(filters.visibleUnits.map((unit) => unit.id)).toEqual([2]);
    expect(filters.isChapterVisible(20)).toBe(true);
    expect(filters.isChapterVisible(21)).toBe(false);
    expect(filters.isLessonVisible(201)).toBe(true);
    expect(filters.isLessonVisible(200)).toBe(false);
    expect(filters.isPracticeVisible(20)).toBe(false);
    // Search results open automatically.
    expect(filters.isChapterExpanded(units[1].chapters[0])).toBe(true);
  });

  it("keeps every lesson and practice when the unit name matches", () => {
    const { hook } = setup();
    act(() => hook.result.current.setQuery("numbers"));
    const filters = hook.result.current;

    expect(filters.visibleUnits.map((unit) => unit.id)).toEqual([1]);
    expect(filters.isLessonVisible(100)).toBe(true);
    expect(filters.isLessonVisible(101)).toBe(true);
    expect(filters.isPracticeVisible(10)).toBe(true);
  });

  it("collapses search results locally without touching the store", () => {
    const { hook, store } = setup();
    act(() => hook.result.current.setQuery("row"));
    act(() => hook.result.current.collapseAll());

    expect(hook.result.current.hasOpenSections).toBe(false);
    expect(store.collapseAll).not.toHaveBeenCalled();
  });

  it("delegates collapse-all to the store when not searching", () => {
    const { hook, store } = setup();
    act(() => hook.result.current.collapseAll());
    expect(store.collapseAll).toHaveBeenCalledOnce();
  });

  it("filters by unit and by status", () => {
    const { hook } = setup();
    act(() => hook.result.current.setUnitIds([1, 3]));
    expect(hook.result.current.visibleUnits.map((unit) => unit.id)).toEqual([1, 3]);

    act(() => hook.result.current.setStatus("locked"));
    expect(hook.result.current.visibleUnits.map((unit) => unit.id)).toEqual([3]);
    expect(hook.result.current.activeFilterCount).toBe(2);

    act(() => hook.result.current.clearAll());
    expect(hook.result.current.visibleUnits).toHaveLength(3);
    expect(hook.result.current.activeFilterCount).toBe(0);
  });

  it("derives unit status from lesson counts and lock state", () => {
    expect(getUnitStatus(units[0])).toBe("completed");
    expect(getUnitStatus(units[1])).toBe("in_progress");
    expect(getUnitStatus(units[2])).toBe("locked");
    expect(getUnitStatus({ ...units[1], completedLessonCount: 0 })).toBe("not_started");
  });
});
