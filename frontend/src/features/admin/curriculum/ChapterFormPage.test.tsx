/**
 * Relationship section of the Chapter form: link up to its unit, lessons below it.
 *
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../api/adminApi", () => ({
  getChapter: vi.fn(),
  getUnit: vi.fn(),
  listUnits: vi.fn(),
  listChapters: vi.fn(),
  listLessons: vi.fn(),
  createChapter: vi.fn(),
  updateChapter: vi.fn(),
  publishChapter: vi.fn(),
  updateLesson: vi.fn(),
}));

import { LocaleContextProvider } from "@/i18n/locale-context";

import * as adminApi from "../api/adminApi";
import type { AdminChapter, AdminLesson, AdminUnit } from "../api/types";
import ChapterFormPage from "./ChapterFormPage";

const base = {
  name_kh: "ឈ្មោះ",
  description_en: null,
  description_kh: null,
  is_active: true,
  publish_status: "draft" as const,
  published_at: null,
  created_at: null,
  updated_at: null,
};

const unit = (o: Partial<AdminUnit> = {}): AdminUnit => ({
  ...base,
  id: 2,
  name_en: "Basics",
  order_index: 1,
  chapter_count: 1,
  ...o,
});
const chapter = (o: Partial<AdminChapter> = {}): AdminChapter => ({
  ...base,
  id: 7,
  unit_id: 2,
  name_en: "Greetings",
  order_index: 1,
  level: null,
  lesson_count: 0,
  exercise_count: 0,
  ...o,
});
const lesson = (o: Partial<AdminLesson> = {}): AdminLesson => ({
  ...base,
  id: 40,
  chapter_id: 7,
  name_en: "Hello",
  order_index: 1,
  exercise_count: 0,
  ...o,
});

const api = vi.mocked(adminApi);

function renderForm(entityId?: number) {
  return render(
    <LocaleContextProvider value="en">
      <ChapterFormPage track="word_detection" entityId={entityId} />
    </LocaleContextProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.listUnits.mockResolvedValue([unit()]);
  api.listChapters.mockResolvedValue([]);
  api.listLessons.mockResolvedValue([]);
  api.getUnit.mockResolvedValue(unit());
  api.updateLesson.mockResolvedValue(lesson());
});

describe("ChapterFormPage relationships", () => {
  it("links up to the parent unit and lists the chapter's lessons", async () => {
    api.getChapter.mockResolvedValue(chapter());
    api.listLessons.mockImplementation(async (_track, chapterId) =>
      chapterId === 7
        ? [lesson({ id: 41, name_en: "Thanks", order_index: 2 }), lesson({ id: 40, name_en: "Hello" })]
        : [],
    );
    renderForm(7);

    expect(await screen.findByText("Lessons (2)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Unit · Basics" })).toHaveAttribute(
      "href",
      "/en/admin/learning/word-detection/units/2/edit",
    );
    expect(screen.getByRole("link", { name: /1\. hello/i })).toHaveAttribute(
      "href",
      "/en/admin/learning/word-detection/lessons/40/edit",
    );
  });

  it("tells the admin to pick a unit when none is chosen (a chapter always needs one)", async () => {
    renderForm();

    expect(await screen.findByText(/not chosen yet/i)).toBeInTheDocument();
    expect(screen.getByText("Lessons (0)")).toBeInTheDocument();
  });

  it("moves a chosen lesson into the chapter after the last lesson, on save", async () => {
    api.getChapter.mockResolvedValue(chapter());
    api.updateChapter.mockResolvedValue(chapter());
    api.listChapters.mockResolvedValue([chapter({ id: 8, name_en: "Old Chapter" })]);
    api.listLessons.mockImplementation(async (_track, chapterId) =>
      chapterId === 7
        ? [lesson({ id: 40, order_index: 5 })]
        : [lesson({ id: 50, chapter_id: 8, name_en: "Numbers", order_index: 1 })],
    );
    renderForm(7);
    await screen.findByText("5. Hello");

    await userEvent.click(screen.getByRole("combobox", { name: /add existing lesson/i }));
    await userEvent.click(await screen.findByRole("option", { name: /numbers · currently in old chapter/i }));
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(api.updateLesson).toHaveBeenCalledWith("word_detection", 50, {
      chapter_id: 7,
      order_index: 6,
    });
  });
});
