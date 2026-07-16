"""
Authentication API tests
"""
import pytest
from fastapi import status
from src.models.finger_spelling import FingerChapter, FingerLesson, FingerUnit, FingerUserLessonProgress
from src.models.refresh_token import RefreshToken
from src.models.user import User

class TestAuthAPI:
    """Test authentication endpoints"""
    
    def test_login_success(self, client, test_user_data, seed_user):
        """Test successful login"""
        # Register user first
        seed_user(test_user_data)
        
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

    def test_refresh_rotates_token_and_logout_revokes(self, client, db, test_user_data, seed_user):
        seed_user(test_user_data)
        login_response = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": test_user_data["password"]},
        )
        assert login_response.status_code == 200

        first_cookie = login_response.cookies.get("refresh_token")
        assert first_cookie
        user = db.query(User).filter(User.email == test_user_data["email"]).one()
        user_tokens = db.query(RefreshToken).filter(RefreshToken.user_id == user.id)
        assert user_tokens.filter(RefreshToken.revoked.is_(False)).count() == 1

        refresh_response = client.post(
            "/api/auth/refresh",
            headers={"X-Requested-With": "KSL-Client"},
        )
        assert refresh_response.status_code == 200
        assert "access_token" in refresh_response.json()
        second_cookie = refresh_response.cookies.get("refresh_token")
        assert second_cookie
        assert second_cookie != first_cookie
        assert user_tokens.filter(RefreshToken.revoked.is_(False)).count() == 1
        assert user_tokens.filter(RefreshToken.revoked.is_(True)).count() == 1

        logout_response = client.post(
            "/api/auth/logout",
            headers={"X-Requested-With": "KSL-Client"},
        )
        assert logout_response.status_code == 200
        assert user_tokens.filter(RefreshToken.revoked.is_(False)).count() == 0

    def test_refresh_reuse_detection_revokes_all_tokens(self, client, db, test_user_data, seed_user):
        """Reuse outside the grace period revokes all sessions.

        Within the 10-second grace window a reused token is tolerated (race
        condition between browser tabs). We patch the grace period to 0 so
        the test exercises the revoke-all path without sleeping.
        """
        from unittest.mock import patch

        seed_user(test_user_data)
        login_response = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": test_user_data["password"]},
        )
        stolen_cookie = login_response.cookies.get("refresh_token")
        user = db.query(User).filter(User.email == test_user_data["email"]).one()
        user_tokens = db.query(RefreshToken).filter(RefreshToken.user_id == user.id)

        refresh_response = client.post(
            "/api/auth/refresh",
            headers={"X-Requested-With": "KSL-Client"},
        )
        assert refresh_response.status_code == 200

        # Simulate reuse OUTSIDE the grace period (set grace to 0 seconds)
        client.cookies.set("refresh_token", stolen_cookie)
        with patch("src.utils.refresh_tokens.REUSE_GRACE_PERIOD_SECONDS", 0):
            reuse_response = client.post(
                "/api/auth/refresh",
                headers={"X-Requested-With": "KSL-Client"},
            )
        assert reuse_response.status_code == 401
        assert user_tokens.filter(RefreshToken.revoked.is_(False)).count() == 0

    def test_refresh_reuse_within_grace_period_is_tolerated(self, client, db, test_user_data, seed_user):
        """Reuse within the grace period (race condition) returns 200 instead of revoking."""
        seed_user(test_user_data)
        login_response = client.post(
            "/api/auth/login/email",
            json={"email": test_user_data["email"], "password": test_user_data["password"]},
        )
        stolen_cookie = login_response.cookies.get("refresh_token")
        user = db.query(User).filter(User.email == test_user_data["email"]).one()
        user_tokens = db.query(RefreshToken).filter(RefreshToken.user_id == user.id)

        # First refresh rotates the token
        refresh_response = client.post(
            "/api/auth/refresh",
            headers={"X-Requested-With": "KSL-Client"},
        )
        assert refresh_response.status_code == 200

        # Immediate reuse (within 10s grace period) — should succeed
        client.cookies.set("refresh_token", stolen_cookie)
        reuse_response = client.post(
            "/api/auth/refresh",
            headers={"X-Requested-With": "KSL-Client"},
        )
        assert reuse_response.status_code == 200
        # At least one non-revoked token remains
        assert user_tokens.filter(RefreshToken.revoked.is_(False)).count() >= 1

    def test_admin_remember_me_uses_three_day_refresh_lifetime(self, client, db, test_admin_data, seed_user):
        seed_user(test_admin_data)
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
        user = db.query(User).filter(User.email == test_admin_data["email"]).one()
        token = db.query(RefreshToken).filter(RefreshToken.user_id == user.id).one()
        assert token.lifetime_days == 3
    
    def test_login_invalid_credentials(self, client, test_user_data, seed_user):
        """Test login with invalid credentials"""
        # Register user first
        seed_user(test_user_data)
        
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
    
    def test_token_expiry_simulation(self, client, test_user_data, seed_user):
        """Test token expiry behavior (simulated)"""
        # Register and login
        seed_user(test_user_data)
        
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

    def test_import_guest_progress_merges_and_validates_lessons(self, client, db, test_user_data, seed_user):
        seed_user(test_user_data)
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
                        "attempt_count": 2,
                    },
                    {"lesson_id": 999999, "is_completed": True},
                ],
                "practice_summaries": [
                    {
                        "lesson_id": 9001,
                        "attempt_count": 1,
                        "completed_at": "2026-06-03T10:00:00",
                    }
                ],
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["imported_lessons"] == 2
        assert body["skipped_lessons"] == 1
        assert body.get("imported_chapter_practices", 0) == 0
        assert body.get("imported_unit_exercises", 0) == 0
        progress = db.query(FingerUserLessonProgress).filter(
            FingerUserLessonProgress.finger_lesson_id == 9001
        ).one()
        assert progress.is_completed is True
        assert progress.attempts == 3
