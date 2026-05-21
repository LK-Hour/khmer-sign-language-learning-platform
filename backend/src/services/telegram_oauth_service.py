"""
Telegram OAuth Service (OpenID Connect)
Handles Telegram login via JWT/JWKS or the Telegram login widget payload
"""

import os
import hashlib
import hmac
import time
import jwt
from typing import Dict, Any
from jwt import PyJWKClient
from fastapi import HTTPException, status

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
# Extract the Bot ID (first part of the token before ':')
TELEGRAM_BOT_ID = TELEGRAM_BOT_TOKEN.split(':')[0] if TELEGRAM_BOT_TOKEN else None

TELEGRAM_JWKS_URL = "https://oauth.telegram.org/.well-known/jwks.json"
jwks_client = PyJWKClient(TELEGRAM_JWKS_URL)

class TelegramOAuthService:
    """Telegram OAuth service supporting JWT and Telegram login widget auth."""
    
    @staticmethod
    def verify_telegram_auth(auth_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Unified verification that auto-detects flow and verifies Telegram auth data.
        
        Supports two flows:
        - Widget auth: has 'hash' field (HMAC-SHA256 verification)
        - JWT auth: has 'code' field (JWKS verification)
        
        Args:
            auth_data: Authentication data from Telegram (either widget or JWT flow)
            
        Returns:
            Verified user data
            
        Raises:
            ValueError: If verification fails or flow cannot be detected
        """
        if not TELEGRAM_BOT_TOKEN or not TELEGRAM_BOT_ID:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Telegram OAuth not configured."
            )
        
        # Auto-detect flow
        if "hash" in auth_data:
            # Widget auth flow (most common for web login widgets)
            return TelegramOAuthService._verify_widget_auth(auth_data)
        elif "code" in auth_data:
            # JWT auth flow (OIDC)
            return TelegramOAuthService._verify_jwt_auth(auth_data["code"])
        else:
            raise ValueError("Invalid Telegram auth data: missing 'hash' or 'code' field")
    
    @staticmethod
    def _verify_jwt_auth(id_token: str) -> Dict[str, Any]:
        """
        Verify Telegram OIDC ID Token using JWKS.
        
        Private method. Use verify_telegram_auth() instead.
        """
        try:
            # 1. Fetch public signing keys from Telegram
            signing_key = jwks_client.get_signing_key_from_jwt(id_token)
            
            # 2. Decode and verify signature, issuer, and audience (Bot ID)
            data = jwt.decode(
                id_token,
                signing_key.key,
                algorithms=["RS256"],
                issuer="https://oauth.telegram.org",
                audience=TELEGRAM_BOT_ID,
                options={"verify_exp": True}
            )
            
            return data
            
        except jwt.ExpiredSignatureError:
            raise ValueError("Telegram ID token has expired")
        except jwt.InvalidTokenError as e:
            raise ValueError(f"Invalid Telegram token: {str(e)}")
        except Exception as e:
            raise ValueError(f"Telegram JWT verification failed: {str(e)}")
    
    @staticmethod
    def _verify_widget_auth(telegram_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify Telegram login widget payload using HMAC-SHA256 hash check.
        
        Private method. Use verify_telegram_auth() instead.
        """
        if not telegram_data.get("hash"):
            raise ValueError("Telegram auth data is missing the hash field")

        auth_date = telegram_data.get("auth_date")
        if auth_date is None:
            raise ValueError("Telegram auth data is missing the auth_date field")

        # Convert auth_date to int if it's a string
        try:
            auth_date = int(auth_date)
        except (ValueError, TypeError):
            raise ValueError("Telegram auth_date must be a valid integer timestamp")

        # Check if auth data is not older than 24 hours
        if int(time.time()) - auth_date > 86400:
            raise ValueError("Telegram auth data has expired")

        # Build data check string (same order as Telegram widget)
        data_check_string = "\n".join(
            f"{key}={value}"
            for key, value in sorted(
                (key, value)
                for key, value in telegram_data.items()
                if key != "hash" and value is not None
            )
        )

        # Compute expected hash
        secret_key = hashlib.sha256(TELEGRAM_BOT_TOKEN.encode()).digest()
        expected_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256,
        ).hexdigest()

        # Compare hashes using constant-time comparison
        if not hmac.compare_digest(expected_hash, str(telegram_data["hash"])):
            raise ValueError("Invalid Telegram auth data signature")

        return telegram_data

    @staticmethod
    def extract_user_info(telegram_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract standardized user information from Telegram claims or widget data."""
        first_name = telegram_data.get("first_name")
        if not first_name:
            first_name = telegram_data.get("name", "Telegram User").split()[0]

        last_name = telegram_data.get("last_name")
        if not last_name and telegram_data.get("name"):
            last_name = " ".join(telegram_data.get("name", "").split()[1:]) or None

        return {
            "provider_id": str(telegram_data.get("sub", telegram_data.get("id"))),
            "email": telegram_data.get("email"), # Not typically provided yet, but future proofing
            "first_name": first_name,
            "last_name": last_name,
            "picture": telegram_data.get("picture", telegram_data.get("photo_url")),
        }

telegram_oauth_service = TelegramOAuthService()
