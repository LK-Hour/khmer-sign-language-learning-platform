/**
 * Raw-landmark frames and 30 fps resampling for the word-detection BiLSTM.
 *
 * Keypoints match the live test (`live_testing_script.ipynb`, `extract_features`):
 * MediaPipe pose + hand landmarkers on the mirrored frame (Holistic's parts
 * the model uses, without the face mesh),
 * pose 33 x (x, y, z, visibility) and left/right hand 21 x (x, y, z) --
 * 258 values per frame, zeros when missing.
 * The live test's hip-centering / wrist-relative step, normalization and the
 * 686 engineered features all run on the backend (`backend/src/ml/word_features.py`).
 *
 * The model was trained on 30 fps clips, 30 consecutive frames per sample, and
 * its velocity/acceleration features depend on frame spacing. Browser detection
 * runs at whatever rate the device manages, so frames are timestamped and
 * resampled onto a fixed 1/30 s grid before being sent.
 */

export const WORD_SEQUENCE_LENGTH = 30;
export const WORD_RAW_FRAME_FEATURES = 33 * 4 + 21 * 3 * 2;
export const WORD_FRAME_INTERVAL_MS = 1000 / 30;
/** Neighbouring detections further apart than this are not interpolated. */
const MAX_INTERPOLATION_GAP_MS = 150;
/** Keep a little more than one window of history. */
const HISTORY_MS = 2000;

type Landmark = { x: number; y: number; z: number; visibility?: number };

export type TimedFrame = { time: number; values: Float32Array };

export function buildRawFrame(
  pose: Landmark[] | undefined,
  leftHand: Landmark[] | undefined,
  rightHand: Landmark[] | undefined,
): Float32Array {
  const frame = new Float32Array(WORD_RAW_FRAME_FEATURES);
  pose?.slice(0, 33).forEach((p, i) => {
    frame.set([p.x, p.y, p.z, p.visibility ?? 0], i * 4);
  });
  leftHand?.slice(0, 21).forEach((p, i) => frame.set([p.x, p.y, p.z], 132 + i * 3));
  rightHand?.slice(0, 21).forEach((p, i) => frame.set([p.x, p.y, p.z], 195 + i * 3));
  return frame;
}

export function pruneHistory(frames: TimedFrame[], now: number): TimedFrame[] {
  const cutoff = now - HISTORY_MS;
  const firstKept = frames.findIndex((f) => f.time >= cutoff);
  return firstKept <= 0 ? frames : frames.slice(firstKept);
}

function sampleAt(frames: TimedFrame[], time: number): Float32Array {
  if (time <= frames[0].time) return frames[0].values;
  const last = frames[frames.length - 1];
  if (time >= last.time) return last.values;

  let upper = 1;
  while (frames[upper].time < time) upper += 1;
  const before = frames[upper - 1];
  const after = frames[upper];
  if (after.time - before.time > MAX_INTERPOLATION_GAP_MS) {
    return time - before.time <= after.time - time ? before.values : after.values;
  }

  const weight = (time - before.time) / (after.time - before.time);
  const out = new Float32Array(WORD_RAW_FRAME_FEATURES);
  for (let i = 0; i < out.length; i += 1) {
    const a = before.values[i];
    const b = after.values[i];
    // Never blend a detected landmark with a missing (zero) one.
    out[i] = a === 0 || b === 0 ? (weight < 0.5 ? a : b) : a + (b - a) * weight;
  }
  return out;
}

/**
 * Flattened (30, 258) sequence ending at the newest frame, on a 30 fps grid,
 * or null before any frame has been recorded. Starts earlier than the first
 * frame are padded with that first frame.
 */
export function resampleSequence(frames: TimedFrame[]): Float32Array | null {
  if (frames.length === 0) return null;
  const end = frames[frames.length - 1].time;
  const out = new Float32Array(WORD_SEQUENCE_LENGTH * WORD_RAW_FRAME_FEATURES);
  for (let k = 0; k < WORD_SEQUENCE_LENGTH; k += 1) {
    const time = end - (WORD_SEQUENCE_LENGTH - 1 - k) * WORD_FRAME_INTERVAL_MS;
    out.set(sampleAt(frames, time), k * WORD_RAW_FRAME_FEATURES);
  }
  return out;
}
