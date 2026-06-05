"""
Finger spelling API tests for the current learner and admin curriculum routes.
"""
import uuid


def _create_curriculum(client, admin_headers):
    suffix = uuid.uuid4().hex[:8]
    order = int(suffix, 16)

    unit_response = client.post(
        "/api/finger_spelling/admin/units",
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

    chapter_response = client.post(
        "/api/finger_spelling/admin/chapters",
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

    lesson_response = client.post(
        "/api/finger_spelling/admin/lessons",
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

    return unit, chapter, lesson_response.json()


class TestFingerSpellingAPI:
    """Test finger spelling units, chapters, lessons, and exercises."""

    def test_admin_create_finger_unit(self, client, admin_headers):
        suffix = uuid.uuid4().hex[:8]
        response = client.post(
            "/api/finger_spelling/admin/units",
            json={
                "name_en": f"Admin Unit {suffix}",
                "name_kh": f"ឯកតា Admin {suffix}",
                "description_en": "Admin unit description",
                "order_index": int(suffix, 16),
            },
            headers=admin_headers,
        )
        assert response.status_code == 201

        data = response.json()
        assert data["name_en"] == f"Admin Unit {suffix}"
        assert data["description_en"] == "Admin unit description"
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data

    def test_admin_create_finger_unit_unauthorized(self, client):
        response = client.post(
            "/api/finger_spelling/admin/units",
            json={"name_en": "Test Unit", "name_kh": "ឯកតា", "order_index": 999001},
        )
        assert response.status_code == 401

    def test_admin_create_finger_unit_forbidden_for_student(self, client, auth_headers):
        response = client.post(
            "/api/finger_spelling/admin/units",
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
