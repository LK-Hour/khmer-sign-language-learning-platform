/**
 * The header "Back" button belongs to the practice screen only: on completion it
 * is replaced by the Back button in the actions bar (next to "Next Sentence"),
 * so there is exactly one Back link on screen at every stage.
 * The camera panel, chart and API calls are stubbed.
 *
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { LocaleContextProvider } from "@/i18n/locale-context";

vi.mock("../hooks/usePracticeSounds", () => ({
  usePracticeSounds: () => ({ playSuccess: vi.fn(), playFail: vi.fn() }),
}));
vi.mock("../api/media", () => ({ fetchLetterMedia: () => Promise.resolve({}) }));
vi.mock("../api/practice", () => ({ submitPracticeAttempt: () => Promise.resolve() }));
vi.mock("react-apexcharts", () => ({ default: () => <div data-testid="chart" /> }));
vi.mock("./SentenceSpellingCameraPanel", () => ({
  default: ({ onConfirm }: { onConfirm: (confidence: number) => void }) => (
    <button onClick={() => onConfirm(95)}>stub-confirm</button>
  ),
}));

import SentenceSpellingPracticeView from "./SentenceSpellingPracticeView";

function renderView(props: Partial<React.ComponentProps<typeof SentenceSpellingPracticeView>> = {}) {
  return render(
    <LocaleContextProvider value="en">
      <SentenceSpellingPracticeView text="កខ" source="sample" sentenceId={1} {...props} />
    </LocaleContextProvider>
  );
}

function completeSentence() {
  fireEvent.click(screen.getByText("stub-confirm"));
  fireEvent.click(screen.getByText("stub-confirm"));
}

describe("SentenceSpellingPracticeView Back button", () => {
  it("shows the header Back button while practicing", () => {
    renderView();

    expect(screen.getAllByRole("link", { name: /^Back$/ })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Practice Again/ })).not.toBeInTheDocument();
  });

  it("moves Back into the actions bar, beside Next Sentence, once complete (sample)", async () => {
    renderView({ nextSentence: { id: 2, textKh: "គឃ" } });
    completeSentence();

    const backLinks = await screen.findAllByRole("link", { name: /^Back$/ });
    expect(backLinks).toHaveLength(1);
    expect(backLinks[0]).toHaveAttribute("href", "/en/sentence-spelling/sample");
    expect(screen.getByRole("link", { name: /Next Sentence/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Practice Again/ })).toBeInTheDocument();
  });

  it("keeps a single Back (to the custom page) once complete for custom sentences", async () => {
    renderView({ source: "custom", sentenceId: undefined });
    completeSentence();

    const backLinks = await screen.findAllByRole("link", { name: /^Back$/ });
    expect(backLinks).toHaveLength(1);
    expect(backLinks[0]).toHaveAttribute("href", "/en/sentence-spelling/custom");
    expect(screen.queryByRole("link", { name: /Next Sentence/ })).not.toBeInTheDocument();
  });
});
