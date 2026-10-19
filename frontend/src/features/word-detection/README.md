# Word prediction pipeline

The browser captures pose/hands at up to 30 fps and maintains the model's
30-frame, 258-value raw landmark format. Sequence resampling is lazy: overlays
do not build prediction payloads. A 100 ms sampling loop sends only when the
WebSocket is authenticated and has no outstanding request. Busy samples are
dropped; the next send reads the latest camera detection. No request queue is
kept in the browser.

Requests and responses carry `requestId` and `attemptId`. Resetting an attempt
invalidates its response without opening another slot until that response has
been drained. A 10-second timeout replaces the socket; callbacks from replaced
sockets are ignored. Deploy the backend protocol and `/lessons/{id}/learning`
endpoint before updating the frontend.

## Timing and accuracy

- Hand warmup: three 100 ms samples (previously ten).
- Captured result: at least two distinct responses spanning 300 ms, with the
  same label and confidence >= 70%. A changed label, No Action, low confidence,
  missing hand or long sample gap resets stability.
- Live predictions appear before the captured result; a captured match enables
  Continue. Wrong confident results retain the existing retry behavior.
- These thresholds need camera validation on representative Khmer signs and
  slower devices; automated tests cannot establish recognition accuracy.

Browser Performance entries retain the latest sample for each stage:
`word-detection.landmarks`, `word-detection.prediction-round-trip`, and
`word-detection.progress-save`. The predictor hook also exposes `roundTripMs`
and server `processingMs` in `livePrediction`. Backend DEBUG logging for
`src.ml.word_predictor` separates feature construction from model inference.
The first inference includes lazy model initialization in `processingMs`.

Compare these timings on a warm session and a cold session before moving
MediaPipe into a worker or changing the model/backend runtime. No camera or
production latency benchmark is implied by the regression tests.

## Progress and recordings

Automatic completion and Continue share one save promise. A lesson is saved
only after successful confirmation; failure stays visible and Continue retries
with the successful confidence. Navigation prefetch begins after confirmation.
The learning endpoint returns lesson, chapter, unit and next lesson ID together,
without fetching every sibling's media/progress.

Recording and contribution upload do not disable Continue. Recordings own
cloned camera tracks, so an already agreed, successful contribution can finish
its four seconds after client-side navigation. Tracks are stopped when finished.
Without prior agreement, leaving cancels/discards the recording; preview and
explicit approval remain on the current lesson. This background work lasts only
within the open browser tab; closing/reloading the tab does not guarantee upload.
A retry cancels its old recording and starts a separate session.

## Verification

From `frontend`: `npm test -- src/features/word-detection`.
From `backend`: `venv/bin/python -m pytest tests/test_word_prediction_pipeline.py tests/test_word_features.py tests/test_label_match_filter.py -q`.

Manual checks: hold a correct sign, try an incorrect sign, remove the hand,
retry during a pending prediction, throttle the network, fail a progress save,
and Continue during an agreed recording. Check that the result stays fresh,
failed saving never navigates, and no donation changes the next lesson's state.
