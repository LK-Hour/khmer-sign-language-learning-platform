/**
 * Save + publish flow of the merged Publish Status switch.
 *
 * The backend always saves a row as a draft, so "Published" means: save, then call publish.
 * Chapter and Lesson forms use the same flow; the Unit form is the simplest to drive.
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
  createUnit: vi.fn(),
  updateUnit: vi.fn(),
  publishUnit: vi.fn(),
  getUnit: vi.fn(),
}));

import { LocaleContextProvider } from "@/i18n/locale-context";
import { ApiError } from "@/utils/api/client";

import * as adminApi from "../api/adminApi";
import type { AdminUnit } from "../api/types";
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
