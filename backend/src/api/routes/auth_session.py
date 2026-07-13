"""Refresh-token session routes."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from src.api.deps import get_current_user, get_db
from src.core.config import settings
from src.models.user import User
from src.schemas.oauth import AccessTokenResponse, GuestProgressImportRequest, GuestProgressImportResponse
from src.services.oauth_user_service import import_local_guest_progress
from src.utils.cookies import REFRESH_COOKIE_NAME, clear_refresh_cookie, set_refresh_cookie
from src.utils.jwt_utils import create_access_token
from src.utils.refresh_tokens import (
    create_refresh_token,
    revoke_all_user_refresh_tokens,
    revoke_refresh_token,
    validate_refresh_token,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
CSRF_HEADER = "X-Requested-With"


def _require_csrf(value: str | None) -> None:
    if value != settings.csrf_header_value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing CSRF header")


def _client_ip(request: Request) -> str | None:
    if request.client is None:
        return None
    return request.client.host


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh_access_token(
    request: Request,
    response: Response,
    x_requested_with: str | None = Header(default=None, alias=CSRF_HEADER),
    db: Session = Depends(get_db),
) -> AccessTokenResponse:
    _require_csrf(x_requested_with)
    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token cookie")

    try:
        old_record = validate_refresh_token(db, refresh_token)
        user = old_record.user
        if user is None or not user.is_active:
            old_record.revoked = True
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
        old_record.revoked = True
        old_record.last_used_at = datetime.now(timezone.utc)
        new_refresh_token = create_refresh_token(
            db,
            user_id=old_record.user_id,
            expires_in_days=old_record.lifetime_days,
            user_agent=request.headers.get("user-agent"),
            last_ip=_client_ip(request),
        )
        access_token = create_access_token(data={"sub": str(user.id), "provider": user.auth_provider})
        set_refresh_cookie(response, new_refresh_token, settings, max_age_days=old_record.lifetime_days)
        db.commit()
        return AccessTokenResponse(access_token=access_token, token_type="bearer")
    except HTTPException:
        db.commit()
        raise


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    x_requested_with: str | None = Header(default=None, alias=CSRF_HEADER),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    _require_csrf(x_requested_with)
    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if refresh_token:
        revoke_refresh_token(db, refresh_token)
        db.commit()
    clear_refresh_cookie(response, settings)
    return {"detail": "Logged out successfully"}


@router.post("/logout-all")
def logout_all_devices(
    x_requested_with: str | None = Header(default=None, alias=CSRF_HEADER),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    _require_csrf(x_requested_with)
    revoke_all_user_refresh_tokens(db, user.id)
    db.commit()
    return {"detail": "All sessions revoked"}


@router.post("/import-guest-progress", response_model=GuestProgressImportResponse)
def import_guest_progress(
    payload: GuestProgressImportRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GuestProgressImportResponse:
    imported, skipped, imported_chapter_practices, imported_unit_exercises = (
        import_local_guest_progress(db, target_user_id=user.id, payload=payload)
    )
    return GuestProgressImportResponse(
        imported_lessons=imported,
        skipped_lessons=skipped,
        imported_chapter_practices=imported_chapter_practices,
        imported_unit_exercises=imported_unit_exercises,
    )
