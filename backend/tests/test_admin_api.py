"""
Admin management API tests: auth, restore, and confirm-publish workflow.

Covers the centralized admin endpoints (/api/admin/{track}/...) and the
learner-visibility guarantees:
- admin-only access (401 anonymous, 403 student)
- create/update -> draft, not learner-visible
- publish -> learner-visible
- delete -> inactive, learner-invisible; restore -> active again
- publish blocked while the parent is not live
"""
import uuid

from tests.helpers import safe_order_index, unique_suffix


def _make_unit_payload(order: int | None = None):
    suffix = unique_suffix()
    return {
        "name_en": f"Admin API Unit {suffix}",
        "name_kh": f"ឯកតា {suffix}",
        "description_en": "Admin API test unit",
        "order_index": order if order is not None else safe_order_index(suffix),
    }


def _create_unit(client, admin_headers, track="finger"):
    response = client.post(
        f"/api/admin/{track}/units", json=_make_unit_payload(), headers=admin_headers
    )
    assert response.status_code == 201, response.text
    return response.json()


def _publish(client, admin_headers, entity, entity_id, track="finger", expect=200):
    response = client.post(
        f"/api/admin/{track}/{entity}/{entity_id}/publish", headers=admin_headers
    )
    assert response.status_code == expect, response.text
    return response.json()


def _create_chapter(client, admin_headers, unit_id, track="finger", **extra):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "unit_id": unit_id,
        "name_en": f"Admin API Chapter {suffix}",
        "name_kh": f"ជំពូក {suffix}",
        "order_index": 1,
        **extra,
    }
    response = client.post(
        f"/api/admin/{track}/chapters", json=payload, headers=admin_headers
    )
    assert response.status_code == 201, response.text
    return response.json()


def _create_lesson(client, admin_headers, chapter_id, track="finger"):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "chapter_id": chapter_id,
        "name_en": f"Admin API Lesson {suffix}",
        "name_kh": f"មេរៀន {suffix}",
        "order_index": 1,
    }
    response = client.post(
        f"/api/admin/{track}/lessons", json=payload, headers=admin_headers
    )
    assert response.status_code == 201, response.text
    return response.json()


class TestAdminAuth:
    """Single admin role: anonymous -> 401, student -> 403, admin -> ok."""

    def test_anonymous_is_unauthorized(self, client):
        assert client.get("/api/admin/finger/units").status_code == 401
        assert client.get("/api/admin/finger/exercises").status_code == 401

    def test_student_is_forbidden(self, client, auth_headers):
        assert (
            client.get("/api/admin/finger/units", headers=auth_headers).status_code
            == 403
        )
        response = client.post(
            "/api/admin/finger/units", json=_make_unit_payload(), headers=auth_headers
        )
        assert response.status_code == 403

    def test_admin_is_allowed(self, client, admin_headers):
        assert (
            client.get("/api/admin/finger/units", headers=admin_headers).status_code
            == 200
        )


