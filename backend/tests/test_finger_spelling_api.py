"""
Finger spelling API tests for the current learner and admin curriculum routes.
"""
import uuid
from types import SimpleNamespace

from tests.helpers import safe_order_index, unique_suffix


def _publish(client, admin_headers, entity: str, entity_id: int):
    """Confirm-publish an admin-created draft so it becomes learner-visible."""
    response = client.post(
        f"/api/admin/finger/{entity}/{entity_id}/publish",
        headers=admin_headers,
    )
    assert response.status_code == 200, response.text
    return response.json()


def _create_curriculum(client, admin_headers):
    suffix = unique_suffix()
    order = safe_order_index(suffix)

    unit_response = client.post(
        "/api/admin/finger/units",
        json={
            "name_en": f"Test Unit {suffix}",
            "name_kh": f"ឯកតា {suffix}",
            "description_en": "Test unit description",
            "description_kh": "សេចក្តីពិពណ៌នាសាកល្បង",
            "order_index": order,
        },
        headers=admin_headers,
    )
    assert unit_response.status_code == 201
    unit = unit_response.json()
    unit = _publish(client, admin_headers, "units", unit["id"])

    chapter_response = client.post(
        "/api/admin/finger/chapters",
        json={
            "unit_id": unit["id"],
            "name_en": f"Test Chapter {suffix}",
            "name_kh": f"ជំពូក {suffix}",
            "description_en": "Test chapter description",
            "description_kh": "សេចក្តីពិពណ៌នាជំពូក",
            "order_index": 1,
        },
        headers=admin_headers,
    )
    assert chapter_response.status_code == 201
    chapter = chapter_response.json()
    chapter = _publish(client, admin_headers, "chapters", chapter["id"])

    lesson_response = client.post(
        "/api/admin/finger/lessons",
        json={
            "chapter_id": chapter["id"],
            "name_en": f"Test Lesson {suffix}",
            "name_kh": f"មេរៀន {suffix}",
            "description_en": "Test lesson description",
            "description_kh": "សេចក្តីពិពណ៌នាមេរៀន",
            "order_index": 1,
        },
        headers=admin_headers,
    )
    assert lesson_response.status_code == 201
    lesson = _publish(client, admin_headers, "lessons", lesson_response.json()["id"])

    return unit, chapter, lesson


