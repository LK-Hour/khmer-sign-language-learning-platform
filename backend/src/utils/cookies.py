"""Cookie helpers for refresh-token sessions."""

from __future__ import annotations

from fastapi import Response

from src.core.config import Settings

REFRESH_COOKIE_NAME = "refresh_token"
REFRESH_COOKIE_PATH = "/api/auth"


def set_refresh_cookie(
    response: Response,
    refresh_token: str,
    settings: Settings,
    *,
    max_age_days: int | None = None,
) -> None:
    lifetime_days = max_age_days or settings.refresh_token_expire_days
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=lifetime_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain,
        path=REFRESH_COOKIE_PATH,
    )


def clear_refresh_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        domain=settings.cookie_domain,
        path=REFRESH_COOKIE_PATH,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )
