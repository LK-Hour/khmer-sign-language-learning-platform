"""
Google OAuth Service
Handles Google OAuth token verification and user extraction
"""

import os
from typing import Dict, Any
from fastapi import HTTPException, status
from google.auth.transport import requests
from google.oauth2 import id_token

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


class GoogleOAuthService:
    """Google OAuth service for token verification and user data extraction"""
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """
        Verify Google ID token against Google's public keys
        
        Args:
            token: Google ID token from frontend
            
        Returns:
            Token info including user data
            
        Raises:
            HTTPException: If token is invalid or verification fails
        """
        if not GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GOOGLE_CLIENT_ID not configured"
            )
        
        try:
            # Verify the token against Google's public keys
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
            
            # Verify token hasn't been revoked
            if idinfo.get("aud") != GOOGLE_CLIENT_ID:
                raise ValueError("Token audience mismatch")
                
            return idinfo
            
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Google token verification failed: {str(e)}"
            )
    
    @staticmethod
    def extract_user_info(token_info: Dict[str, Any]) -> Dict[str, Any]:
        """Extract user information from Google token"""
        name_parts = token_info.get("name", "User").split(" ", 1)
        
        return {
            "provider_id": token_info.get("sub"),
            "email": token_info.get("email"),
            "first_name": name_parts[0] if name_parts else "User",
            "last_name": name_parts[1] if len(name_parts) > 1 else None,
            "picture": token_info.get("picture"),
        }


google_oauth_service = GoogleOAuthService()
