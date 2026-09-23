/**
 * Decides when a learner "failed" a character: the model sees a real sign,
 * but not the one being asked for, and they keep holding it.
 *
 * Kept free of React/timers (the caller passes `now`) so the rules — hold
 * length, cooldown, grace period — are easy to test and tune in one place.
 */

export type MismatchInput = {
  label: string | null;
  /** 0–100. */
  confidence: number;
  labelMatches: boolean | null;
  /**
   * Whether a hand was actually in frame. With no hand the panel still sends an
   * all-zero vector and the model still answers with *some* letter (measured:
   * "ឫ" at ~69%), so a prediction is only meaningful when this is true.
   */
  handDetected: boolean;
};

export type MismatchDetectorConfig = {
  /** Consecutive wrong predictions needed before a fail is reported. */
  holdFrames: number;
  /** Ignore wrong predictions below this confidence — usually a hand mid-transition. */
  minConfidence: number;
  /** Minimum gap between two fails, so a held wrong sign can't spam the sound. */
  cooldownMs: number;
  /** Quiet period after the target changes, while the learner lets go of the previous sign. */
  graceMs: number;
};

// Pseudo-labels in the model's class space (see `tokenizeSentence.ts`): they mean
// "no letter being signed", never a wrong letter.
const NON_SIGN_LABELS = new Set(["no action", "none", "question"]);

function isRealSign(label: string | null): boolean {
  const normalized = label?.trim().replace(/_/g, " ").toLowerCase();
  return !!normalized && !NON_SIGN_LABELS.has(normalized);
}

/** A real, sufficiently confident sign — from a visible hand — that isn't the requested one. */
export function isWrongSign(input: MismatchInput, minConfidence: number): boolean {
  return (
    input.handDetected &&
    input.labelMatches === false &&
    isRealSign(input.label) &&
    input.confidence >= minConfidence
  );
}

export function createMismatchDetector(config: MismatchDetectorConfig) {
  let wrongStreak = 0;
  let quietUntil = 0;

  return {
    /** Call whenever the target character changes (and on mount). */
    reset(now: number) {
      wrongStreak = 0;
      quietUntil = now + config.graceMs;
    },

    /** Feed one live prediction; returns `true` when a fail should be signalled. */
    update(input: MismatchInput, now: number): boolean {
      if (!isWrongSign(input, config.minConfidence)) {
        wrongStreak = 0;
        return false;
      }

      wrongStreak += 1;
      if (wrongStreak < config.holdFrames || now < quietUntil) return false;

      wrongStreak = 0;
      quietUntil = now + config.cooldownMs;
      return true;
    },
  };
}
