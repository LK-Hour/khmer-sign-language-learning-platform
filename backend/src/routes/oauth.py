"""
OAuth Routes
Handles authentication endpoints for Google, Facebook, and Telegram
"""

import json
import os
from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException, Request, status
from dataclasses import dataclass
from typing import Optional, Dict
from uuid import uuid4
from fastapi.responses import RedirectResponse

from ..schemas.oauth import (
    OAuthLoginRequest,
    TelegramLoginRequest,
    AuthTokenResponse,
)
from ..services.google_oauth_service import google_oauth_service
from ..services.facebook_oauth_service import facebook_oauth_service
from ..services.telegram_oauth_service import telegram_oauth_service
from ..utils.jwt_utils import create_access_token

router = APIRouter(prefix="/api/auth/login", tags=["auth"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000/test-login")


@dataclass
class MockOAuthUser:
    id: str
    provider: str
    provider_id: str
    email: Optional[str]
    first_name: str
    last_name: Optional[str]
    picture: Optional[str]

    def to_dict(self) -> Dict[str, Optional[str]]:
        return {
            "id": self.id,
            "provider": self.provider,
            "provider_id": self.provider_id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "picture": self.picture,
        }


class MockUserStore:
    def __init__(self) -> None:
        self._users_by_key: Dict[str, MockOAuthUser] = {}

    def create_or_update_user(
        self,
        provider: str,
        provider_id: str,
        email: Optional[str],
        first_name: str,
        last_name: Optional[str],
        picture: Optional[str],
    ) -> MockOAuthUser:
        user_key = f"{provider}:{provider_id}"
        if user_key not in self._users_by_key:
            self._users_by_key[user_key] = MockOAuthUser(
                id=str(uuid4()),
                provider=provider,
                provider_id=provider_id,
                email=email,
                first_name=first_name,
                last_name=last_name,
                picture=picture,
            )
            return self._users_by_key[user_key]

        user = self._users_by_key[user_key]
        user.email = email
        user.first_name = first_name
        user.last_name = last_name
        user.picture = picture
        return user


mock_user_store = MockUserStore()


@router.get("/telegram/auth")
async def telegram_login_redirect(request: Request) -> RedirectResponse:
    """
    Telegram widget redirect endpoint.

    Telegram sends the login payload as query parameters to this URL.
    We verify the payload here, mint our own JWT, and redirect back to the
    frontend test page with the result.
    """
    try:
        query_data = dict(request.query_params)
        token_info = telegram_oauth_service.verify_telegram_auth(query_data)
        user_info = telegram_oauth_service.extract_user_info(token_info)

        user = mock_user_store.create_or_update_user(
            provider="telegram",
            provider_id=user_info["provider_id"],
            email=user_info["email"],
            first_name=user_info["first_name"],
            last_name=user_info["last_name"],
            picture=user_info["picture"],
        )

        access_token = create_access_token(
            data={"sub": user.id, "provider": "telegram"}
        )

        redirect_params = urlencode(
            {
                "token": access_token,
                "provider": "telegram",
                "user": json.dumps(user.to_dict()),
            }
        )
        return RedirectResponse(url=f"{FRONTEND_URL}?{redirect_params}", status_code=302)
    except ValueError as e:
        redirect_params = urlencode({"error": str(e)})
        return RedirectResponse(url=f"{FRONTEND_URL}?{redirect_params}", status_code=302)
    except Exception as e:
        redirect_params = urlencode({"error": f"Telegram login failed: {str(e)}"})
        return RedirectResponse(url=f"{FRONTEND_URL}?{redirect_params}", status_code=302)


@router.post("/google", response_model=AuthTokenResponse)
async def google_login(request: OAuthLoginRequest) -> AuthTokenResponse:
    """
    Google OAuth login endpoint
    
    Accepts Google ID token from frontend
    Verifies token against Google's public keys
    Returns JWT token and user info
    """
    try:
        # Verify Google token
        token_info = google_oauth_service.verify_token(request.code)
        
        # Extract user info
        user_info = google_oauth_service.extract_user_info(token_info)

        # Create or update user in our database (currently using mock store)
        user = mock_user_store.create_or_update_user(
            provider="google",
            provider_id=user_info["provider_id"],
            email=user_info["email"],
            first_name=user_info["first_name"],
            last_name=user_info["last_name"],
            picture=user_info["picture"],
        )
        
        # Generate JWT token
        access_token = create_access_token(
            data={"sub": user.id, "provider": "google"}
        )
        
        return AuthTokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user.to_dict(),
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google login failed: {str(e)}"
        )


@router.post("/facebook", response_model=AuthTokenResponse)
async def facebook_login(request: OAuthLoginRequest) -> AuthTokenResponse:
    """
    Facebook OAuth login endpoint
    
    Accepts Facebook access token from frontend
    Verifies token via Facebook Graph API
    Returns JWT token and user info
    """
    try:
        # Verify Facebook token and get user info
        user_data = facebook_oauth_service.verify_token(request.code)
        
        # Extract user info
        user_info = facebook_oauth_service.extract_user_info(user_data)
        
        # Create or update user in our database (currently using mock store)
        user = mock_user_store.create_or_update_user(
            provider="facebook",
            provider_id=user_info["provider_id"],
            email=user_info["email"],
            first_name=user_info["first_name"],
            last_name=user_info["last_name"],
            picture=user_info["picture"],
        )
        
        # Generate JWT token
        access_token = create_access_token(
            data={"sub": user.id, "provider": "facebook"}
        )
        
        return AuthTokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user.to_dict(),
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Facebook login failed: {str(e)}"
        )


@router.post("/telegram", response_model=AuthTokenResponse)
async def telegram_login(request: TelegramLoginRequest) -> AuthTokenResponse:
    """
    Telegram login endpoint
    
    Accepts Telegram authentication data (either JWT or widget payload).
    Automatically detects the flow and verifies accordingly.
    Returns our own JWT token and user info.
    """
    try:
        # Unified verification - auto-detects flow (JWT vs widget)
        token_info = telegram_oauth_service.verify_telegram_auth(
            request.model_dump(exclude_none=True)
        )
        
        # Extract user info
        user_info = telegram_oauth_service.extract_user_info(token_info)
        
        # Create or update user in our database
        user = mock_user_store.create_or_update_user(
            provider="telegram",
            provider_id=user_info["provider_id"],
            email=user_info["email"],
            first_name=user_info["first_name"],
            last_name=user_info["last_name"],
            picture=user_info["picture"],
        )
        
        # Generate JWT token
        access_token = create_access_token(
            data={"sub": user.id, "provider": "telegram"}
        )
        
        return AuthTokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user.to_dict(),
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Telegram login failed: {str(e)}"
        )
