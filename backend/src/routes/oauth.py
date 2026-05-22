"""
OAuth Routes
Handles authentication endpoints for Google, Facebook, and Telegram
"""

import json
import os
import uuid
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from ..db.session import get_db
from ..schemas.oauth import OAuthLoginRequest, AuthTokenResponse
from ..services.google_oauth_service import google_oauth_service
from ..services.facebook_oauth_service import facebook_oauth_service
from ..services.telegram_oauth_service import telegram_oauth_service
from ..services.oauth_user_service import find_or_create_oauth_user
from ..models.user import User
from ..utils.jwt_utils import create_access_token
from ..utils.password import verify_password

router = APIRouter(prefix="/api/auth/login", tags=["auth"])
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _user_response(user) -> dict:
    """Convert User model to OAuth response dict."""
    name_parts = user.display_name.split(" ", 1)
    return {
        "id": str(user.id),
        "provider": user.auth_provider,
        "provider_id": str(user.id),
        "email": user.email,
        "first_name": name_parts[0],
        "last_name": name_parts[1] if len(name_parts) > 1 else None,
        "picture": user.avatar_url,
    }


@router.get("/telegram")
async def telegram_widget_redirect(request: Request, db: Session = Depends(get_db)):
    """
    Telegram Login Widget redirect endpoint.
    Telegram sends user data as query params with HMAC hash.
    We verify, create/find user, mint JWT, and redirect to frontend.
    """
    try:
        query_data = dict(request.query_params)
        verified_data = telegram_oauth_service.verify_widget_auth(query_data)
        user_info = telegram_oauth_service.extract_user_info(verified_data)

        user = find_or_create_oauth_user(
            db=db,
            provider="telegram",
            provider_id=user_info["provider_id"],
            email=user_info["email"],
            first_name=user_info["first_name"],
            last_name=user_info["last_name"],
            picture=user_info["picture"],
        )

        access_token = create_access_token(
            data={"sub": str(user.id), "provider": "telegram"}
        )

        redirect_params = urlencode({
            "token": access_token,
            "provider": "telegram",
            "user": json.dumps(_user_response(user)),
        })
        return RedirectResponse(url=f"{FRONTEND_URL}?{redirect_params}", status_code=302)
    except ValueError as e:
        redirect_params = urlencode({"error": str(e)})
        return RedirectResponse(url=f"{FRONTEND_URL}?{redirect_params}", status_code=302)
    except Exception as e:
        redirect_params = urlencode({"error": f"Telegram login failed: {e}"})
        return RedirectResponse(url=f"{FRONTEND_URL}?{redirect_params}", status_code=302)


@router.post("/google", response_model=AuthTokenResponse)
async def google_login(request: OAuthLoginRequest, db: Session = Depends(get_db)):
    """Google OAuth login — verifies ID token, creates/finds user, returns JWT."""
    try:
        token_info = google_oauth_service.verify_token(request.code)
        user_info = google_oauth_service.extract_user_info(token_info)

        user = find_or_create_oauth_user(
            db=db,
            provider="google",
            provider_id=user_info["provider_id"],
            email=user_info["email"],
            first_name=user_info["first_name"],
            last_name=user_info["last_name"],
            picture=user_info["picture"],
        )

        access_token = create_access_token(
            data={"sub": str(user.id), "provider": "google"}
        )
        return AuthTokenResponse(access_token=access_token, token_type="bearer", user=_user_response(user))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Google login failed: {e}")


@router.post("/facebook", response_model=AuthTokenResponse)
async def facebook_login(request: OAuthLoginRequest, db: Session = Depends(get_db)):
    """Facebook OAuth login — verifies access token, creates/finds user, returns JWT."""
    try:
        user_data = facebook_oauth_service.verify_token(request.code)
        user_info = facebook_oauth_service.extract_user_info(user_data)

        user = find_or_create_oauth_user(
            db=db,
            provider="facebook",
            provider_id=user_info["provider_id"],
            email=user_info["email"],
            first_name=user_info["first_name"],
            last_name=user_info["last_name"],
            picture=user_info["picture"],
        )

        access_token = create_access_token(
            data={"sub": str(user.id), "provider": "facebook"}
        )
        return AuthTokenResponse(access_token=access_token, token_type="bearer", user=_user_response(user))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Facebook login failed: {e}")


@router.post("/telegram", response_model=AuthTokenResponse)
async def telegram_login(request: OAuthLoginRequest, db: Session = Depends(get_db)):
    """
    Telegram OIDC login.
    Accepts the id_token JWT from Telegram's login library, validates it
    per https://core.telegram.org/bots/telegram-login#validating-id-tokens
    """
    try:
        claims = telegram_oauth_service.verify_id_token(request.code)
        user_info = telegram_oauth_service.extract_user_info(claims)

        user = find_or_create_oauth_user(
            db=db,
            provider="telegram",
            provider_id=user_info["provider_id"],
            email=user_info["email"],
            first_name=user_info["first_name"],
            last_name=user_info["last_name"],
            picture=user_info["picture"],
        )

        access_token = create_access_token(
            data={"sub": str(user.id), "provider": "telegram"}
        )
        return AuthTokenResponse(access_token=access_token, token_type="bearer", user=_user_response(user))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Telegram login failed: {e}")


@router.post("/guest", response_model=AuthTokenResponse)
async def guest_login(db: Session = Depends(get_db)):
    """Create a guest user and return JWT. Persisted in database."""
    guest_id = str(uuid.uuid4())[:8]
    user = User(
        username=f"guest_{guest_id}",
        display_name=f"Guest {guest_id}",
        account_type="student",
        auth_provider="guest",
        is_guest=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(
        data={"sub": str(user.id), "provider": "guest"}
    )
    return AuthTokenResponse(access_token=access_token, token_type="bearer", user=_user_response(user))


@router.post("/email", response_model=AuthTokenResponse)
async def email_login(request: Request, db: Session = Depends(get_db)):
    """Email/password login. Body: {"email": "...", "password": "..."}"""
    body = await request.json()
    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    user = db.query(User).filter(User.email == email).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": str(user.id), "provider": "email", "account_type": user.account_type}
    )
    return AuthTokenResponse(access_token=access_token, token_type="bearer", user=_user_response(user))
