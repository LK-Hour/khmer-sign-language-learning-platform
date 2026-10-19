// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useWordRecording } from "./useWordRecording";
const stopClone = vi.fn();
const clone = vi.fn(() => ({ stop: stopClone }));
const original = { clone, stop: vi.fn() };
class Stream {
  active = true;
  constructor(private tracks = [original]) {}
  getVideoTracks() { return this.tracks; }
  getTracks() { return this.tracks; }
}
class Recorder {
  static isTypeSupported = () => true;
  state = "inactive";
  mimeType = "video/webm";
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(public stream: Stream) {}
  start() { this.state = "recording"; }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob(["video"]) });
    this.onstop?.();
  }
}
beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal("MediaStream", Stream); vi.stubGlobal("MediaRecorder", Recorder); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
it("finishes a full recording after unmount using owned tracks, then releases them", async () => {
  const { result, unmount } = renderHook(() => useWordRecording());
  let recording!: ReturnType<typeof result.current.recordForDuration>;
  act(() => { recording = result.current.recordForDuration(new Stream() as unknown as MediaStream, 4000); });
  expect(clone).toHaveBeenCalledOnce();
  unmount();
  await act(async () => { vi.advanceTimersByTime(4000); await recording; });
  expect((await recording).blob.size).toBeGreaterThan(0);
  expect(stopClone).toHaveBeenCalledOnce();
  expect(original.stop).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
it("releases cloned tracks and the timer when an attempt is canceled", async () => {
  const { result } = renderHook(() => useWordRecording());
  let recording!: ReturnType<typeof result.current.recordForDuration>;
  act(() => { recording = result.current.recordForDuration(new Stream() as unknown as MediaStream, 4000); });
  await act(async () => { result.current.stopRecording(); await recording; });
  expect(stopClone).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});
