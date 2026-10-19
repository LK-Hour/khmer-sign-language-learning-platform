/** A time window, rather than six responses, keeps slow inference usable.
 * Still require two independent samples and reject low-confidence flicker. */
export const WORD_HAND_WARMUP_FRAMES = 3;
export const WORD_PREDICTION_MIN_CONFIDENCE = 70;
const STABLE_MS = 300;
const MAX_GAP_MS = 5000;

type Sample = { label: string | null; confidence: number; seq: number; sampledAt?: number };
export class WordPredictionStability {
  private label: string | null = null;
  private firstAt = 0;
  private lastAt = 0;
  private lastSeq = 0;
  private count = 0;

  reset() {
    this.label = null;
    this.count = 0;
    this.lastSeq = 0;
  }

  accept(sample: Sample, now = performance.now()): boolean {
    if (sample.seq === this.lastSeq) return false;
    this.lastSeq = sample.seq;
    if (!sample.label || sample.label === "No Action" || !Number.isFinite(sample.confidence) || sample.confidence < WORD_PREDICTION_MIN_CONFIDENCE) {
      this.label = null;
      this.count = 0;
      return false;
    }
    const at = sample.sampledAt ?? now;
    if (sample.label !== this.label || at - this.lastAt > MAX_GAP_MS || at <= this.lastAt) {
      this.label = sample.label;
      this.firstAt = at;
      this.count = 0;
    }
    this.lastAt = at;
    this.count += 1;
    return this.count >= 2 && at - this.firstAt >= STABLE_MS;
  }
}
