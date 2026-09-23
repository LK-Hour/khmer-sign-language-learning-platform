/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import { LocaleContextProvider } from "@/i18n/locale-context";

import RelatedItemsField, { type RelatedItem } from "./RelatedItemsField";

const item = (
  id: number,
  label: string,
  extra: Partial<RelatedItem<number>> = {},
): RelatedItem<number> => ({ id, label, order: id, source: id, ...extra });

type Props = Partial<React.ComponentProps<typeof RelatedItemsField<number>>>;

function renderField(props: Props = {}) {
  const onAttach = vi.fn();
  const onUndoAttach = vi.fn();
  const utils = render(
    <LocaleContextProvider value="en">
      <RelatedItemsField<number>
        label="Lessons"
        addLabel="Add existing lesson"
        items={[]}
        pending={[]}
        onAttach={onAttach}
        onUndoAttach={onUndoAttach}
        fetchCandidates={async () => []}
        {...props}
      />
    </LocaleContextProvider>,
  );
  return { ...utils, onAttach, onUndoAttach };
}

describe("RelatedItemsField", () => {
  it("shows the children in order with their position and a count", () => {
    renderField({
      items: [item(2, "Greetings"), item(1, "Basics"), item(3, "Family")],
    });

    expect(screen.getByText("Lessons (3)")).toBeInTheDocument();
    const labels = ["1. Basics", "2. Greetings", "3. Family"].map((text) => screen.getByText(text));
    // sorted by order, not by the order they were passed in
    expect(labels[0].compareDocumentPosition(labels[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(labels[1].compareDocumentPosition(labels[2]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("links each child to its page", () => {
    renderField({ items: [item(1, "Basics", { href: "/en/admin/learning/x/lessons/1/edit" })] });

    expect(screen.getByRole("link", { name: /basics/i })).toHaveAttribute(
      "href",
      "/en/admin/learning/x/lessons/1/edit",
    );
  });

  it("keeps a chip's own name for screen readers even when it has a tooltip", () => {
    // The tooltip carries the other-language name; it must describe the chip, not rename it.
    renderField({
      items: [item(1, "Basics", { secondaryLabel: "មូលដ្ឋាន", href: "/x" })],
      pending: [item(9, "Colors")],
    });

    expect(screen.getByRole("link", { name: "1. Basics" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Colors" })).toBeInTheDocument();
  });

  it("marks draft vs published with an accessible status", () => {
    renderField({
      items: [item(1, "Live", { status: "published" }), item(2, "WIP", { status: "draft" })],
    });

    expect(screen.getByRole("img", { name: "Published" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Draft" })).toBeInTheDocument();
  });

  it("folds long lists behind Show more and expands them", async () => {
    const seven = Array.from({ length: 7 }, (_, i) => item(i + 1, `Lesson ${i + 1}`));
    renderField({ items: seven });

    expect(screen.getByText("1. Lesson 1")).toBeInTheDocument();
    expect(screen.getByText("5. Lesson 5")).toBeInTheDocument();
    expect(screen.queryByText("6. Lesson 6")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("Show more (+2)"));
    expect(screen.getByText("7. Lesson 7")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Show less"));
    expect(screen.queryByText("6. Lesson 6")).not.toBeInTheDocument();
  });

  it("shows up to five children without any fold (the typical chapter)", () => {
    renderField({ items: Array.from({ length: 5 }, (_, i) => item(i + 1, `Lesson ${i + 1}`)) });

    expect(screen.getByText("5. Lesson 5")).toBeInTheDocument();
    expect(screen.queryByText(/show more/i)).not.toBeInTheDocument();
  });

  it("says so when nothing is linked yet", () => {
    renderField();
    expect(screen.getByText("Nothing linked yet.")).toBeInTheDocument();
  });

  it("shows pending attachments as removable chips with a note", async () => {
    const { onUndoAttach } = renderField({
      items: [item(1, "Basics")],
      pending: [item(9, "Colors")],
    });

    expect(screen.getByText("Lessons (2)")).toBeInTheDocument();
    expect(screen.getByText(/become drafts until you publish them again/i)).toBeInTheDocument();

    const pendingChip = screen.getByText("Colors").closest(".MuiChip-root") as HTMLElement;
    await userEvent.click(within(pendingChip).getByTestId("CancelIcon"));
    expect(onUndoAttach).toHaveBeenCalledWith(expect.objectContaining({ id: 9 }));
  });

  it("attaches a candidate chosen in the picker and never offers already-linked ones", async () => {
    const fetchCandidates = vi.fn(async () => [
      item(1, "Basics", { note: "Currently in Chapter 2" }),
      item(4, "Numbers", { note: "Currently in Chapter 2" }),
    ]);
    const { onAttach } = renderField({ items: [item(1, "Basics")], fetchCandidates });

    await userEvent.click(screen.getByRole("combobox", { name: /add existing lesson/i }));

    const option = await screen.findByRole("option", { name: /numbers/i });
    expect(screen.queryByRole("option", { name: /basics/i })).not.toBeInTheDocument();
    expect(option).toHaveTextContent("Numbers · Currently in Chapter 2");

    await userEvent.click(option);
    await waitFor(() => expect(onAttach).toHaveBeenCalledWith(expect.objectContaining({ id: 4 })));
    // the box is emptied so the next lesson can be searched for straight away
    expect(screen.getByRole("combobox", { name: /add existing lesson/i })).toHaveValue("");
  });
});
