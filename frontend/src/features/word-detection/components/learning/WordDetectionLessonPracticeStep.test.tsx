// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import WordDetectionLessonPracticeStep from "./WordDetectionLessonPracticeStep";

vi.mock("@/i18n/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("./WordDetectionCameraPanel", () => ({ default: () => null }));
vi.mock("./WordDetectionWordCard", () => ({ default: () => null }));
afterEach(cleanup);

const props: ComponentProps<typeof WordDetectionLessonPracticeStep> = {
  word: "hello", locale: "en", orderIndex: 1, lessonStep: "1", onContinue: vi.fn(),
  detectLandmarks: vi.fn(), isLandmarkerReady: true,
};

it("identifies a live 100% match as pending confirmation and keeps Continue disabled", async () => {
  render(<WordDetectionLessonPracticeStep {...props} predictorReady liveLabel="hello" liveConfidence={100} liveLabelMatches />);
  await act(async () => {});
  expect(screen.getByRole("status").textContent).toBe("PREDICTION.CONFIRMING_MATCH");
  expect(screen.getByText("100%")).toBeTruthy();
  expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
});

it("distinguishes a confirmed match being saved from a completed save", async () => {
  const confirmed = { ...props, predictedLabel: "hello", displayLabel: "hello", displayConfidence: 100, continueEnabled: true };
  const { rerender } = render(<WordDetectionLessonPracticeStep {...confirmed} progressSaveStatus="saving" />);
  await act(async () => {});
  expect(screen.getByRole("status").textContent).toBe("PREDICTION.SAVING_PROGRESS");
  rerender(<WordDetectionLessonPracticeStep {...confirmed} progressSaveStatus="saved" />);
  expect(screen.getByRole("status").textContent).toBe("PREDICTION.PROGRESS_SAVED");
});