class TestPublishWorkflow:
    """Create/update -> draft; explicit publish -> learner-visible."""

    def test_created_unit_is_draft_and_hidden_from_learners(
        self, client, admin_headers
    ):
        unit = _create_unit(client, admin_headers)
        assert unit["publish_status"] == "draft"
        assert unit["is_active"] is True

        learner_units = client.get("/api/finger_spelling/units").json()
        assert all(u["id"] != unit["id"] for u in learner_units)

    def test_publish_makes_unit_learner_visible(self, client, admin_headers):
        unit = _create_unit(client, admin_headers)
        published = _publish(client, admin_headers, "units", unit["id"])
        assert published["publish_status"] == "published"
        assert published["published_at"] is not None

        learner_units = client.get("/api/finger_spelling/units").json()
        assert any(u["id"] == unit["id"] for u in learner_units)

    def test_update_reverts_to_draft_and_hides_from_learners(
        self, client, admin_headers
    ):
        unit = _create_unit(client, admin_headers)
        _publish(client, admin_headers, "units", unit["id"])

        response = client.put(
            f"/api/admin/finger/units/{unit['id']}",
            json={"description_en": "edited"},
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["publish_status"] == "draft"

        learner_units = client.get("/api/finger_spelling/units").json()
        assert all(u["id"] != unit["id"] for u in learner_units)

    def test_publish_chapter_requires_published_parent_unit(
        self, client, admin_headers
    ):
        unit = _create_unit(client, admin_headers)  # stays draft
        chapter = _create_chapter(client, admin_headers, unit["id"])

        _publish(client, admin_headers, "chapters", chapter["id"], expect=409)

        _publish(client, admin_headers, "units", unit["id"])
        published = _publish(client, admin_headers, "chapters", chapter["id"])
        assert published["publish_status"] == "published"

    def test_full_hierarchy_publish_flow(self, client, admin_headers):
        unit = _create_unit(client, admin_headers)
        _publish(client, admin_headers, "units", unit["id"])
        chapter = _create_chapter(client, admin_headers, unit["id"])
        _publish(client, admin_headers, "chapters", chapter["id"])
        lesson = _create_lesson(client, admin_headers, chapter["id"])

        # Draft lesson hidden from learners
        learner_lessons = client.get(
            f"/api/finger_spelling/chapters/{chapter['id']}/lessons"
        ).json()
        assert all(l["id"] != lesson["id"] for l in learner_lessons)

        _publish(client, admin_headers, "lessons", lesson["id"])
        learner_lessons = client.get(
            f"/api/finger_spelling/chapters/{chapter['id']}/lessons"
        ).json()
        assert any(l["id"] == lesson["id"] for l in learner_lessons)


class TestSoftDeleteRestore:
    """DELETE -> is_active=false; POST /restore -> is_active=true."""

    def test_delete_then_restore_unit(self, client, admin_headers):
        unit = _create_unit(client, admin_headers)
        _publish(client, admin_headers, "units", unit["id"])

        deleted = client.delete(
            f"/api/admin/finger/units/{unit['id']}", headers=admin_headers
        ).json()
        assert deleted["is_active"] is False

        learner_units = client.get("/api/finger_spelling/units").json()
        assert all(u["id"] != unit["id"] for u in learner_units)

        restored = client.post(
            f"/api/admin/finger/units/{unit['id']}/restore", headers=admin_headers
        ).json()
        assert restored["is_active"] is True
        # Restore does not change publish state; it was already published.
        assert restored["publish_status"] == "published"

        learner_units = client.get("/api/finger_spelling/units").json()
        assert any(u["id"] == unit["id"] for u in learner_units)

    def test_publish_inactive_unit_is_rejected(self, client, admin_headers):
        unit = _create_unit(client, admin_headers)
        client.delete(f"/api/admin/finger/units/{unit['id']}", headers=admin_headers)
        _publish(client, admin_headers, "units", unit["id"], expect=409)

    def test_admin_list_still_shows_inactive_and_draft(self, client, admin_headers):
        unit = _create_unit(client, admin_headers)
        client.delete(f"/api/admin/finger/units/{unit['id']}", headers=admin_headers)

        admin_units = client.get(
            "/api/admin/finger/units", headers=admin_headers
        ).json()
        row = next((u for u in admin_units if u["id"] == unit["id"]), None)
        assert row is not None
        assert row["is_active"] is False
        assert row["publish_status"] == "draft"


class TestWordDetectionTrack:
    """The same centralized endpoints serve the word detection track."""

    def test_wd_unit_chapter_lifecycle(self, client, admin_headers):
        unit = _create_unit(client, admin_headers, track="word_detection")
        assert unit["publish_status"] == "draft"
        _publish(client, admin_headers, "units", unit["id"], track="word_detection")

        chapter = _create_chapter(
            client, admin_headers, unit["id"], track="word_detection", level=2
        )
        assert chapter["level"] == 2
        published = _publish(
            client, admin_headers, "chapters", chapter["id"], track="word_detection"
        )
        assert published["publish_status"] == "published"

    def test_unknown_track_is_rejected(self, client, admin_headers):
        response = client.get("/api/admin/not_a_track/units", headers=admin_headers)
        assert response.status_code == 404


class TestExercisePublishWorkflow:
    """Exercises follow the same draft -> publish lifecycle."""

    def _make_lesson(self, client, admin_headers):
        unit = _create_unit(client, admin_headers)
        _publish(client, admin_headers, "units", unit["id"])
        chapter = _create_chapter(client, admin_headers, unit["id"])
        _publish(client, admin_headers, "chapters", chapter["id"])
        lesson = _create_lesson(client, admin_headers, chapter["id"])
        return chapter, lesson

    def _create_exercise(self, client, admin_headers, lesson_id):
        response = client.post(
            "/api/admin/finger/exercises",
            json={
                "lesson_id": lesson_id,
                "question_en": "Which sign is this?",
                "question_kh": "តើសញ្ញានេះជាអ្វី?",
                "exercise_type": "multiple_choice",
                "order_index": 1,
                "options": [
                    {"option_text_en": "A", "is_correct": True, "order_index": 1},
                    {"option_text_en": "B", "is_correct": False, "order_index": 2},
                ],
            },
            headers=admin_headers,
        )
        assert response.status_code == 201, response.text
        return response.json()

    def test_exercise_draft_publish_flow(self, client, admin_headers):
        chapter, lesson = self._make_lesson(client, admin_headers)
        exercise = self._create_exercise(client, admin_headers, lesson["id"])
        assert exercise["publish_status"] == "draft"

        # Draft exercise cannot publish while parent lesson is draft
        response = client.post(
            f"/api/admin/finger/exercises/{exercise['id']}/publish",
            headers=admin_headers,
        )
        assert response.status_code == 409

        _publish(client, admin_headers, "lessons", lesson["id"])
        response = client.post(
            f"/api/admin/finger/exercises/{exercise['id']}/publish",
            headers=admin_headers,
        )
        assert response.status_code == 200
        assert response.json()["publish_status"] == "published"

        learner = client.get(
            f"/api/finger_spelling/exercise/chapters/{chapter['id']}"
        )
        assert learner.status_code == 200
        assert any(e["id"] == exercise["id"] for e in learner.json())

    def test_exercise_delete_restore(self, client, admin_headers):
        _, lesson = self._make_lesson(client, admin_headers)
        exercise = self._create_exercise(client, admin_headers, lesson["id"])

        deleted = client.delete(
            f"/api/admin/finger/exercises/{exercise['id']}", headers=admin_headers
        ).json()
        assert deleted["is_active"] is False

        restored = client.post(
            f"/api/admin/finger/exercises/{exercise['id']}/restore",
            headers=admin_headers,
        ).json()
        assert restored["is_active"] is True
