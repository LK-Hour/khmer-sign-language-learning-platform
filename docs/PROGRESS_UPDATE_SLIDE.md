# Khmer Sign Language Platform - Progress Update

**Prepared for:** project progress presentation
**Date:** 2026-07-01
**Codebase reviewed:** `/home/hour/Documents/CADT/Internship/khmer-sign-language-platform`

> All figures below were re-verified directly against the repository on the review date
> (lint, typecheck, backend test collection, model files, and dataset counts).

---

## Slide 1 - Project Status Summary

The Khmer Sign Language Platform has a strong foundation for two learning tracks:

- **Finger Spelling:** letter-level Khmer sign recognition and learning.
- **Word Detection:** word-level sign recognition and learning.

This is no longer a prototype. The repository currently includes:

- Next.js frontend learning pages.
- FastAPI backend APIs.
- PostgreSQL database models and migrations.
- Curriculum, lesson, exercise, and progress structures.
- MediaPipe keypoint extraction on the frontend.
- ML prediction endpoints on the backend.
- WebSocket prediction paths for real-time feedback.
- Early admin quiz management UI and backend admin APIs.

---

## Slide 2 - Estimated Completion

These percentages reflect engineering readiness (feature completeness, integration,
validation, and production readiness), based on code actually in the repository.

| Module | Estimated Completion | Status |
|---|---:|---|
| Finger Spelling | **82%** | Mostly implemented; needs quiz/admin polish, broader tests, and model-quality validation |
| Word Detection | **68%** | Core architecture and model assets in place; integration is newer and has open frontend build/lint issues |
| Quiz System | **35%** | Backend exercise structure exists; frontend admin quiz UI is mock/local-state based |
| Admin Dashboard / Panel | **40%** | Admin APIs exist; frontend admin area is partial and quiz-focused |

> Word Detection was revised up from earlier estimates because the trained model file is
> now present at the configured path (previously reported missing).

---

## Slide 3 - Finger Spelling Progress

**Estimated completion: 82%**

Finger Spelling is the most mature learning track in the codebase.

### Completed

- Curriculum hierarchy: units, chapters, lessons, letters, letter media.
- Backend models and database migration.
- Backend learner APIs for:
  - curriculum browsing
  - exercises
  - lesson progress
  - practice attempts
  - hand prediction status
  - hand prediction from keypoint features
  - WebSocket prediction
- Frontend pages: `/finger-spelling` and `/finger-spelling/lessons/[lessonId]`.
- Frontend learning UI: track page, lesson learning view, practice step, webcam panel,
  prediction feedback panel, lesson feedback widget.
- MediaPipe hand keypoint extraction in the frontend.
- Backend prediction via NumPy forward pass over local `.h5` weights (no TensorFlow at
  inference time) plus a label encoder.
- Guest and authenticated prediction flows.
- Local guest progress store.

### Evidence From Codebase

- Frontend feature folder: `frontend/src/features/finger-spelling/`
- Backend routes: `backend/src/api/routes/finger_spelling/`
- Backend services: `backend/src/services/finger_spelling/`
- Backend repositories: `backend/src/repositories/finger_spelling/`
- ML model files: `backend/ml/models/*.h5` (default: `mlp_khmer_model_v3.h5`)
- Label encoder: `backend/ml/models/khmer_label_encoder.pkl`
- MediaPipe asset: `frontend/public/models/hand_landmarker.task`
- Predictor input dimension: **126** hand keypoint values (`KhmerHandPredictor.INPUT_DIM`)

### Remaining Work

- Complete the user-facing quiz flow for lessons/chapters.
- Connect the admin quiz/content management UI to real backend APIs.
- Improve automated test coverage for prediction and lesson completion.
- Calibrate model confidence threshold for real classroom use.
- Improve handling for bad lighting, hand position, camera angle, and no-hand cases.
- Add a learner dashboard/statistics view for long-term progress.

---

## Slide 4 - Word Detection Progress

**Estimated completion: 68%**

Word Detection has strong structure and now has its trained model in place, but it is
still in active integration and has open frontend issues.

### Completed

- Word Detection data model: units, chapters, lessons, words, word media, exercises,
  progress, contributions.
- Backend migration for word detection tables.
- Backend learner APIs for:
  - curriculum browsing
  - exercises
  - lesson progress
  - practice attempt submission
  - word prediction status
  - word prediction from features
  - WebSocket prediction
- Frontend pages: `/words` and `/words/lessons/[lessonId]`.
- Frontend learning UI: word detection track, lesson learning view, practice step,
  camera panel, word card video player.
- Frontend real-time word predictor hook.
- Word dataset: **100 word folders** and **300 video files** (verified).
- Trained sequence model present at the configured path (verified):
  `data_set/word_detection_model_assets/best_model_25class_fix.h5` (~1.3 MB).
- Label map: `data_set/word_detection_model_assets/label_map_25class.json`.

### Evidence From Codebase

