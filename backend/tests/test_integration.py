"""
Integration tests for complete API workflows.
"""
import uuid

from tests.helpers import safe_order_index, unique_suffix


def _auth_token(client, user_data):
    response = client.post(
        "/api/auth/login/email",
        json={"email": user_data["email"], "password": user_data["password"]},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def _publish(client, headers, entity: str, entity_id: int):
    response = client.post(
        f"/api/admin/finger/{entity}/{entity_id}/publish", headers=headers
    )
    assert response.status_code == 200, response.text
    return response.json()


def _create_admin_curriculum(client, headers):
    suffix = unique_suffix()
    unit_response = client.post(
        "/api/admin/finger/units",
        json={
            "name_en": f"Integration Unit {suffix}",
            "name_kh": f"ឯកតា Integration {suffix}",
            "description_en": "Unit created during integration test",
            "order_index": safe_order_index(suffix),
        },
        headers=headers,
    )
    assert unit_response.status_code == 201
    unit = _publish(client, headers, "units", unit_response.json()["id"])

    chapter_response = client.post(
        "/api/admin/finger/chapters",
        json={
            "unit_id": unit["id"],
            "name_en": f"Integration Chapter {suffix}",
            "name_kh": f"ជំពូក Integration {suffix}",
            "description_en": "Chapter created during integration test",
            "order_index": 1,
        },
        headers=headers,
    )
    assert chapter_response.status_code == 201
    chapter = _publish(client, headers, "chapters", chapter_response.json()["id"])

    lesson_response = client.post(
        "/api/admin/finger/lessons",
        json={
            "chapter_id": chapter["id"],
            "name_en": f"Integration Lesson {suffix}",
            "name_kh": f"មេរៀន Integration {suffix}",
            "description_en": "Lesson created during integration test",
            "order_index": 1,
        },
        headers=headers,
    )
    assert lesson_response.status_code == 201
    lesson = _publish(client, headers, "lessons", lesson_response.json()["id"])
    return unit, chapter, lesson


class TestIntegration:
    """Integration tests for complete user workflows."""

    def test_complete_user_workflow(self, client, test_user_data, test_admin_data):
        register_response = client.post("/users/", json=test_user_data)
        assert register_response.status_code == 201
        user_id = register_response.json()["id"]

        token = _auth_token(client, test_user_data)
        headers = {"Authorization": f"Bearer {token}"}

        me_response = client.get("/api/auth/login/me", headers=headers)
        assert me_response.status_code == 200
        assert me_response.json()["email"] == test_user_data["email"]

        client.post("/users/", json=test_admin_data)
        admin_token = _auth_token(client, test_admin_data)
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        unit, chapter, lesson = _create_admin_curriculum(client, admin_headers)

        units_response = client.get("/api/finger_spelling/units")
        assert units_response.status_code == 200
        assert any(u["id"] == unit["id"] for u in units_response.json())

        chapters_response = client.get(f"/api/finger_spelling/units/{unit['id']}/chapters")
        assert chapters_response.status_code == 200
        assert any(c["id"] == chapter["id"] for c in chapters_response.json())

        lessons_response = client.get(f"/api/finger_spelling/chapters/{chapter['id']}/lessons")
        assert lessons_response.status_code == 200
        assert any(l["id"] == lesson["id"] for l in lessons_response.json())

        update_data = {**test_user_data, "display_name": "Updated Integration User"}
        update_response = client.put(f"/users/{user_id}", json=update_data, headers=headers)
        assert update_response.status_code == 200
        assert update_response.json()["display_name"] == "Updated Integration User"

        delete_response = client.delete(f"/users/{user_id}", headers=headers)
        assert delete_response.status_code == 200
        assert delete_response.json()["is_active"] is False

    def test_admin_user_management_workflow(self, client, test_user_data, test_admin_data):
        admin_register = client.post("/users/", json=test_admin_data)
        assert admin_register.status_code == 201
        admin_token = _auth_token(client, test_admin_data)
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        user_register = client.post("/users/", json=test_user_data)
        user_id = user_register.json()["id"]

        users_response = client.get("/users/", headers=admin_headers)
        assert users_response.status_code == 200
        assert any(u["id"] == user_id for u in users_response.json())

        update_data = {**test_user_data, "account_type": "admin"}
        update_response = client.put(f"/users/{user_id}", json=update_data, headers=admin_headers)
        assert update_response.status_code == 200
        assert update_response.json()["account_type"] == "admin"

        delete_response = client.delete(f"/users/{user_id}", headers=admin_headers)
        assert delete_response.status_code == 200
        assert delete_response.json()["is_active"] is False

    def test_finger_spelling_workflow(self, client, test_admin_data):
        client.post("/users/", json=test_admin_data)
        admin_headers = {"Authorization": f"Bearer {_auth_token(client, test_admin_data)}"}

        unit, chapter, lesson = _create_admin_curriculum(client, admin_headers)

        unit_response = client.get(f"/api/finger_spelling/units/{unit['id']}")
        assert unit_response.status_code == 200
        assert unit_response.json()["title"] == unit["name_en"]

        chapter_response = client.get(f"/api/finger_spelling/chapters/{chapter['id']}")
        assert chapter_response.status_code == 200
        assert chapter_response.json()["title"] == chapter["name_en"]

        lesson_response = client.get(f"/api/finger_spelling/lessons/{lesson['id']}")
        assert lesson_response.status_code == 200
        assert lesson_response.json()["letter"] == lesson["name_kh"]

        exercises_response = client.get(f"/api/finger_spelling/exercise/chapters/{chapter['id']}")
        assert exercises_response.status_code == 200
        assert isinstance(exercises_response.json(), list)

    def test_error_handling_workflow(self, client, test_user_data):
        invalid_headers = {"Authorization": "Bearer invalid_token"}

        response = client.get("/api/auth/login/me", headers=invalid_headers)
        assert response.status_code == 401

        register_response = client.post("/users/", json=test_user_data)
        assert register_response.status_code == 201

        login_response = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": "wrongpassword"},
        )
        assert login_response.status_code == 401

        response = client.get(f"/users/{uuid.uuid4()}")
        assert response.status_code == 401

        response = client.post(
            "/api/admin/finger/units",
            json={"name_en": "Test", "name_kh": "សាកល្បង", "order_index": 999003},
        )
        assert response.status_code == 401

        response = client.post(
            "/api/admin/finger/units",
            json={},
            headers=invalid_headers,
        )
        assert response.status_code in (401, 422)
