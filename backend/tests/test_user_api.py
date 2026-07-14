"""
User API tests for the current /users and email-login routes.
"""
import uuid


class TestUserAPI:
    """Test user registration, login, and management."""

    def test_user_registration_success(self, client, test_user_data):
        response = client.post("/api/users/", json=test_user_data)
        assert response.status_code == 201

        data = response.json()
        assert "id" in data
        assert data["username"] == test_user_data["username"]
        assert data["email"] == test_user_data["email"]
        assert data["display_name"] == test_user_data["display_name"]
        assert data["account_type"] == test_user_data["account_type"]
        assert data["is_active"] is True
        assert "created_at" in data
        assert "updated_at" in data
        assert "password" not in data
        assert "password_hash" not in data

    def test_user_registration_duplicate_email(self, client, test_user_data):
        response1 = client.post("/api/users/", json=test_user_data)
        assert response1.status_code == 201

        duplicate_data = {**test_user_data, "username": f"{test_user_data['username']}_2"}
        response2 = client.post("/api/users/", json=duplicate_data)
        assert response2.status_code == 400
        assert "email already registered" in response2.json()["detail"].lower()

    def test_user_registration_duplicate_username(self, client, test_user_data):
        response1 = client.post("/api/users/", json=test_user_data)
        assert response1.status_code == 201

        duplicate_data = {**test_user_data, "email": f"dup_{test_user_data['email']}"}
        response2 = client.post("/api/users/", json=duplicate_data)
        assert response2.status_code == 400
        assert "username already taken" in response2.json()["detail"].lower()

    def test_user_registration_missing_fields(self, client):
        incomplete_data = {
            "email": "test@example.com",
            "password": "password123",
        }
        response = client.post("/api/users/", json=incomplete_data)
        assert response.status_code == 422

    def test_user_login_success(self, client, test_user_data):
        client.post("/api/users/", json=test_user_data)

        response = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": test_user_data["password"]},
        )
        assert response.status_code == 200

        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_user_login_invalid_credentials(self, client, test_user_data):
        client.post("/api/users/", json=test_user_data)

        response = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": "wrongpassword"},
        )
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    def test_get_current_user(self, client, test_user_data, auth_headers):
        response = client.get("/api/auth/login/me", headers=auth_headers)
        assert response.status_code == 200

        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["display_name"] == test_user_data["display_name"]
        assert data["account_type"] == test_user_data["account_type"]

    def test_get_current_user_unauthorized(self, client):
        response = client.get("/api/auth/login/me")
        assert response.status_code == 401

    def test_get_user_list(self, client, test_user_data, test_admin_data):
        client.post("/api/users/", json=test_user_data)
        client.post("/api/users/", json=test_admin_data)
        admin_token = client.post(
            "/api/auth/login/email",
            json={"email": test_admin_data["email"], "password": test_admin_data["password"]},
        ).json()["access_token"]

        response = client.get(
            "/api/users/",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        user = next((u for u in data if u["email"] == test_user_data["email"]), None)
        assert user is not None
        assert user["display_name"] == test_user_data["display_name"]
        assert user["account_type"] == test_user_data["account_type"]

    def test_get_user_by_id(self, client, test_user_data):
        register_response = client.post("/api/users/", json=test_user_data)
        user_id = register_response.json()["id"]
        token = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": test_user_data["password"]},
        ).json()["access_token"]

        response = client.get(
            f"/api/users/{user_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200

        data = response.json()
        assert data["id"] == str(user_id)
        assert data["email"] == test_user_data["email"]
        assert data["display_name"] == test_user_data["display_name"]

    def test_get_user_by_id_not_found(self, client, test_admin_data):
        client.post("/api/users/", json=test_admin_data)
        admin_token = client.post(
            "/api/auth/login/email",
            json={"email": test_admin_data["email"], "password": test_admin_data["password"]},
        ).json()["access_token"]

        response = client.get(
            f"/api/users/{uuid.uuid4()}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404

    def test_update_user_self(self, client, test_user_data):
        register_response = client.post("/api/users/", json=test_user_data)
        user_id = register_response.json()["id"]
        token = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": test_user_data["password"]},
        ).json()["access_token"]

        update_data = {
            **test_user_data,
            "display_name": "Updated Name",
            "email": "updated_self@example.com",
        }
        response = client.put(
            f"/api/users/{user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200

        data = response.json()
        assert data["display_name"] == "Updated Name"
        assert data["email"] == "updated_self@example.com"

    def test_update_user_as_admin(self, client, test_user_data, test_admin_data):
        admin_response = client.post("/api/users/", json=test_admin_data)
        assert admin_response.status_code == 201
        admin_token = client.post(
            "/api/auth/login/email",
            json={"email": test_admin_data["email"], "password": test_admin_data["password"]},
        ).json()["access_token"]

        user_response = client.post("/api/users/", json=test_user_data)
        user_id = user_response.json()["id"]

        update_data = {**test_user_data, "display_name": "Admin Updated Name", "account_type": "admin"}
        response = client.put(
            f"/api/users/{user_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200

        data = response.json()
        assert data["display_name"] == "Admin Updated Name"
        assert data["account_type"] == "admin"

    def test_update_user_unauthorized(self, client, test_user_data, test_admin_data):
        user1_response = client.post("/api/users/", json=test_user_data)
        assert user1_response.status_code == 201
        user1_token = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": test_user_data["password"]},
        ).json()["access_token"]

        user2_data = {**test_admin_data, "account_type": "student"}
        user2_response = client.post("/api/users/", json=user2_data)
        user2_id = user2_response.json()["id"]

        update_data = {**user2_data, "display_name": "Blocked Update"}
        response = client.put(
            f"/api/users/{user2_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {user1_token}"},
        )
        assert response.status_code == 403

    def test_delete_user_self(self, client, test_user_data):
        register_response = client.post("/api/users/", json=test_user_data)
        user_id = register_response.json()["id"]
        token = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": test_user_data["password"]},
        ).json()["access_token"]

        response = client.delete(f"/api/users/{user_id}", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["is_active"] is False

    def test_delete_user_as_admin(self, client, test_user_data, test_admin_data):
        client.post("/api/users/", json=test_admin_data)
        admin_token = client.post(
            "/api/auth/login/email",
            json={"email": test_admin_data["email"], "password": test_admin_data["password"]},
        ).json()["access_token"]

        user_response = client.post("/api/users/", json=test_user_data)
        user_id = user_response.json()["id"]

        response = client.delete(f"/api/users/{user_id}", headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        assert response.json()["is_active"] is False

    def test_delete_user_unauthorized(self, client, test_user_data, test_admin_data):
        client.post("/api/users/", json=test_user_data)
        user_token = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": test_user_data["password"]},
        ).json()["access_token"]

        user2_data = {**test_admin_data, "account_type": "student"}
        user2_response = client.post("/api/users/", json=user2_data)
        user2_id = user2_response.json()["id"]

        response = client.delete(f"/api/users/{user2_id}", headers={"Authorization": f"Bearer {user_token}"})
        assert response.status_code == 403