- Frontend feature folder: `frontend/src/features/word-detection/`
- Backend routes: `backend/src/api/routes/word_detection/`
- Backend services: `backend/src/services/word_detection/`
- Backend repositories: `backend/src/repositories/word_detection/`
- Dataset: `data_set/word_detection/`
- Sequence model inference: `backend/src/ml/word_predictor.py`
- Configured model path: `backend/src/core/config.py` (`_DEFAULT_WORD_ML_MODEL`)

### Current Issues (verified)

- **Frontend typecheck fails:** `mockCurriculum.ts` builds `WdLesson` objects without the
  required `videoUrl` field (`error TS2741`).
- **Frontend lint fails:** `WordDetectionWordCard.tsx` calls `setHasStarted(false)`
  synchronously inside a `useEffect`, flagged by `react-hooks/set-state-in-effect`.
- Word detection has **12 uncommitted modified files** across backend and frontend, so the
  module is still in integration mode.

### Remaining Work

- Fix the frontend typecheck (`mockCurriculum.ts` missing `videoUrl`).
- Fix the frontend lint error (`WordDetectionWordCard.tsx` set-state-in-effect).
- Verify 30-frame sequence buffering from MediaPipe to backend model input.
- Confirm the keypoint feature shape end to end:
  - **30 frames**
  - **252 features per frame**
  - **7,560 total features** (matches `word_predictor.py` constants)
- Validate model predictions against real videos from the dataset.
- Base lesson completion on sustained confidence, not a single-frame prediction.
- Add the user-facing quiz flow for word lessons.
- Connect the admin panel to create/edit word curriculum and exercises.

---

## Slide 5 - Current Technical Architecture

### Frontend

- Framework: Next.js 16, React 19, TypeScript.
- UI: MUI, Emotion, Tailwind, custom theme tokens.
- State: Zustand.
- Camera/keypoints: MediaPipe Tasks Vision.
- Real-time prediction: WebSocket hooks.
- Feature folders: `finger-spelling`, `word-detection`, `dictionary`, `admin/quiz`.

### Backend

- Framework: FastAPI (0.104.1 in the project venv).
- Database: PostgreSQL with SQLAlchemy and Alembic.
- Architecture: API routes, schemas, services, repositories, models.
- Prediction:
  - Finger spelling: NumPy forward pass over H5 weights (input dim 126).
  - Word detection: Keras sequence model, input shape 30 x 252.
- Auth: student/admin account types, guest support, JWT/session support.

---

## Slide 6 - Validation Results

Commands run during this codebase review:

| Check | Result | Notes |
|---|---|---|
| `frontend npm run lint` | **Fail** | 1 error in word detection, 2 warnings in finger spelling |
| `frontend npm run typecheck` | **Fail** | `mockCurriculum.ts` missing required `videoUrl` |
| `backend pytest --collect-only` | **Pass** | 86 tests collected in the project venv |
| `backend pytest tests/test_user_api.py` | **Pass** | 17/17 passed |
| `backend pytest` (full suite) | **Hangs** | Full run does not complete in-shell, likely model load at app startup; needs investigation |

### Frontend Lint Failure

File:

```text
frontend/src/features/word-detection/components/learning/WordDetectionWordCard.tsx
```

Issue:

```text
setHasStarted(false) is called synchronously inside useEffect on videoUrl change
(react-hooks/set-state-in-effect).
```

### Frontend Typecheck Failure

File:

```text
frontend/src/features/word-detection/data/mockCurriculum.ts
```

Issue:

```text
WdLesson requires videoUrl, but mock lessons do not include it (TS2741).
```

### Backend Test Status

The backend environment is set up (`backend/venv` has FastAPI installed) and tests
collect and pass individually. The full suite run did not complete in the review shell,
most likely because the app loads ML models at startup. This needs a follow-up to make
the full suite run cleanly (for example, mocking model load in tests).

---

## Slide 7 - Key Challenges Faced

### 1. Integrating ML Models With Browser Keypoints

The platform connects frontend camera data to backend model inference.

- MediaPipe detects hand landmarks in the browser.
- The backend models expect a strict feature vector shape.
- Finger spelling expects **126** hand keypoint values.
- Word detection expects **7,560** sequence values (30 frames x 252 features).
- A small mismatch in ordering, handedness, frame count, or normalization can break
  prediction accuracy.

### 2. Real-Time Prediction Is Harder Than Single Prediction

Real-time feedback adds:

- WebSocket connection management.
- Authentication over WebSocket.
- Guest user handling.
- Reconnect behavior.
- Avoiding stale predictions.
- Stabilizing confidence across multiple frames.
- Avoiding false positives from "No Action".

### 3. Dataset and Media Consistency

Word detection has 100 word folders and 300 videos, and the app needs a reliable mapping:

```text
word -> lesson -> media -> model label -> prediction result
```

If those IDs or labels drift, the UI can show one word while the model predicts another.

### 4. Frontend Type Safety During Rapid Integration

Word detection currently has type/lint errors because the frontend types became stricter
than the mock data. This is TypeScript catching issues early, but it means word detection
should not be presented as fully complete yet.

### 5. Admin Panel Is Not Fully Connected

There is an admin quiz page and backend admin routes, but the frontend admin quiz manager
currently uses mock/local data. The project needs a real admin dashboard connected to
backend APIs.

