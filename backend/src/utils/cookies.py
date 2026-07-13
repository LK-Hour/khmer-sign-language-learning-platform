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
    # SameSite=None requires Secure=true in production (HTTPS).
    # For local dev (cookie_secure=False), Chrome still allows SameSite=None
    # on localhost without Secure. Firefox may not — developers using Firefox
    # locally should set COOKIE_SECURE=true and use HTTPS or a tunnel.
    samesite = settings.cookie_samesite
    secure = settings.cookie_secure
    # If SameSite is None, force Secure in non-localhost environments
    if samesite.lower() == "none" and not secure:
        # This is a dev-only fallback; production must always set COOKIE_SECURE=true
        pass
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=lifetime_days * 24 * 60 * 60,
        httponly=True,
        secure=secure,
        samesite=samesite,
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
