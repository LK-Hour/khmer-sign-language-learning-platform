"""
Telegram OAuth Service
Supports both:
- OIDC ID token validation (new flow): https://core.telegram.org/bots/telegram-login#validating-id-tokens
- Legacy widget hash verification (redirect flow)
"""

import os
import hashlib
import hmac
import time
from typing import Dict, Any

import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, status

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_BOT_ID = TELEGRAM_BOT_TOKEN.split(":")[0] if TELEGRAM_BOT_TOKEN else None

TELEGRAM_JWKS_URL = "https://oauth.telegram.org/.well-known/jwks.json"
jwks_client = PyJWKClient(TELEGRAM_JWKS_URL)


class TelegramOAuthService:
    """Telegram auth service — supports OIDC JWT and legacy widget flows."""

    @staticmethod
    def verify_id_token(id_token: str) -> Dict[str, Any]:
        """
        Validate a Telegram OIDC ID token (JWT):
        1. Fetch public keys from JWKS endpoint
        2. Verify RS256 signature
        3. Verify claims: iss, aud (Bot ID), exp
        """
        if not TELEGRAM_BOT_ID:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Telegram OAuth not configured",
            )

        try:
            signing_key = jwks_client.get_signing_key_from_jwt(id_token)
            payload = jwt.decode(
                id_token,
                signing_key.key,
                algorithms=["RS256"],
                issuer="https://oauth.telegram.org",
                audience=TELEGRAM_BOT_ID,
                options={"verify_exp": True},
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Telegram ID token has expired")
        except jwt.InvalidTokenError as e:
            raise ValueError(f"Invalid Telegram ID token: {e}")

    @staticmethod
    def verify_widget_auth(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify Telegram Login Widget payload (HMAC-SHA256).
        Used when Telegram redirects with query params including a 'hash'.
        """
        if not TELEGRAM_BOT_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Telegram OAuth not configured",
            )

        received_hash = data.get("hash")
        if not received_hash:
            raise ValueError("Missing hash in Telegram auth data")

        auth_date = data.get("auth_date")
        if auth_date is None:
            raise ValueError("Missing auth_date in Telegram auth data")

        # Check expiry (24 hours)
        if time.time() - int(auth_date) > 86400:
            raise ValueError("Telegram auth data has expired")

        # Build check string: sorted key=value pairs, excluding hash
        check_string = "\n".join(
            f"{k}={v}" for k, v in sorted(data.items())
            if k != "hash" and v is not None
        )

        secret_key = hashlib.sha256(TELEGRAM_BOT_TOKEN.encode()).digest()
        computed_hash = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(computed_hash, received_hash):
            raise ValueError("Invalid Telegram auth hash")

        return data

    @staticmethod
    def extract_user_info(claims: Dict[str, Any]) -> Dict[str, Any]:
        """Extract user info from either OIDC claims or widget data."""
        # OIDC uses "name", widget uses "first_name"/"last_name"
        first_name = claims.get("first_name")
        last_name = claims.get("last_name")

        if not first_name:
            name = claims.get("name", "Telegram User")
            parts = name.split(" ", 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else None

        return {
            "provider_id": str(claims.get("sub", claims.get("id"))),
            "email": None,
            "first_name": first_name,
            "last_name": last_name,
            "picture": claims.get("picture", claims.get("photo_url")),
            "username": claims.get("preferred_username", claims.get("username")),
        }


telegram_oauth_service = TelegramOAuthService()
