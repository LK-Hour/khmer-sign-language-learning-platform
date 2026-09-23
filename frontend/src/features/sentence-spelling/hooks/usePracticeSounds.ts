"use client";

import { useCallback, useEffect, useRef } from "react";

// Served from `frontend/public/assets/mp3`.
export const SUCCESS_SOUND_SRC = "/assets/mp3/success.mp3";
export const FAIL_SOUND_SRC = "/assets/mp3/prank.mp3";

function createAudio(src: string): HTMLAudioElement {
  const audio = new Audio(src);
  audio.preload = "auto";
  return audio;
}

/**
 * Success / fail cues for practice. Playback is best-effort: a browser can
 * refuse `play()` (autoplay policy before the first interaction), and a
 * missing sound must never get in the way of practicing.
 */
export function usePracticeSounds() {
  const successRef = useRef<HTMLAudioElement | null>(null);
  const failRef = useRef<HTMLAudioElement | null>(null);

  // Created after mount because `Audio` doesn't exist during server rendering.
  useEffect(() => {
    const success = createAudio(SUCCESS_SOUND_SRC);
    const fail = createAudio(FAIL_SOUND_SRC);
    successRef.current = success;
    failRef.current = fail;
    return () => {
      success.pause();
      fail.pause();
      successRef.current = null;
      failRef.current = null;
    };
  }, []);

  const play = useCallback((audio: HTMLAudioElement | null, other: HTMLAudioElement | null) => {
    if (!audio) return;
    // Never let the two cues overlap; the newest one wins.
    other?.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Blocked or failed to load — silently skip the sound.
    });
  }, []);

  const playSuccess = useCallback(
    () => play(successRef.current, failRef.current),
    [play]
  );
  const playFail = useCallback(() => play(failRef.current, successRef.current), [play]);

  return { playSuccess, playFail };
}
