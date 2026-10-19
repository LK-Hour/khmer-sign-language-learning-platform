// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type ChapterPracticeStep from "./ChapterPracticeStep";
import type { WdChapterPractice } from "../../types";

const state = vi.hoisted(() => ({
  prediction: { label: null as string | null, confidence: 0, seq: 0, sampledAt: 0 },
  step: null as ComponentProps<typeof ChapterPracticeStep> | null,
  connect: vi.fn(), disconnect: vi.fn(), reset: vi.fn(), send: vi.fn(), detect: vi.fn(), resetSequence: vi.fn(),
  t: (key: string) => key,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/i18n/useTranslation", () => ({ useTranslation: () => ({ locale: "en", t: state.t }) }));
vi.mock("./ChapterPracticeStep", () => ({ default: (props: ComponentProps<typeof ChapterPracticeStep>) => { state.step = props; return null; } }));
vi.mock("@/features/shared/chapterPracticeSessionProgress", () => ({ loadChapterPracticeProgress: () => null, saveChapterPracticeProgress: vi.fn(), clearChapterPracticeProgress: vi.fn() }));
vi.mock("../../ml/useWordDetectionLandmarker", () => ({ WORD_DETECTION_SEQUENCE_LENGTH: 30, WORD_DETECTION_TOTAL_FEATURES: 258, useWordDetectionLandmarker: () => ({ detectLandmarks: state.detect, resetSequence: state.resetSequence, isReady: true }) }));
vi.mock("../../ml/useWordRealtimePredictor", () => ({ useWordRealtimePredictor: () => ({ connect: state.connect, disconnect: state.disconnect, resetLivePrediction: state.reset, sendFeatures: state.send, livePrediction: state.prediction, connectionState: "ready" }) }));
import ChapterPracticeView from "./ChapterPracticeView";

afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });

it("keeps stable submitted evidence when hands leave before a chapter response arrives", async () => {
  vi.useFakeTimers();
  const practice = { chapterId: 1, items: [{ wordKh: "hello" }, { wordKh: "other" }] } as WdChapterPractice;
  const rendered = render(<ChapterPracticeView practice={practice} />);
  await act(async () => {});
  act(() => state.step!.onDetection!({ handDetected: true, handLandmarks: [], poseLandmarks: [], sequenceFeatures: null }));
  state.prediction = { label: "hello", confidence: 100, seq: 1, sampledAt: 100 };
  rendered.rerender(<ChapterPracticeView practice={practice} />);
  await act(async () => {
    state.step!.onDetection!({ handDetected: false, handLandmarks: [], poseLandmarks: [], sequenceFeatures: null });
    vi.advanceTimersByTime(100);
  });
  expect(state.step!.continueEnabled).toBe(false);
  state.prediction = { label: "hello", confidence: 100, seq: 2, sampledAt: 500 };
  rendered.rerender(<ChapterPracticeView practice={practice} />);
  await act(async () => {});
  expect(state.step!.continueEnabled).toBe(true);
  expect(state.step!.capturedConfidence).toBe(100);
});
