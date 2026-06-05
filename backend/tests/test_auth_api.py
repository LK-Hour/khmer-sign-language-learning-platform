"""
Authentication API tests
"""
import pytest
from fastapi import status

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
