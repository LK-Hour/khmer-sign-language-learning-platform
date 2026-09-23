/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FAIL_SOUND_SRC, SUCCESS_SOUND_SRC, usePracticeSounds } from "./usePracticeSounds";

type FakeAudio = {
  src: string;
  preload: string;
  currentTime: number;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
};

let created: FakeAudio[] = [];

function bySrc(src: string): FakeAudio {
  const audio = created.find((candidate) => candidate.src === src);
  if (!audio) throw new Error(`No Audio created for ${src}`);
  return audio;
}

beforeEach(() => {
  created = [];
  vi.stubGlobal(
    "Audio",
    vi.fn(function (this: FakeAudio, src: string) {
      this.src = src;
      this.preload = "";
      this.currentTime = 5;
      this.play = vi.fn(() => Promise.resolve());
      this.pause = vi.fn();
      created.push(this);
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("usePracticeSounds", () => {
  it("preloads the success and fail sounds from public/assets/mp3", () => {
    renderHook(() => usePracticeSounds());

    expect(created.map((audio) => audio.src).sort()).toEqual(
      [FAIL_SOUND_SRC, SUCCESS_SOUND_SRC].sort()
    );
    expect(SUCCESS_SOUND_SRC).toBe("/assets/mp3/success.mp3");
    // Which file is the fail cue is a choice; it must just be a distinct mp3 from the same folder.
    expect(FAIL_SOUND_SRC).toMatch(/^\/assets\/mp3\/[^/]+\.mp3$/);
    expect(FAIL_SOUND_SRC).not.toBe(SUCCESS_SOUND_SRC);
    expect(created.every((audio) => audio.preload === "auto")).toBe(true);
  });

  it("plays the success sound from the start and only that one", () => {
    const { result } = renderHook(() => usePracticeSounds());

    act(() => result.current.playSuccess());

    expect(bySrc(SUCCESS_SOUND_SRC).play).toHaveBeenCalledTimes(1);
    expect(bySrc(SUCCESS_SOUND_SRC).currentTime).toBe(0);
    expect(bySrc(FAIL_SOUND_SRC).play).not.toHaveBeenCalled();
  });

  it("plays the fail sound and stops a success sound that is still playing", () => {
    const { result } = renderHook(() => usePracticeSounds());

    act(() => result.current.playFail());

    expect(bySrc(FAIL_SOUND_SRC).play).toHaveBeenCalledTimes(1);
    expect(bySrc(SUCCESS_SOUND_SRC).pause).toHaveBeenCalled();
    expect(bySrc(SUCCESS_SOUND_SRC).play).not.toHaveBeenCalled();
  });

  it("swallows a blocked play() instead of throwing", async () => {
    const { result } = renderHook(() => usePracticeSounds());
    bySrc(SUCCESS_SOUND_SRC).play.mockRejectedValue(new DOMException("blocked", "NotAllowedError"));

    expect(() => act(() => result.current.playSuccess())).not.toThrow();
    await Promise.resolve();
  });

  it("stops both sounds when the component unmounts", () => {
    const { unmount } = renderHook(() => usePracticeSounds());
    unmount();

    expect(bySrc(SUCCESS_SOUND_SRC).pause).toHaveBeenCalled();
    expect(bySrc(FAIL_SOUND_SRC).pause).toHaveBeenCalled();
  });
});
