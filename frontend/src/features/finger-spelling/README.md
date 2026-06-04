# Finger spelling (frontend)

**Owner track:** Punleu — image-based Khmer letter curriculum (no video).

## Where to work

| Area | Path |
|------|------|
| Routes | `src/app/finger-spelling/` |
| UI & logic | `src/features/finger-spelling/` |
| Shared shell pieces | `src/features/finger-spelling/components/shell/` |

Do **not** add finger-spelling screens under `src/app/words/` or `src/features/words/`.

## Routes

Finger spelling curriculum only (under `src/app/[locale]/finger-spelling/`):

- `/finger-spelling` — unit cards (tap to open unit)
- `/finger-spelling/units/[unitId]` — collapsible chapters with lesson progress
- `/finger-spelling/chapters/[chapterId]` — chapter with collapsible lessons
- `/finger-spelling/lessons/[lessonId]` — lesson learning
- `/finger-spelling/exercise` — chapter exercises (exercise tab)

App-wide bottom nav also links to `/dictionary` and `/profile` (see `src/app/[locale]/dictionary`, `profile` — not under finger-spelling).

## API

## API & data layer

Finger spelling data flows through one adapter layer (`api/adapters.ts`) so **mock and backend use the same shapes**:

| Source | When | Normalization |
|--------|------|----------------|
| Backend API | Default (`NEXT_PUBLIC_FS_USE_MOCK` unset) | `normalizeUnit`, `normalizeChapter`, `normalizeLesson`, `adaptBackendChapterExercise` |
| Mock data | `NEXT_PUBLIC_FS_USE_MOCK=true` | Same adapters — mock mirrors `FsUnitResponse`, `FsChapterResponse`, `FsLessonResponse`, `ExerciseResponse` |

Copy `frontend/.env.example` → `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Ensure the backend is running and curriculum is seeded (`python seed_data/seed_curriculum.py` from `backend/`).

For offline UI only: `NEXT_PUBLIC_FS_USE_MOCK=true`

| Method | Path |
|--------|------|
| GET | `/api/finger_spelling/units` |
| GET | `/api/finger_spelling/units/{unitId}` |
| GET | `/api/finger_spelling/units/{unitId}/chapters` |
| GET | `/api/finger_spelling/chapters/{chapterId}` |
| GET | `/api/finger_spelling/chapters/{chapterId}/lessons` |
| GET | `/api/finger_spelling/lessons/{lessonId}` |

Practice, exercise, and progress use `/api/finger_spelling/practice`, `/exercise`, and `/progress` respectively. Letter media lookup uses the separate legacy route `/api/curriculum/letters/{letterKh}`.

## Figma

[KSL-Project Dev — node 227-1176](https://www.figma.com/design/EecigRtMi06WiCgdUk8OEd/KSL-Project---Dev?node-id=227-1176)

Match spacing, orange primary, and mobile shell from that frame when refining UI.
