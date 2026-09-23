/**
 * Save + publish flow of the merged Publish Status switch.
 *
 * The backend always saves a row as a draft, so "Published" means: save, then call publish.
 * Chapter and Lesson forms use the same flow; the Unit form is the simplest to drive.
 *
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../api/adminApi", () => ({
  createUnit: vi.fn(),
  updateUnit: vi.fn(),
  publishUnit: vi.fn(),
  getUnit: vi.fn(),
  listUnits: vi.fn(),
  listChapters: vi.fn(),
  updateChapter: vi.fn(),
}));

import { LocaleContextProvider } from "@/i18n/locale-context";
import { ApiError } from "@/utils/api/client";

import * as adminApi from "../api/adminApi";
import type { AdminChapter, AdminUnit } from "../api/types";
import UnitFormPage from "./UnitFormPage";

const unit = (overrides: Partial<AdminUnit> = {}): AdminUnit => ({
  id: 5,
  name_en: "Basics",
  name_kh: "មូលដ្ឋាន",
  description_en: null,
  description_kh: null,
  order_index: 1,
  is_active: true,
  publish_status: "draft",
  published_at: null,
  created_at: null,
  updated_at: null,
  chapter_count: 0,
  ...overrides,
});

const chapter = (overrides: Partial<AdminChapter> = {}): AdminChapter => ({
  id: 21,
  unit_id: 2,
  name_en: "Greetings",
  name_kh: "ស្វាគមន៍",
  description_en: null,
  description_kh: null,
  order_index: 1,
  is_active: true,
  publish_status: "draft",
  published_at: null,
  created_at: null,
  updated_at: null,
  level: null,
  lesson_count: 0,
  exercise_count: 0,
  ...overrides,
});

const api = vi.mocked(adminApi);

function renderForm(entityId?: number) {
  return render(
    <LocaleContextProvider value="en">
      <UnitFormPage track="finger" entityId={entityId} />
    </LocaleContextProvider>,
  );
}

async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText(/name \(en\)/i), "Basics");
  await userEvent.type(screen.getByLabelText(/name \(kh\)/i), "មូលដ្ឋាន");
}

beforeEach(() => {
  vi.clearAllMocks();
  api.listChapters.mockResolvedValue([]);
  api.listUnits.mockResolvedValue([]);
  api.updateChapter.mockResolvedValue(chapter());
});

describe("UnitFormPage publish status", () => {
  it("saves as a draft and does not publish when the switch is off", async () => {
    api.createUnit.mockResolvedValue(unit());
    renderForm();

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(api.publishUnit).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(expect.stringContaining("?success=created"));
  });

  it("saves, then publishes when the switch is on", async () => {
    api.createUnit.mockResolvedValue(unit());
    api.publishUnit.mockResolvedValue(unit({ publish_status: "published" }));
    renderForm();

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(api.createUnit).toHaveBeenCalledTimes(1);
    expect(api.publishUnit).toHaveBeenCalledWith("finger", 5);
    expect(push).toHaveBeenCalledWith(expect.stringContaining("?success=published"));
  });

  it("does not create a duplicate when publishing fails and the admin saves again", async () => {
    api.createUnit.mockResolvedValue(unit());
    api.updateUnit.mockResolvedValue(unit());
    api.publishUnit.mockRejectedValueOnce(new ApiError(409, "/publish", "Parent not published"));
    api.publishUnit.mockResolvedValueOnce(unit({ publish_status: "published" }));
    renderForm();

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/saved as a draft, but it could not be published/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(api.createUnit).toHaveBeenCalledTimes(1);
    expect(api.updateUnit).toHaveBeenCalledWith("finger", 5, expect.any(Object));
    expect(api.publishUnit).toHaveBeenCalledTimes(2);
  });

  it("reflects the row's current status in edit mode", async () => {
    api.getUnit.mockResolvedValue(unit({ publish_status: "published" }));
    renderForm(5);

    expect(await screen.findByText("Published")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("locks the switch off for a soft-deleted row, even if it was published", async () => {
    api.getUnit.mockResolvedValue(unit({ publish_status: "published", is_active: false }));
    renderForm(5);

    await waitFor(() => expect(screen.getByRole("switch")).toBeDisabled());
    expect(screen.getByRole("switch")).not.toBeChecked();
  });
});

describe("UnitFormPage relationships", () => {
  it("lists the unit's active chapters in order and links each one", async () => {
    api.getUnit.mockResolvedValue(unit());
    api.listChapters.mockImplementation(async (_track, unitId) =>
      unitId === 5
        ? [
            chapter({ id: 22, name_en: "Family", order_index: 2 }),
            chapter({ id: 21, name_en: "Greetings", order_index: 1, publish_status: "published" }),
            chapter({ id: 23, name_en: "Removed", order_index: 3, is_active: false }),
          ]
        : [],
    );
    renderForm(5);

    expect(await screen.findByText("Chapters (2)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /1\. greetings/i })).toHaveAttribute(
      "href",
      "/en/admin/learning/finger-spelling/chapters/21/edit",
    );
    expect(screen.getByText("2. Family")).toBeInTheDocument();
    expect(screen.queryByText(/removed/i)).not.toBeInTheDocument();
  });

  it("moves a chosen existing chapter under a new unit after creating it", async () => {
    api.createUnit.mockResolvedValue(unit({ id: 5 }));
    api.listUnits.mockResolvedValue([unit({ id: 2, name_en: "Old Unit" })]);
    api.listChapters.mockResolvedValue([chapter({ id: 21, unit_id: 2 })]);
    renderForm();

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("combobox", { name: /add existing chapter/i }));
    await userEvent.click(await screen.findByRole("option", { name: /greetings · currently in old unit/i }));
    expect(screen.getByText("Chapters (1)")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(api.updateChapter).toHaveBeenCalledWith("finger", 21, { unit_id: 5, order_index: 1 });
    // the unit has to exist before a chapter can be moved into it
    expect(api.createUnit.mock.invocationCallOrder[0]).toBeLessThan(
      api.updateChapter.mock.invocationCallOrder[0],
    );
  });

  it("appends attached chapters after the unit's current last chapter on edit", async () => {
    api.getUnit.mockResolvedValue(unit());
    api.updateUnit.mockResolvedValue(unit());
    api.listChapters.mockImplementation(async (_track, unitId) =>
      unitId === 5
        ? [chapter({ id: 30, unit_id: 5, name_en: "Existing", order_index: 3 })]
        : [chapter({ id: 21, unit_id: 2 })],
    );
    renderForm(5);
    await screen.findByText("3. Existing");

    await userEvent.click(screen.getByRole("combobox", { name: /add existing chapter/i }));
    await userEvent.click(await screen.findByRole("option", { name: /greetings/i }));
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(api.updateChapter).toHaveBeenCalledWith("finger", 21, { unit_id: 5, order_index: 4 });
  });

  it("lets a staged chapter be undone before saving", async () => {
    api.createUnit.mockResolvedValue(unit());
    api.listChapters.mockResolvedValue([chapter({ id: 21, unit_id: 2 })]);
    renderForm();

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("combobox", { name: /add existing chapter/i }));
    await userEvent.click(await screen.findByRole("option", { name: /greetings/i }));

    const chip = screen.getByText("Greetings").closest(".MuiChip-root") as HTMLElement;
    await userEvent.click(within(chip).getByTestId("CancelIcon"));
    expect(screen.getByText("Chapters (0)")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(api.updateChapter).not.toHaveBeenCalled();
  });

  it("stays on the form and keeps the chapter pending when moving it fails", async () => {
    api.createUnit.mockResolvedValue(unit());
    api.updateChapter.mockRejectedValue(new ApiError(409, "/chapters/21", "Order already used"));
    api.listChapters.mockResolvedValue([chapter({ id: 21, unit_id: 2 })]);
    renderForm();

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("combobox", { name: /add existing chapter/i }));
    await userEvent.click(await screen.findByRole("option", { name: /greetings/i }));
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/order already used/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Chapters (1)")).toBeInTheDocument();
  });
});
