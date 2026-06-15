"""
Authentication API tests
"""
import pytest
from fastapi import status
from src.models.finger_spelling import FingerChapter, FingerLesson, FingerUnit, FingerUserLessonProgress
from src.models.refresh_token import RefreshToken

class TestAuthAPI:
    """Test authentication endpoints"""
    
    def test_login_success(self, client, test_user_data):
        """Test successful login"""
        # Register user first
        client.post("/users/", json=test_user_data)
        
        # Login
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        response = client.post("/api/auth/login/email", json=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert "refresh_token" not in data
        assert "refresh_token=" in response.headers.get("set-cookie", "")

    def test_refresh_rotates_token_and_logout_revokes(self, client, db, test_user_data):
        client.post("/users/", json=test_user_data)
        login_response = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": test_user_data["password"]},
        )
        assert login_response.status_code == 200

        first_cookie = login_response.cookies.get("refresh_token")
        assert first_cookie
        assert db.query(RefreshToken).filter(RefreshToken.revoked.is_(False)).count() == 1

        refresh_response = client.post(
            "/api/auth/refresh",
            headers={"X-Requested-With": "KSL-Client"},
        )
        assert refresh_response.status_code == 200
        assert "access_token" in refresh_response.json()
        second_cookie = refresh_response.cookies.get("refresh_token")
        assert second_cookie
        assert second_cookie != first_cookie
        assert db.query(RefreshToken).filter(RefreshToken.revoked.is_(False)).count() == 1
        assert db.query(RefreshToken).filter(RefreshToken.revoked.is_(True)).count() == 1

        logout_response = client.post(
            "/api/auth/logout",
            headers={"X-Requested-With": "KSL-Client"},
        )
        assert logout_response.status_code == 200
        assert db.query(RefreshToken).filter(RefreshToken.revoked.is_(False)).count() == 0

    def test_refresh_reuse_detection_revokes_all_tokens(self, client, db, test_user_data):
        client.post("/users/", json=test_user_data)
        login_response = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": test_user_data["password"]},
        )
        stolen_cookie = login_response.cookies.get("refresh_token")

        refresh_response = client.post(
            "/api/auth/refresh",
            headers={"X-Requested-With": "KSL-Client"},
        )
        assert refresh_response.status_code == 200

        client.cookies.set("refresh_token", stolen_cookie)
        reuse_response = client.post(
            "/api/auth/refresh",
            headers={"X-Requested-With": "KSL-Client"},
        )
        assert reuse_response.status_code == 401
        assert db.query(RefreshToken).filter(RefreshToken.revoked.is_(False)).count() == 0

    def test_admin_remember_me_uses_three_day_refresh_lifetime(self, client, db, test_admin_data):
        client.post("/users/", json=test_admin_data)
        response = client.post(
            "/api/auth/login/email",
            json={
                "email": test_admin_data["email"],
                "password": test_admin_data["password"],
                "remember_me": True,
            },
        )
        assert response.status_code == 200
        assert "Max-Age=259200" in response.headers.get("set-cookie", "")
        token = db.query(RefreshToken).one()
        assert token.lifetime_days == 3
    
    def test_login_invalid_credentials(self, client, test_user_data):
        """Test login with invalid credentials"""
        # Register user first
        client.post("/users/", json=test_user_data)
        
        # Try wrong password
        login_data = {
            "email": test_user_data["email"],
            "password": "wrongpassword"
        }
        response = client.post("/api/auth/login/email", json=login_data)
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "password123"
        }
        response = client.post("/api/auth/login/email", json=login_data)
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    def test_login_missing_fields(self, client):
        """Test login with missing fields"""
        login_data = {
            "email": "test@example.com"
            # Missing password
        }
        response = client.post("/api/auth/login/email", json=login_data)
        assert response.status_code == 422
    
    def test_get_current_user_success(self, client, test_user_data, auth_headers):
        """Test getting current user with valid token"""
        response = client.get("/api/auth/login/me", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert data["display_name"] == test_user_data["display_name"]
        assert data["account_type"] == test_user_data["account_type"]
        assert data["is_active"] is True
    
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/auth/login/me", headers=headers)
        assert response.status_code == 401
    
    def test_get_current_user_no_token(self, client):
        """Test getting current user without token"""
        response = client.get("/api/auth/login/me")
        assert response.status_code == 401
    
    def test_token_expiry_simulation(self, client, test_user_data):
        """Test token expiry behavior (simulated)"""
        # Register and login
        client.post("/users/", json=test_user_data)
        
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        login_response = client.post("/api/auth/login/email", json=login_data)
        token = login_response.json()["access_token"]
        
        # Use token to access protected endpoint
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/auth/login/me", headers=headers)
        assert response.status_code == 200
        
        # Note: Actual token expiry testing would require mocking JWT expiry
        # This test just verifies the token works initially

    def test_import_guest_progress_merges_and_validates_lessons(self, client, db, test_user_data):
        client.post("/users/", json=test_user_data)
        login_response = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": test_user_data["password"]},
        )
        token = login_response.json()["access_token"]

        unit = FingerUnit(id=9001, name_en="Unit", name_kh="Unit", order_index=9001)
        chapter = FingerChapter(id=9001, unit_id=9001, name_en="Chapter", name_kh="Chapter", order_index=1)
        lesson = FingerLesson(id=9001, chapter_id=9001, name_en="Lesson", name_kh="Lesson", order_index=1)
        db.add_all([unit, chapter, lesson])
        db.commit()

        response = client.post(
            "/api/auth/import-guest-progress",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "lessons": [
                    {
                        "lesson_id": 9001,
                        "is_completed": True,
                        "attempts": 2,
                        "peak_accuracy": 88,
                        "total_time_spent": 120,
                    },
                    {"lesson_id": 999999, "is_completed": True},
                ],
                "practice_summaries": [
                    {
                        "lesson_id": 9001,
                        "attempts": 1,
                        "best_accuracy": 91,
                        "total_time_spent": 30,
                    }
                ],
            },
        )

        assert response.status_code == 200
        assert response.json() == {"imported_lessons": 2, "skipped_lessons": 1}
        progress = db.query(FingerUserLessonProgress).filter(
            FingerUserLessonProgress.finger_lesson_id == 9001
        ).one()
        assert progress.is_completed is True
        assert progress.attempts == 3
        assert int(progress.total_time_spent) == 150
        assert float(progress.peak_accuracy) == 91.0
