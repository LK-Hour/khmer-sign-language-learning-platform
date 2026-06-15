"use client";

import { useEffect, useState } from "react";

function animateScore(
  setter: (value: number) => void,
  target: number,
  duration = 420
): () => void {
  const startedAt = performance.now();
  let frame = 0;

  function tick(now: number) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    setter(Math.round(target * eased));
    if (progress < 1) frame = requestAnimationFrame(tick);
  }

  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

export function useAnimatedScore(target: number | null) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (target == null) return;
    return animateScore(setDisplayScore, target);
  }, [target]);

  return displayScore;
}
