/**
 * Media Library edit page: preview + details, and linking the media to letters/words.
 *
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../api/mediaAdminApi", () => ({
  getMediaDetail: vi.fn(),
  associateMedia: vi.fn(),
  disassociateMedia: vi.fn(),
}));
vi.mock("../api/dictionaryAdminApi", () => ({
  listCharacters: vi.fn(),
  listWords: vi.fn(),
}));

import { LocaleContextProvider } from "@/i18n/locale-context";
import { ApiError } from "@/utils/api/client";

import type { DictionaryItem, PaginatedDictionaryResponse } from "../api/dictionaryAdminApi";
import * as dictionaryApi from "../api/dictionaryAdminApi";
import * as mediaApi from "../api/mediaAdminApi";
import type { MediaResponse } from "../api/mediaAdminApi";
import MediaEditPage from "./MediaEditPage";

const media = (overrides: Partial<MediaResponse> = {}): MediaResponse => ({
  id: 12,
  media_type: "image",
  file_url: "/uploads/a.png",
  created_at: "2026-01-05T10:00:00Z",
  associations: [],
  ...overrides,
});

const dictionaryItem = (id: number, name_kh: string, name_en: string | null = null): DictionaryItem => ({
  id,
  name_kh,
  name_en,
  media_count: 0,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
});

const page = (items: DictionaryItem[]): PaginatedDictionaryResponse => ({
  items,
  total: items.length,
  page: 1,
  size: 20,
  pages: 1,
});

const api = vi.mocked(mediaApi);
const dictionary = vi.mocked(dictionaryApi);

function renderPage() {
  return render(
    <LocaleContextProvider value="en">
      <MediaEditPage mediaId={12} />
    </LocaleContextProvider>,
  );
}

async function pickOption(label: RegExp, option: RegExp) {
  await userEvent.click(screen.getByRole("combobox", { name: label }));
  await userEvent.click(await screen.findByRole("option", { name: option }));
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getMediaDetail.mockResolvedValue(media());
  api.associateMedia.mockResolvedValue(media());
  api.disassociateMedia.mockResolvedValue(media());
  dictionary.listCharacters.mockResolvedValue(page([dictionaryItem(3, "ក", "Ka"), dictionaryItem(4, "ខ", "Kha")]));
  dictionary.listWords.mockResolvedValue(page([dictionaryItem(8, "សួស្តី", "Hello")]));
});

describe("MediaEditPage", () => {
  it("shows the full-size preview and the asset's details", async () => {
    renderPage();

    const img = await screen.findByRole("img", { name: "Media 12" });
    expect(img.getAttribute("src")).toMatch(/\/uploads\/a\.png$/);
    expect(screen.getByRole("heading", { name: "Edit Media #12" })).toBeInTheDocument();
    expect(screen.getByText("image")).toBeInTheDocument();
    expect(screen.getByText("/uploads/a.png")).toBeInTheDocument();
  });

  it("plays a video in a video player instead of an image", async () => {
    api.getMediaDetail.mockResolvedValue(media({ media_type: "video", file_url: "/uploads/a.mp4" }));
    const { container } = renderPage();

    await screen.findByText("Details");
    expect(container.querySelector("video")).toHaveAttribute("controls");
    expect(screen.queryByRole("img", { name: "Media 12" })).not.toBeInTheDocument();
  });

  it("lists the linked characters and words and links to their edit pages", async () => {
    api.getMediaDetail.mockResolvedValue(
      media({
        associations: [
          { target_type: "letter", target_id: 3, target_name: "ក" },
          { target_type: "word", target_id: 8, target_name: "សួស្តី" },
        ],
      }),
    );
    renderPage();

    expect(await screen.findByText("Linked characters & words (2)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Character · ក" })).toHaveAttribute(
      "href",
      "/en/admin/dictionary/characters/3/edit",
    );
    expect(screen.getByRole("link", { name: "Word · សួស្តី" })).toHaveAttribute(
      "href",
      "/en/admin/dictionary/words/8/edit",
    );
  });

  it("says so when the media isn't linked to anything", async () => {
    renderPage();
    expect(await screen.findByText(/not linked to any character or word yet/i)).toBeInTheDocument();
  });

  it("links a chosen character on save and returns to the library", async () => {
    renderPage();
    await screen.findByText("Details");

    await pickOption(/add character/i, /ខ · kha/i);
    expect(screen.getByText("Linked characters & words (1)")).toBeInTheDocument();
    // nothing is sent until Save
    expect(api.associateMedia).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/en/admin/media?success=updated"));
    expect(api.associateMedia).toHaveBeenCalledWith(12, { target_type: "letter", target_id: 4 });
    expect(api.disassociateMedia).not.toHaveBeenCalled();
  });

  it("searches words instead when the Word type is chosen", async () => {
    renderPage();
    await screen.findByText("Details");

    await userEvent.click(screen.getByRole("button", { name: "Word" }));
    await pickOption(/add word/i, /hello/i);
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(dictionary.listWords).toHaveBeenCalled();
    expect(api.associateMedia).toHaveBeenCalledWith(12, { target_type: "word", target_id: 8 });
  });

  it("does not offer something that is already linked", async () => {
    api.getMediaDetail.mockResolvedValue(
      media({ associations: [{ target_type: "letter", target_id: 3, target_name: "ក" }] }),
    );
    renderPage();
    await screen.findByText("Linked characters & words (1)");

    await userEvent.click(screen.getByRole("combobox", { name: /add character/i }));

    expect(await screen.findByRole("option", { name: /ខ · kha/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /ក · ka/i })).not.toBeInTheDocument();
  });

  it("unlinks a removed character on save without navigating when the chip's delete is clicked", async () => {
    api.getMediaDetail.mockResolvedValue(
      media({ associations: [{ target_type: "letter", target_id: 3, target_name: "ក" }] }),
    );
    renderPage();
    await screen.findByText("Linked characters & words (1)");

    const chip = screen.getByText(/Character · ក/).closest(".MuiChip-root") as HTMLElement;
    await userEvent.click(within(chip).getByTestId("CancelIcon"));
    expect(screen.getByText("Linked characters & words (0)")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(api.disassociateMedia).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(api.disassociateMedia).toHaveBeenCalledWith(12, { target_type: "letter", target_id: 3 });
    expect(api.associateMedia).not.toHaveBeenCalled();
  });

  it("makes no changes when nothing was edited", async () => {
    renderPage();
    await screen.findByText("Details");

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(api.associateMedia).not.toHaveBeenCalled();
    expect(api.disassociateMedia).not.toHaveBeenCalled();
  });

  it("stays on the page when a link fails and a retry only redoes what's left", async () => {
    api.associateMedia
      .mockResolvedValueOnce(media()) // first link succeeds
      .mockRejectedValueOnce(new ApiError(409, "/associate", "Already associated"))
      .mockResolvedValueOnce(media()); // retry of the second one
    renderPage();
    await screen.findByText("Details");

    await pickOption(/add character/i, /ក · ka/i);
    await pickOption(/add character/i, /ខ · kha/i);
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/already associated/i)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    // 3 calls in total: first link once, second link twice (fail, then succeed)
    expect(api.associateMedia.mock.calls.map(([, body]) => body.target_id)).toEqual([3, 4, 4]);
  });

  it("shows an error instead of the form when the media can't be loaded", async () => {
    api.getMediaDetail.mockRejectedValue(new ApiError(404, "/media/12", "Media not found"));
    renderPage();

    expect(await screen.findByText("Media not found")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument();
  });
});
