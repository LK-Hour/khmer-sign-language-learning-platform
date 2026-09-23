/**
 * Wiring check for the practice sounds: a confirmed character plays the
 * success sound, a held wrong sign plays the fail sound, and skipping is silent.
 * The camera panel and the audio hook are stubbed — their own behaviour is
 * covered by `mismatchDetector.test.ts` and `usePracticeSounds.test.ts`.
 *
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocaleContextProvider } from "@/i18n/locale-context";

const { playSuccess, playFail } = vi.hoisted(() => ({
  playSuccess: vi.fn(),
  playFail: vi.fn(),
}));

vi.mock("../hooks/usePracticeSounds", () => ({
  usePracticeSounds: () => ({ playSuccess, playFail }),
}));

vi.mock("../api/media", () => ({ fetchLetterMedia: () => Promise.resolve({}) }));
vi.mock("../api/practice", () => ({ submitPracticeAttempt: () => Promise.resolve() }));

vi.mock("./SentenceSpellingCameraPanel", () => ({
  default: ({
    onConfirm,
    onMismatch,
  }: {
    onConfirm: (confidence: number) => void;
    onMismatch?: () => void;
  }) => (
    <div>
      <button onClick={() => onConfirm(95)}>stub-confirm</button>
      <button onClick={() => onMismatch?.()}>stub-mismatch</button>
    </div>
  ),
}));

import SentenceSpellingPracticeView from "./SentenceSpellingPracticeView";

function renderView() {
  return render(
    <LocaleContextProvider value="en">
      <SentenceSpellingPracticeView text="កខគ" source="custom" />
    </LocaleContextProvider>
  );
}

describe("SentenceSpellingPracticeView sounds", () => {
  beforeEach(() => {
    playSuccess.mockClear();
    playFail.mockClear();
  });

  it("plays the success sound when a character is confirmed", () => {
    renderView();

    fireEvent.click(screen.getByText("stub-confirm"));

    expect(playSuccess).toHaveBeenCalledTimes(1);
    expect(playFail).not.toHaveBeenCalled();
  });

  it("plays the fail sound when the camera reports a wrong sign", () => {
    renderView();

    fireEvent.click(screen.getByText("stub-mismatch"));

    expect(playFail).toHaveBeenCalledTimes(1);
    expect(playSuccess).not.toHaveBeenCalled();
  });

  it("makes no sound at all when a character is skipped", () => {
    renderView();

    fireEvent.click(screen.getByRole("button", { name: "Skip Character" }));

    expect(playSuccess).not.toHaveBeenCalled();
    expect(playFail).not.toHaveBeenCalled();
  });
});
