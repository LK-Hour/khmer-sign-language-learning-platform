/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { LocaleContextProvider } from "@/i18n/locale-context";

import SentenceCompletionActions from "./SentenceCompletionActions";

type ActionsProps = React.ComponentProps<typeof SentenceCompletionActions>;

function renderActions(props: Partial<ActionsProps> = {}) {
  const onRestart = vi.fn();
  render(
    <LocaleContextProvider value="en">
      <SentenceCompletionActions
        onRestart={onRestart}
        backHref="/en/sentence-spelling/custom"
        next={null}
        {...props}
      />
    </LocaleContextProvider>
  );
  return { onRestart };
}

describe("SentenceCompletionActions", () => {
  it("offers the next sentence, linked to its practice page, when there is one", () => {
    renderActions({
      next: { href: "/en/sentence-spelling/practice?source=sample&sentenceId=9", label: "ខ្ញុំសុខសប្បាយ" },
    });

    const link = screen.getByRole("link", { name: "Next Sentence: ខ្ញុំសុខសប្បាយ" });
    expect(link).toHaveAttribute("href", "/en/sentence-spelling/practice?source=sample&sentenceId=9");
    expect(link).toHaveTextContent("Next Sentence");
  });

  it("keeps Back next to Next Sentence, before it", () => {
    renderActions({
      backHref: "/en/sentence-spelling/sample",
      next: { href: "/en/sentence-spelling/practice?source=sample&sentenceId=9", label: "ខ្ញុំសុខសប្បាយ" },
    });

    const back = screen.getByRole("link", { name: /^Back$/ });
    const next = screen.getByRole("link", { name: /Next Sentence/ });
    expect(back).toHaveAttribute("href", "/en/sentence-spelling/sample");
    expect(back.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows only Back when there is no next sentence", () => {
    renderActions({ next: null });

    const link = screen.getByRole("link", { name: /Back/ });
    expect(link).toHaveAttribute("href", "/en/sentence-spelling/custom");
    expect(screen.queryByText("Next Sentence")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("restarts the practice run from the Practice Again button", () => {
    const { onRestart } = renderActions();

    fireEvent.click(screen.getByRole("button", { name: /Practice Again/ }));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
