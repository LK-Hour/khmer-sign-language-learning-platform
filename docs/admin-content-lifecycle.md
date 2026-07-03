# Admin Content Lifecycle: draft / published + is_active

This document defines the content lifecycle contract shared by the admin APIs,
the learner-facing APIs, and the admin console UI. It covers all publishable
content entities across both learning tracks:

- Finger Spelling: `finger_units`, `finger_chapters`, `finger_lessons`, `finger_exercises`
- Word Detection: `word_detection_units`, `word_detection_chapters`, `word_detection_lessons`, `word_detection_exercises`

## Two independent state axes

Every publishable row carries two flags that answer different questions:

| Field | Values | Question it answers |
|---|---|---|
| `is_active` | `true` / `false` | Does this row exist from the admin's point of view? (soft delete) |
| `publish_status` | `draft` / `published` | Has the admin confirmed this content for learners? |

A row is **learner-visible ("live") only when both** `is_active = true` **and**
`publish_status = 'published'`. This predicate is implemented once in
`backend/src/models/publishable.py`:

- `live(Model)` — SQL predicate used by learner-facing repositories.
- `is_live(entity)` — Python-side check for already-loaded ORM instances.

Supporting columns: `published_at` (timestamp of last publish) and
`published_by` (FK to `users.id` of the admin who confirmed the publish).

## State transitions

```
                create / update (admin)
                        │
                        ▼
   ┌──────────────  DRAFT (active)  ──────────────┐
   │                    │                          │
   │            POST /{id}/publish                 │ DELETE /{id}
   │                    ▼                          ▼
   │          PUBLISHED (active)  ── DELETE ─▶  INACTIVE
   │                    │                          │
   │              PUT /{id} (edit)          POST /{id}/restore
   │                    │                          │
   └────────────────────┘                          ▼
        (reverts to DRAFT)              back to previous publish_status
```

Rules, in order of precedence:

1. **Create → draft.** `POST` on any admin entity endpoint saves the row with
   `publish_status = 'draft'`. It is never learner-visible on creation.
2. **Update → draft.** `PUT` on a published row reverts it to `'draft'`. The
   edit is immediately saved but hidden from learners until re-published.
3. **Publish is explicit.** `POST .../{id}/publish` is the only way content
   becomes learner-visible. The admin UI requires a confirmation modal
   ("Confirm Publish") before issuing this call. On success the backend sets
   `publish_status = 'published'`, `published_at = now()`, `published_by = <admin id>`.
4. **Publish requires a live parent.** A chapter cannot be published while its
   unit is not live; same for lesson → chapter and exercise → lesson. Violations
   return `409 Conflict`. Units have no parent constraint.
5. **Publish requires an active row.** Publishing a soft-deleted row returns
   `409 Conflict`. Restore it first.
6. **Delete is soft.** `DELETE .../{id}` sets `is_active = false`. The row
   disappears from learner APIs but stays in admin lists (shown as *Inactive*).
   `publish_status` is not changed by delete.
7. **Restore is explicit.** `POST .../{id}/restore` sets `is_active = true`.
   Because `publish_status` was preserved, a previously published row becomes
   learner-visible again immediately after restore; a draft row stays hidden
   until published.

## Who sees what

| Consumer | Query filter | Sees drafts? | Sees inactive? |
|---|---|---|---|
| Learner APIs (`/api/finger_spelling/...`, `/api/word_detection/...`) | `live(Model)` | No | No |
| Admin APIs (`/api/admin/{track}/...`) | none by default | Yes | Yes |

Admin list endpoints accept filters: `status` (`draft`/`published`),
`active_only`, `q` (name search), and parent-ID filters (`unit_id`,
`chapter_id`, `lesson_id`).

## Exercise options

Options do not carry their own `publish_status`; their visibility follows the
parent exercise. They do have `is_active` for soft delete/restore
(`/exercise-options/{id}` + `/restore`).

## Defaults and backward compatibility

- Database `server_default` and ORM default for `publish_status` is
  `'published'` so seed scripts, fixtures, and pre-migration rows remain
  learner-visible without changes.
- The **admin services** are the layer that forces `'draft'` on create/update;
  direct ORM writes (seeds) are unaffected.
- Migration: `backend/alembic/versions/f8b1d3a6c2e4_add_publish_workflow_columns.py`.

## Authorization

There is a single admin role: `users.account_type = 'admin'`, enforced by the
`get_admin_user` dependency on every `/api/admin/...` endpoint (anonymous →
`401`, non-admin → `403`). There is no permission matrix; every admin can
perform every action.
