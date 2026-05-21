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

- `/finger-spelling` — units (learn home)
- `/finger-spelling/units/[unitId]` — chapters
- `/finger-spelling/chapters/[chapterId]` — lessons
- `/finger-spelling/lessons/[lessonId]` — lesson detail (image + letter)

## API

Backend contract (when ready): `/api/finger_spelling/*`. Until then, mock data is used (`NEXT_PUBLIC_FS_USE_MOCK=false` to force live API).

## Figma

[KSL-Project Dev — node 227-1176](https://www.figma.com/design/EecigRtMi06WiCgdUk8OEd/KSL-Project---Dev?node-id=227-1176)

Match spacing, orange primary, and mobile shell from that frame when refining UI.
