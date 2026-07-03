# Admin Management Test Matrix

Locked test matrix for the admin management feature: single admin role,
restorable soft delete, and confirm-publish workflow. Lifecycle semantics are
defined in [admin-content-lifecycle.md](./admin-content-lifecycle.md).

## Backend integration tests (automated)

Primary suite: `backend/tests/test_admin_api.py`, run with `pytest` from
`backend/`. Supporting coverage lives in `test_finger_spelling_api.py` and
`test_integration.py`, whose curriculum helpers exercise the centralized admin
endpoints plus the explicit publish step.

### Authorization (single admin role)

| Behavior | Test |
|---|---|
| Anonymous request → 401 | `TestAdminAuth::test_anonymous_is_unauthorized` |
| Authenticated student → 403 | `TestAdminAuth::test_student_is_forbidden` |
| Admin (`account_type=admin`) → 200 | `TestAdminAuth::test_admin_is_allowed` |
| Unknown track segment → 404 | `TestWordDetectionTrack::test_unknown_track_is_rejected` |

### Publish workflow (draft → confirm publish → live)

| Behavior | Test |
|---|---|
| Create lands in `draft`, hidden from learner API | `TestPublishWorkflow::test_created_unit_is_draft_and_hidden_from_learners` |
| Publish sets `published` + `published_at`, learner-visible | `TestPublishWorkflow::test_publish_makes_unit_learner_visible` |
| Update of published row reverts to `draft`, hidden again | `TestPublishWorkflow::test_update_reverts_to_draft_and_hides_from_learners` |
| Publish blocked (409) while parent is not live | `TestPublishWorkflow::test_publish_chapter_requires_published_parent_unit` |
| Full unit → chapter → lesson publish chain | `TestPublishWorkflow::test_full_hierarchy_publish_flow` |
| Exercise draft/publish incl. parent-lesson gate | `TestExercisePublishWorkflow::test_exercise_draft_publish_flow` |

### Soft delete / restore

| Behavior | Test |
|---|---|
| DELETE → `is_active=false`, hidden from learners; restore → visible again, publish state preserved | `TestSoftDeleteRestore::test_delete_then_restore_unit` |
| Publish of inactive row rejected (409) | `TestSoftDeleteRestore::test_publish_inactive_unit_is_rejected` |
| Admin lists still show inactive + draft rows | `TestSoftDeleteRestore::test_admin_list_still_shows_inactive_and_draft` |
| Exercise delete + restore | `TestExercisePublishWorkflow::test_exercise_delete_restore` |

### Multi-track coverage

| Behavior | Test |
|---|---|
| Word Detection unit/chapter lifecycle (incl. `level` field) | `TestWordDetectionTrack::test_wd_unit_chapter_lifecycle` |

## Frontend UI checks

There is no frontend unit-test runner configured (`package.json` has no test
script), so UI verification is locked as a manual checklist until a runner is
introduced. All checks run against `/{locale}/admin/...`.

### Admin guard

- [ ] Anonymous visit to `/admin/curriculum` redirects to `/login?redirect_to=...`.
- [ ] Logged-in student is redirected to home.
- [ ] Admin sees the dashboard shell (dark sidebar + content panel).

### Table page pattern (curriculum + exercises)

- [ ] Track toggle switches between Finger Spelling and Word Detection data.
- [ ] Units/Chapters/Lessons tabs load the corresponding tables.
- [ ] Search box and Publish Status / Visibility filters narrow the rows.
- [ ] Footer shows record count and pagination works.
- [ ] Status column shows paired chips: Active/Inactive + Draft/Published.
- [ ] Inactive rows render dimmed with a Restore action instead of Delete.

### Confirm-publish flow

- [ ] Creating or editing an item shows the "saved as draft" notice and the row
      appears with a Draft chip.
- [ ] Publish action opens the confirmation modal with the change summary
      (entity type, EN/KH name, draft → published transition).
- [ ] Cancel keeps the row in draft; Confirm Publish flips the chip to
      Published.
- [ ] Publishing a child whose parent is draft surfaces the backend 409 as an
      error alert.
- [ ] After publish, content appears in the learner-facing pages; drafts and
      deleted items do not.

### Restore flow

- [ ] Delete opens a confirmation dialog; confirming marks the row Inactive.
- [ ] Restore opens a confirmation dialog; confirming reactivates the row and
      previously published content becomes learner-visible again.
