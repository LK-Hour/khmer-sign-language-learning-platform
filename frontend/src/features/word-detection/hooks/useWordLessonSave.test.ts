// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useWordLessonSave } from "./useWordLessonSave";
import type { WdLessonDetail } from "../types";
const { complete } = vi.hoisted(() => ({ complete: vi.fn() }));
vi.mock("./useWordDetectionPracticeActions", () => ({ useWordDetectionPracticeActions: () => ({ completePractice: complete }) }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const lesson = { id: 1 } as WdLessonDetail;
it("shares the pending auto-save with Continue and marks saved only after success", async () => {
  let finish!: (value: boolean) => void;
  complete.mockImplementation(() => new Promise<boolean>((resolve) => { finish = resolve; }));
  const { result } = renderHook(() => useWordLessonSave(lesson));
  let automatic!: Promise<void>, continued!: Promise<void>;
  act(() => { automatic = result.current.save(93, true); continued = result.current.save(0, false); });
  expect(automatic).toBe(continued);
  expect(result.current.status).toBe("saving");
  expect(complete).toHaveBeenCalledExactlyOnceWith(lesson, 93, true);
  await act(async () => { finish(true); await continued; });
  expect(result.current.status).toBe("saved");
  await act(async () => { await result.current.save(93, true); });
  expect(complete).toHaveBeenCalledTimes(1);
});
it("allows a failed save to retry with the successful prediction", async () => {
  complete.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(true);
  const { result } = renderHook(() => useWordLessonSave(lesson));
  await act(async () => { await expect(result.current.save(93, true)).rejects.toThrow("offline"); });
  expect(result.current.status).toBe("error");
  await act(async () => { await result.current.save(93, true); });
  expect(result.current.status).toBe("saved");
  expect(complete).toHaveBeenLastCalledWith(lesson, 93, true);
});
it("isolates a late save from a different lesson", async () => {
  let finish!: (value: boolean) => void;
  complete.mockImplementationOnce(() => new Promise<boolean>((resolve) => { finish = resolve; })).mockResolvedValue(true);
  const { result, rerender } = renderHook(({ item }) => useWordLessonSave(item), { initialProps: { item: lesson } });
  let old!: Promise<void>;
  act(() => { old = result.current.save(93, true); });
  rerender({ item: { ...lesson, id: 2 } });
  await act(async () => { finish(true); await old; });
  expect(result.current.status).toBe("idle");
  await act(async () => { await result.current.save(85, true); });
  expect(complete).toHaveBeenCalledTimes(2);
});
