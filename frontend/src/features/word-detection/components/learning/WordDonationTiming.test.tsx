// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type WordDetectionLessonPracticeStep from "./WordDetectionLessonPracticeStep";
import type WordRecordingPreview from "./WordRecordingPreview";
import type { WdLessonDetail, WdChapter, WdUnit } from "../../types";

const state = vi.hoisted(() => ({
  prediction: { label: null as string | null, confidence: 0, seq: 0, sampledAt: 0 },
  agreed: true,
  complete: vi.fn(), upload: vi.fn(), backgroundUpload: vi.fn(),
  connect: vi.fn(), disconnect: vi.fn(), reset: vi.fn(), send: vi.fn(),
  detect: vi.fn(), resetSequence: vi.fn(), push: vi.fn(), prefetch: vi.fn(),
  t: (key: string) => key,
  step: null as ComponentProps<typeof WordDetectionLessonPracticeStep> | null,
  preview: null as ComponentProps<typeof WordRecordingPreview> | null,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: state.push, prefetch: state.prefetch }) }));
vi.mock("@/i18n/useTranslation", () => ({ useTranslation: () => ({ locale: "en", t: state.t }) }));
vi.mock("./WordDetectionLessonPracticeStep", () => ({ default: (props: ComponentProps<typeof WordDetectionLessonPracticeStep>) => { state.step = props; return null; } }));
vi.mock("./WordRecordingPreview", () => ({ default: (props: ComponentProps<typeof WordRecordingPreview>) => { state.preview = props; return null; } }));
vi.mock("@/components/custom-dialog/permission-request-dialog", () => ({ default: () => null }));
vi.mock("@/store/permission.store", () => ({ usePermissionStore: { getState: () => ({ hasAgreed: state.agreed }) } }));
vi.mock("@/features/word-detection/hooks/useWordDetectionPracticeActions", () => ({ useWordDetectionPracticeActions: () => ({ completePractice: state.complete }) }));
vi.mock("@/features/word-detection/hooks/useWordContributionUpload", () => ({ useWordContributionUpload: () => ({ isUploading: false, uploadContribution: state.upload }) }));
vi.mock("@/features/word-detection/api/practiceRecordings", () => ({ submitWdRecording: state.backgroundUpload }));
vi.mock("@/features/word-detection/ml/useWordDetectionLandmarker", () => ({ WORD_DETECTION_SEQUENCE_LENGTH: 30, WORD_DETECTION_TOTAL_FEATURES: 258, useWordDetectionLandmarker: () => ({ detectLandmarks: state.detect, resetSequence: state.resetSequence, isReady: true }) }));
vi.mock("@/features/word-detection/ml/useWordRealtimePredictor", () => ({ useWordRealtimePredictor: () => ({ connect: state.connect, disconnect: state.disconnect, resetLivePrediction: state.reset, sendFeatures: state.send, livePrediction: state.prediction, connectionState: "ready" }) }));

// Use the real recording hook and its real four-second timer; substitute only
// browser media primitives, so no webcam permission or external upload is used.
class Track {
  stop = vi.fn();
  clone = vi.fn(() => new Track());
}
class Stream {
  active = true;
  constructor(private tracks = [new Track()]) {}
  getVideoTracks() { return this.tracks; }
  getTracks() { return this.tracks; }
}
class Recorder {
  static instances: Recorder[] = [];
  static isTypeSupported = () => true;
  state = "inactive";
  mimeType = "video/webm";
  startedAt = 0;
  stoppedAt: number | null = null;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: Stream) { Recorder.instances.push(this); }
  start() { this.startedAt = performance.now(); this.state = "recording"; }
  stop() {
    this.stoppedAt = performance.now();
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["test video"], { type: this.mimeType }) });
    this.onstop?.();
  }
}
import WordDetectionLessonLearningView from "./WordDetectionLessonLearningView";
const lesson = { id: 1, word: "hello", orderIndex: 2 } as WdLessonDetail;
const props = { lesson, chapter: { orderIndex: 1 } as WdChapter, unit: { orderIndex: 1 } as WdUnit, nextLessonId: 2 };
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  Recorder.instances = [];
  state.prediction = { label: null, confidence: 0, seq: 0, sampledAt: 0 };
  state.agreed = true;
  state.complete.mockResolvedValue(true);
  state.upload.mockResolvedValue(undefined);
  state.backgroundUpload.mockResolvedValue(undefined);
  vi.stubGlobal("MediaStream", Stream);
  vi.stubGlobal("MediaRecorder", Recorder);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

