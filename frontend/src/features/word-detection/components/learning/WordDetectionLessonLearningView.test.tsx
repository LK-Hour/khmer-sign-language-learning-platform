// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type WordDetectionLessonPracticeStep from "./WordDetectionLessonPracticeStep";
import type { WdLessonDetail, WdChapter, WdUnit } from "../../types";

const state = vi.hoisted(() => ({
  prediction: { label: null as string | null, confidence: 0, seq: 0, sampledAt: 0 },
  complete: vi.fn(), push: vi.fn(), prefetch: vi.fn(),
  connect: vi.fn(), disconnect: vi.fn(), reset: vi.fn(), send: vi.fn(),
  detect: vi.fn(), resetSequence: vi.fn(), stopRecording: vi.fn(),
  record: vi.fn(() => new Promise(() => {})), upload: vi.fn(),
  t: (key: string) => key,
  step: null as ComponentProps<typeof WordDetectionLessonPracticeStep> | null,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push, prefetch: state.prefetch }) }));
vi.mock("@/i18n/useTranslation", () => ({ useTranslation: () => ({ locale: "en", t: state.t }) }));
vi.mock("./WordDetectionLessonPracticeStep", () => ({ default: (props: ComponentProps<typeof WordDetectionLessonPracticeStep>) => { state.step = props; return null; } }));
vi.mock("./WordRecordingPreview", () => ({ default: () => null }));
vi.mock("@/components/custom-dialog/permission-request-dialog", () => ({ default: () => null }));
vi.mock("@/features/word-detection/hooks/useWordDetectionPracticeActions", () => ({ useWordDetectionPracticeActions: () => ({ completePractice: state.complete }) }));
vi.mock("@/features/word-detection/hooks/useWordRecording", () => ({ useWordRecording: () => ({ recordForDuration: state.record, stopRecording: state.stopRecording, isRecording: true }) }));
vi.mock("@/features/word-detection/hooks/useWordContributionUpload", () => ({ useWordContributionUpload: () => ({ isUploading: true, uploadContribution: state.upload }) }));
vi.mock("@/features/word-detection/ml/useWordDetectionLandmarker", () => ({ WORD_DETECTION_SEQUENCE_LENGTH: 30, WORD_DETECTION_TOTAL_FEATURES: 258, useWordDetectionLandmarker: () => ({ detectLandmarks: state.detect, resetSequence: state.resetSequence, isReady: true }) }));
vi.mock("@/features/word-detection/ml/useWordRealtimePredictor", () => ({ useWordRealtimePredictor: () => ({ connect: state.connect, disconnect: state.disconnect, resetLivePrediction: state.reset, sendFeatures: state.send, livePrediction: state.prediction, connectionState: "ready" }) }));
import WordDetectionLessonLearningView from "./WordDetectionLessonLearningView";
const lesson = { id: 1, word: "hello", orderIndex: 2 } as WdLessonDetail;
const props = { lesson, chapter: { orderIndex: 1 } as WdChapter, unit: { orderIndex: 1 } as WdUnit, nextLessonId: 2 };
beforeEach(() => { vi.useFakeTimers(); state.prediction = { label: null, confidence: 0, seq: 0, sampledAt: 0 }; });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });
async function pass() {
  const rendered = render(<WordDetectionLessonLearningView {...props} />);
  await act(async () => {}); // initial attempt reset
  act(() => state.step!.onDetection!({ handDetected: true, handLandmarks: [], poseLandmarks: [], sequenceFeatures: null }));
  state.prediction = { label: "hello", confidence: 93, seq: 1, sampledAt: 100 };
  rendered.rerender(<WordDetectionLessonLearningView {...props} />);
  state.prediction = { label: "hello", confidence: 93, seq: 2, sampledAt: 500 };
  rendered.rerender(<WordDetectionLessonLearningView {...props} />);
  await act(async () => {});
  return rendered;
}
it("Continue waits for the auto-save, while recording/upload states do not block it", async () => {
  let finish!: (ok: boolean) => void;
  state.complete.mockImplementation(() => new Promise<boolean>((resolve) => { finish = resolve; }));
  await pass();
  expect(state.step!.continueEnabled).toBe(true);
  expect(state.step!.isContinuing).toBe(false);
  let continued!: void | Promise<void>;
  act(() => { continued = state.step!.onContinue(); });
  expect(state.step!.isContinuing).toBe(true);
  expect(state.push).not.toHaveBeenCalled();
  expect(state.complete).toHaveBeenCalledExactlyOnceWith(lesson, 93, true);
  await act(async () => { finish(true); await continued; });
  expect(state.push).toHaveBeenCalledWith("/en/words/lessons/2");
});
it("a failed auto-save stays on the lesson and Continue retries the successful score", async () => {
  state.complete.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(true);
  await pass();
  expect(state.step!.recError).toBe("WORD_DETECTION.LESSON.PROGRESS_SYNC_FAILED");
  expect(state.push).not.toHaveBeenCalled();
  await act(async () => { await state.step!.onContinue(); });
  expect(state.complete).toHaveBeenLastCalledWith(lesson, 93, true);
  expect(state.push).toHaveBeenCalledOnce();
});

it.each(["before first response", "between responses"])("saves valid delayed predictions when hands leave %s", async (when) => {
  state.complete.mockResolvedValue(true);
  const rendered = render(<WordDetectionLessonLearningView {...props} />);
  await act(async () => {});
  const detection = { handDetected: true, handLandmarks: [], poseLandmarks: [], sequenceFeatures: null };
  await act(async () => {
    state.step!.onRawStreamReady!({ active: true } as MediaStream);
    state.step!.onDetection!(detection);
    vi.advanceTimersByTime(300);
  });
  expect(state.record).toHaveBeenCalled(); // Recording is still pending.
  const lowerHands = async () => {
    await act(async () => {
      state.step!.onDetection!({ ...detection, handDetected: false });
      vi.advanceTimersByTime(100); // Previously reset accumulated prediction evidence.
    });
  };
  if (when === "before first response") await lowerHands();
  state.prediction = { label: "hello", confidence: 100, seq: 1, sampledAt: 100 };
  rendered.rerender(<WordDetectionLessonLearningView {...props} />);
  await act(async () => {});
  expect(state.complete).not.toHaveBeenCalled(); // One confident frame is insufficient.
  if (when === "between responses") await lowerHands();
  state.prediction = { label: "hello", confidence: 100, seq: 2, sampledAt: 500 };
  rendered.rerender(<WordDetectionLessonLearningView {...props} />);
  await act(async () => {});
  expect(state.step!.continueEnabled).toBe(true);
  expect(state.complete).toHaveBeenCalledExactlyOnceWith(lesson, 100, true);
  expect(state.step!.progressSaveStatus).toBe("saved");
});

it("does not save an isolated 100% prediction followed by conflicting evidence", async () => {
  state.complete.mockResolvedValue(true);
  const rendered = render(<WordDetectionLessonLearningView {...props} />);
  await act(async () => {});
  state.prediction = { label: "hello", confidence: 100, seq: 1, sampledAt: 100 };
  rendered.rerender(<WordDetectionLessonLearningView {...props} />);
  state.prediction = { label: "other", confidence: 100, seq: 2, sampledAt: 500 };
  rendered.rerender(<WordDetectionLessonLearningView {...props} />);
  await act(async () => {});
  expect(state.step!.continueEnabled).toBe(false);
  expect(state.complete).not.toHaveBeenCalled();
});