### 6. Test Environment Stability

Individual backend tests pass, but the full suite hangs in-shell (likely model load at
startup). A stable, fast full-suite run is needed for demo and CI confidence.

---

## Slide 8 - Future Work: Quiz System

The quiz system should become a full learning assessment flow, not only backend exercises.

### Planned Quiz Features

- Lesson quiz after learning content.
- Chapter quiz after completing all lessons.
- Question types: multiple choice text, image/video choice, free text answer,
  sign recognition challenge.
- Quiz score summary.
- Retry flow.
- Completion celebration.
- Save quiz result to progress.
- Unlock next lesson/chapter after passing.

### Needed Engineering Work

- Build learner-facing quiz pages.
- Connect quiz UI to existing exercise APIs.
- Add a quiz state machine: current question, selected answer, score, attempts,
  feedback state.
- Persist quiz results to backend.
- Add quiz unlock rules.
- Add tests for exercise grading and completion logic.

---

## Slide 9 - Future Work: Admin Dashboard / Panel

The platform needs a complete admin panel for managing curriculum and quiz content.

### Current Admin Status

Already exists:

- Admin login guard.
- Admin quiz page route: `frontend/src/app/[locale]/admin/quiz/page.tsx`
- Admin quiz manager UI: `frontend/src/features/admin/quiz/AdminQuizManager.tsx`
- Backend admin APIs for exercises:
  - `/api/admin/{track}/exercises`
  - `/api/admin/{track}/exercises/{id}`
  - `/api/admin/{track}/exercises/{id}/options`
- Backend admin curriculum APIs under finger spelling and word detection routes.

Main gap:

- The frontend admin quiz manager is still mock/local-state based (uses `INITIAL_QUESTIONS`
  and `MOCK_CONTEXT`).
- There is no full admin dashboard shell for curriculum, users, analytics, and model review.

### Proposed Admin Dashboard Features

- Overview: total users, active learners, completed lessons, model feedback count.
- Curriculum manager: units, chapters, lessons, ordering, lock/unlock rules.
- Quiz/exercise manager: create questions, edit options, attach media, preview quiz.
- Media manager: upload sign images/videos, link media to letters/words, validate broken
  media URLs.
- Model feedback review: review incorrect predictions, approve user-contributed samples,
  export improvement dataset.
- User management: view learners, promote/demote admin, disable accounts.

---

## Slide 10 - Recommended Next Sprint

### Priority 1 - Stabilize Word Detection

- Fix `mockCurriculum.ts` missing `videoUrl` (clears typecheck).
- Fix `WordDetectionWordCard.tsx` set-state-in-effect (clears lint).
- Validate that the configured word model loads and serves predictions.
- Verify the word prediction status endpoint.
- Validate one full word lesson from page load to prediction result.
- Commit the in-progress word detection changes once stable.

### Priority 2 - Complete Quiz Learner Flow

- Build the lesson quiz page/component.
- Reuse existing backend exercise APIs.
- Save quiz attempts and completion.
- Add pass/fail/retry state.

### Priority 3 - Connect Admin Quiz UI to Backend

- Replace mock quiz data with real API calls.
- Add create/update/delete exercise requests.
- Add option management.
- Add a track switcher for Finger Spelling and Word Detection.

### Priority 4 - Testing and Demo Readiness

- Make the full backend test suite run without hanging (mock model load in tests).
- Fix frontend lint/typecheck so the build is clean.
- Prepare a stable demo path:
  - login or guest mode
  - finger spelling lesson + camera prediction
  - word detection lesson
  - admin quiz preview

---

## Slide 11 - Suggested Presentation Talking Points

### What We Have Achieved

- Built a full-stack learning platform foundation.
- Implemented two learning tracks: Finger Spelling and Word Detection.
- Integrated MediaPipe keypoint extraction with backend ML prediction.
- Added a real-time WebSocket prediction architecture.
- Created curriculum, exercises, progress, and admin-side data structures.
- Added a real word video dataset with 100 words and 300 videos.
- Got the word detection trained model in place at the configured path.

### What Is Still In Progress

- Word detection frontend has open type/lint errors and uncommitted integration work.
- Quiz flow is partially supported by backend data but needs a learner-facing UI.
- Admin dashboard exists only as an early, mock-based quiz manager.
- The full backend test suite needs to run reliably end to end.

### Main Technical Challenge

The hardest part is not building pages. It is making the AI pipeline reliable:

```text
camera -> MediaPipe keypoints -> feature vector -> backend model -> confidence -> UI feedback -> progress update
```

Every step must agree on data shape, timing, labels, and thresholds.

---

## Slide 12 - Final Status Statement

Finger Spelling is close to demo-ready and can be presented as the mature track.

Word Detection is structurally implemented and now has its trained model in place, but it
still needs the frontend type/lint fixes, end-to-end prediction validation, and a commit
of the in-progress integration work before it can be called complete.

The next major product milestone should be:

```text
Stable AI practice loop + learner quiz flow + connected admin dashboard
```

Once those are finished, the platform will feel like a complete learning product instead
of separate learning modules.