async function start() {
  const view = render(<WordDetectionLessonLearningView {...props} />);
  await act(async () => {});
  const source = new Stream();
  await act(async () => {
    state.step!.onRawStreamReady!(source as unknown as MediaStream);
    state.step!.onDetection!({ handDetected: true, handLandmarks: [], poseLandmarks: [], sequenceFeatures: null });
    vi.advanceTimersByTime(100);
  });
  expect(Recorder.instances).toHaveLength(1);
  return { view, source, recorder: Recorder.instances[0] };
}
async function predict(view: ReturnType<typeof render>) {
  state.prediction = { label: "hello", confidence: 100, seq: 1, sampledAt: 100 };
  view.rerender(<WordDetectionLessonLearningView {...props} />);
  state.prediction = { label: "hello", confidence: 100, seq: 2, sampledAt: 500 };
  view.rerender(<WordDetectionLessonLearningView {...props} />);
  await act(async () => {});
}
async function advance(ms: number) { await act(async () => { vi.advanceTimersByTime(ms); }); }

it("records for 4000 ms and uploads only after recording ends when prediction arrives first", async () => {
  const { view, recorder, source } = await start();
  await advance(900);
  await predict(view);
  expect(state.complete).toHaveBeenCalledExactlyOnceWith(lesson, 100, true);
  await advance(3099);
  expect(recorder.state).toBe("recording");
  expect(state.upload).not.toHaveBeenCalled();
  await advance(1);
  expect(recorder.stoppedAt! - recorder.startedAt).toBe(4000);
  expect(state.upload).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ lessonId: 1, word: "hello", confidence: 100, video: expect.any(Blob) }));
  expect(source.getVideoTracks()[0].stop).not.toHaveBeenCalled();
});

it("reproduces the missing donation when prediction arrives after the four-second recording", async () => {
  const { view, recorder } = await start();
  await advance(4000);
  expect(recorder.stoppedAt! - recorder.startedAt).toBe(4000);
  await predict(view);
  await advance(1000);
  expect(state.step!.progressSaveStatus).toBe("saved");
  // Characterization of the existing defect: a completed clip is discarded
  // before the prediction arrives and is never offered/uploaded afterward.
  expect(state.upload).not.toHaveBeenCalled();
  expect(state.backgroundUpload).not.toHaveBeenCalled();
  expect(state.preview!.open).toBe(false);
});

it("finishes the full agreed recording after Continue and uploads in the background", async () => {
  const { view, recorder, source } = await start();
  await advance(900);
  await predict(view);
  await act(async () => { await state.step!.onContinue(); });
  view.unmount();
  expect(recorder.state).toBe("recording");
  // The camera panel would stop the source; the recording owns cloned tracks.
  source.getTracks().forEach((track) => track.stop());
  await advance(3100);
  expect(recorder.stoppedAt! - recorder.startedAt).toBe(4000);
  expect(state.backgroundUpload).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ lessonId: 1, confidence: 100 }));
  expect(recorder.stream.getTracks()[0].stop).toHaveBeenCalledOnce();
});

it("offers a completed qualifying clip for review without auto-uploading when not agreed", async () => {
  state.agreed = false;
  const { view } = await start();
  await advance(900);
  await predict(view);
  await advance(3100);
  expect(state.preview!.open).toBe(true);
  expect(state.preview!.videoBlob!.size).toBeGreaterThan(0);
  expect(state.upload).not.toHaveBeenCalled();
});

it("cancels recording on early navigation without existing donation agreement", async () => {
  state.agreed = false;
  const { view, recorder } = await start();
  await advance(900);
  await predict(view);
  view.unmount();
  expect(recorder.state).toBe("inactive");
  expect(recorder.stoppedAt! - recorder.startedAt).toBe(900);
  await advance(4000);
  expect(state.upload).not.toHaveBeenCalled();
  expect(state.backgroundUpload).not.toHaveBeenCalled();
});
