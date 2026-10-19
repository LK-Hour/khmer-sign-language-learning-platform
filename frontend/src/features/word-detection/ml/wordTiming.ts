/** Keep only the latest sample per stage; avoid growing the performance buffer
 * indefinitely during a long practice session. Visible in browser Performance. */
export function recordWordTiming(stage: string, started: number) {
  const name = `word-detection.${stage}`;
  performance.clearMeasures(name);
  performance.measure(name, { start: started, end: performance.now() });
}
