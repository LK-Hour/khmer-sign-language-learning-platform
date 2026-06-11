"""
OAuth Routes
Handles authentication endpoints for Google, Facebook, and Telegram
"""

import json
import uuid
from urllib.parse import urlencode, urlparse

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from src.api.deps import get_db
from src.api.deps import get_current_user
from src.core.config import settings
from src.schemas.oauth import OAuthLoginRequest, AuthTokenResponse, EmailLoginRequest
from src.schemas.user import UserResponse
from src.services.google_oauth_service import google_oauth_service
from src.services.facebook_oauth_service import facebook_oauth_service
from src.services.telegram_oauth_service import telegram_oauth_service
from src.services.oauth_user_service import find_or_create_oauth_user, migrate_guest_progress_to_user
from src.models.user import User
from src.utils.jwt_utils import create_access_token, verify_token
from src.utils.password import verify_password

router = APIRouter(prefix="/api/auth/login", tags=["auth"])
FRONTEND_URL = settings.frontend_url
TELEGRAM_REDIRECT_PARAM = "redirect_to"


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


def _extract_guest_user_id_from_token(guest_token: str | None) -> uuid.UUID | None:
    if not guest_token:
        return None
    try:
        payload = verify_token(guest_token)
    except HTTPException:
        return None

    provider = payload.get("provider")
    sub = payload.get("sub")
    if provider != "guest" or not sub:
        return None
    try:
        return uuid.UUID(str(sub))
    except ValueError:
        return None


def _origin(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def _telegram_redirect_url(request: Request) -> str:
    redirect_to = request.query_params.get(TELEGRAM_REDIRECT_PARAM)
    if not redirect_to:
        return FRONTEND_URL

    allowed_origins = set(settings.allowed_origins)
    allowed_origins.add(_origin(FRONTEND_URL))

    try:
        if _origin(redirect_to) in allowed_origins:
            return redirect_to
    except Exception:
        pass

    return FRONTEND_URL


def _redirect_with_params(url: str, params: dict[str, str]) -> RedirectResponse:
    separator = "&" if "?" in url else "?"
    return RedirectResponse(url=f"{url}{separator}{urlencode(params)}", status_code=302)


@router.get("/telegram")
def telegram_widget_redirect(request: Request, db: Session = Depends(get_db)):
    """
    Telegram Login Widget redirect endpoint.
    Telegram sends user data as query params with HMAC hash.
    We verify, create/find user, mint JWT, and redirect to frontend.
    """
    redirect_url = _telegram_redirect_url(request)

    try:
        query_data = {
            key: value
            for key, value in dict(request.query_params).items()
            if key != TELEGRAM_REDIRECT_PARAM
        }
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

        redirect_params = {
            "token": access_token,
            "provider": "telegram",
            "user": json.dumps(_user_response(user)),
        }
        return _redirect_with_params(redirect_url, redirect_params)
    except ValueError as e:
        return _redirect_with_params(redirect_url, {"error": str(e)})
    except Exception as e:
        return _redirect_with_params(redirect_url, {"error": f"Telegram login failed: {e}"})


@router.post("/google", response_model=AuthTokenResponse)
def google_login(request: OAuthLoginRequest, db: Session = Depends(get_db)):
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
        guest_user_id = _extract_guest_user_id_from_token(request.guest_token)
        if guest_user_id is not None:
            migrate_guest_progress_to_user(
                db,
                guest_user_id=guest_user_id,
                target_user_id=user.id,
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
def facebook_login(request: OAuthLoginRequest, db: Session = Depends(get_db)):
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
        guest_user_id = _extract_guest_user_id_from_token(request.guest_token)
        if guest_user_id is not None:
            migrate_guest_progress_to_user(
                db,
                guest_user_id=guest_user_id,
                target_user_id=user.id,
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
def telegram_login(request: OAuthLoginRequest, db: Session = Depends(get_db)):
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
        guest_user_id = _extract_guest_user_id_from_token(request.guest_token)
        if guest_user_id is not None:
            migrate_guest_progress_to_user(
                db,
                guest_user_id=guest_user_id,
                target_user_id=user.id,
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
def guest_login(db: Session = Depends(get_db)):
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
def email_login(request: EmailLoginRequest, db: Session = Depends(get_db)):
    """Email/password login. Body: {"email": "...", "password": "..."}"""
    user = (
        db.query(User)
        .filter(User.email == request.email, User.is_active.is_(True))
        .first()
    )
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": str(user.id), "provider": "email", "account_type": user.account_type}
    )
    return AuthTokenResponse(access_token=access_token, token_type="bearer", user=_user_response(user))


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get current authenticated user's profile."""
    return UserResponse.model_validate(current_user)