class TestFingerSpellingAPI:
    """Test finger spelling units, chapters, lessons, and exercises."""

    def test_admin_create_finger_unit(self, client, admin_headers):
        suffix = unique_suffix()
        response = client.post(
            "/api/admin/finger/units",
            json={
                "name_en": f"Admin Unit {suffix}",
                "name_kh": f"ឯកតា Admin {suffix}",
                "description_en": "Admin unit description",
                "order_index": safe_order_index(suffix),
            },
            headers=admin_headers,
        )
        assert response.status_code == 201

        data = response.json()
        assert data["name_en"] == f"Admin Unit {suffix}"
        assert data["description_en"] == "Admin unit description"
        assert data["is_active"] is True
        assert data["publish_status"] == "draft"
        assert "id" in data
        assert "created_at" in data

    def test_admin_create_finger_unit_unauthorized(self, client):
        response = client.post(
            "/api/admin/finger/units",
            json={"name_en": "Test Unit", "name_kh": "ឯកតា", "order_index": 999001},
        )
        assert response.status_code == 401

    def test_admin_create_finger_unit_forbidden_for_student(self, client, auth_headers):
        response = client.post(
            "/api/admin/finger/units",
            json={"name_en": "Test Unit", "name_kh": "ឯកតា", "order_index": 999002},
            headers=auth_headers,
        )
        assert response.status_code == 403

    def test_get_finger_units(self, client, admin_headers):
        unit, _, _ = _create_curriculum(client, admin_headers)

        response = client.get("/api/finger_spelling/units")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        created = next((u for u in data if u["id"] == unit["id"]), None)
        assert created is not None
        assert created["title"] == unit["name_en"]
        assert created["titleKh"] == unit["name_kh"]

    def test_get_finger_unit_by_id(self, client, admin_headers):
        unit, _, _ = _create_curriculum(client, admin_headers)

        response = client.get(f"/api/finger_spelling/units/{unit['id']}")
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == unit["id"]
        assert data["title"] == unit["name_en"]
        assert data["titleKh"] == unit["name_kh"]

    def test_get_finger_unit_not_found(self, client):
        response = client.get("/api/finger_spelling/units/-1")
        assert response.status_code == 404

    def test_get_finger_chapters_for_unit(self, client, admin_headers):
        unit, chapter, _ = _create_curriculum(client, admin_headers)

        response = client.get(f"/api/finger_spelling/units/{unit['id']}/chapters")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert data[0]["id"] == chapter["id"]
        assert data[0]["unitId"] == unit["id"]
        assert data[0]["title"] == chapter["name_en"]

    def test_get_finger_chapters_unit_not_found(self, client):
        response = client.get("/api/finger_spelling/units/-1/chapters")
        assert response.status_code == 404

    def test_get_finger_chapter_by_id(self, client, admin_headers):
        _, chapter, _ = _create_curriculum(client, admin_headers)

        response = client.get(f"/api/finger_spelling/chapters/{chapter['id']}")
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == chapter["id"]
        assert data["title"] == chapter["name_en"]

    def test_get_finger_lessons_for_chapter(self, client, admin_headers):
        _, chapter, lesson = _create_curriculum(client, admin_headers)

        response = client.get(f"/api/finger_spelling/chapters/{chapter['id']}/lessons")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert data[0]["id"] == lesson["id"]
        assert data[0]["chapterId"] == chapter["id"]
        assert data[0]["letter"] == lesson["name_kh"]

    def test_get_finger_lesson_by_id(self, client, admin_headers):
        _, chapter, lesson = _create_curriculum(client, admin_headers)

        response = client.get(f"/api/finger_spelling/lessons/{lesson['id']}")
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == lesson["id"]
        assert data["chapterId"] == chapter["id"]
        assert data["description"] == lesson["description_en"]

    def test_get_lesson_not_found(self, client):
        response = client.get("/api/finger_spelling/lessons/-1")
        assert response.status_code == 404

    def test_get_chapter_exercises(self, client, admin_headers):
        _, chapter, _ = _create_curriculum(client, admin_headers)

        response = client.get(f"/api/finger_spelling/exercise/chapters/{chapter['id']}")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)

    def test_get_chapter_exercises_not_found(self, client):
        response = client.get("/api/finger_spelling/exercise/chapters/-1")
        assert response.status_code == 404

    def test_get_finger_spelling_progress_requires_auth(self, client):
        response = client.get("/api/finger_spelling/progress/lessons/1")
        assert response.status_code == 401

    def test_get_hand_predict_status_requires_user_or_guest(self, client):
        response = client.get("/api/finger_spelling/practice/predict/status")
        assert response.status_code == 401

    def test_get_hand_predict_status_allows_guest_access(self, client, monkeypatch):
        from src.api.routes.finger_spelling import finger_hand_predict

        class FakeHandPredictionService:
            is_available = True

            def get_metadata(self):
                return {"label_count": 2, "output_class_count": 2}

        monkeypatch.setattr(
            finger_hand_predict,
            "_get_hand_prediction_service",
            lambda: FakeHandPredictionService(),
        )

        response = client.get(
            "/api/finger_spelling/practice/predict/status",
            headers={"X-KSL-Guest-Id": "guest_test"},
        )
        assert response.status_code == 200
        assert response.json()["available"] is True

    def test_predict_from_features_requires_user_or_guest(self, client):
        response = client.post(
            "/api/finger_spelling/practice/predict/features",
            json={"features": [0.0] * 126},
        )
        assert response.status_code == 401

    def test_predict_from_features_allows_guest_access(self, client, monkeypatch):
        from src.api.routes.finger_spelling import finger_hand_predict

        class FakeHandPredictionService:
            is_available = True

            def predict_from_features(self, features, *, handedness="Unknown"):
                return SimpleNamespace(
                    match_confidence=92.5,
                    prediction=SimpleNamespace(
                        predicted_class_index=1,
                        predicted_label="ក",
                    ),
                    features=SimpleNamespace(handedness=handedness),
                )

        monkeypatch.setattr(
            finger_hand_predict,
            "_get_hand_prediction_service",
            lambda: FakeHandPredictionService(),
        )

        response = client.post(
            "/api/finger_spelling/practice/predict/features",
            json={"features": [0.0] * 126, "handedness": "Right"},
            headers={"X-KSL-Guest-Id": "guest_test"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["match_confidence"] == 92.5
        assert data["predicted_label"] == "ក"


def _create_second_lesson(client, admin_headers, chapter_id: int):
    """Guarantee the curriculum holds at least two live lessons."""
    suffix = unique_suffix()
    response = client.post(
        "/api/admin/finger/lessons",
        json={
            "chapter_id": chapter_id,
            "name_en": f"Test Lesson {suffix}",
            "name_kh": f"មេរៀន {suffix}",
            "description_en": "Second test lesson",
            "description_kh": "មេរៀនទីពីរ",
            "order_index": 2,
        },
        headers=admin_headers,
    )
    assert response.status_code == 201, response.text
    return _publish(client, admin_headers, "lessons", response.json()["id"])


def _first_two_lesson_ids(client, admin_headers, db) -> tuple[int, int]:
    """First and second lessons in real curriculum order (robust to seeded data)."""
    from src.repositories.finger_spelling.finger_curriculum_repository import (
        FingerCurriculumRepository,
    )

    _, chapter, _ = _create_curriculum(client, admin_headers)
    _create_second_lesson(client, admin_headers, chapter["id"])
    ordered = FingerCurriculumRepository(db).list_lessons_in_curriculum_order()
    assert len(ordered) >= 2
    return ordered[0].id, ordered[1].id


def _attempt(client, headers, lesson_id: int):
    return client.post(
        f"/api/finger_spelling/practice/lessons/{lesson_id}/attempt",
        json={"accuracy": 90.0, "label_matched": True},
        headers=headers,
    )


class TestFingerLessonLockEnforcement:
    """The linear lesson lock must be enforced by the server, not only the UI."""

    def test_locked_lesson_attempt_is_rejected_and_not_recorded(
        self, client, admin_headers, auth_headers, db
    ):
        _, second_id = _first_two_lesson_ids(client, admin_headers, db)

        response = _attempt(client, auth_headers, second_id)
        assert response.status_code == 403
        assert "locked" in response.json()["detail"].lower()

        progress = client.get(
            f"/api/finger_spelling/progress/lessons/{second_id}", headers=auth_headers
        )
        assert progress.status_code == 200
        assert progress.json()["progressStatus"] == "NOT_STARTED"
        assert progress.json()["attemptCount"] == 0
        assert progress.json()["isLocked"] is True

    def test_lessons_unlock_in_order_after_completing_the_previous_one(
        self, client, admin_headers, auth_headers, db
    ):
        first_id, second_id = _first_two_lesson_ids(client, admin_headers, db)

        assert _attempt(client, auth_headers, second_id).status_code == 403

        first = _attempt(client, auth_headers, first_id)
        assert first.status_code == 200
        assert first.json()["lesson_completed"] is True

        second = _attempt(client, auth_headers, second_id)
        assert second.status_code == 200
        assert second.json()["lesson_id"] == second_id

    def test_admin_can_attempt_a_locked_lesson(self, client, admin_headers, db):
        _, second_id = _first_two_lesson_ids(client, admin_headers, db)

        assert _attempt(client, admin_headers, second_id).status_code == 200

    def test_attempt_on_missing_lesson_is_still_404(self, client, auth_headers):
        assert _attempt(client, auth_headers, 999_999_999).status_code == 404

    def test_attempt_requires_authentication(self, client):
        response = client.post(
            "/api/finger_spelling/practice/lessons/1/attempt",
            json={"accuracy": 90.0, "label_matched": True},
        )
        assert response.status_code == 401

    def test_enforcement_ignores_a_stale_lock_cache(
        self, client, admin_headers, seed_user, test_user_data, db
    ):
        """Progress written without clear_cache() (e.g. by another worker or the
        guest import) must not leave a legitimate learner locked out."""
        from src.repositories.finger_spelling.finger_progress_repository import (
            FingerProgressRepository,
        )
        from src.services.finger_spelling.finger_locking_service import (
            FingerLockingService,
        )

        first_id, second_id = _first_two_lesson_ids(client, admin_headers, db)
        user = seed_user(test_user_data)
        locking = FingerLockingService(db)

        assert locking.is_lesson_locked(second_id, user.id) is True  # now cached

        row = FingerProgressRepository(db).get_or_create_lesson_progress(user.id, first_id)
        row.is_completed = True
        db.flush()

        assert locking.is_lesson_locked(second_id, user.id) is True  # stale cache
        assert locking.is_lesson_locked(second_id, user.id, use_cache=False) is False
        assert locking.is_lesson_locked(second_id, user.id) is False  # cache refreshed
