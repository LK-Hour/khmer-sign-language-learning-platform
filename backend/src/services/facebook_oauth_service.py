"""
Facebook OAuth Service
Handles Facebook OAuth token verification and user extraction
"""

import os
import requests
from typing import Dict, Any
from fastapi import HTTPException, status

# Facebook OAuth Configuration
FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET")
FACEBOOK_API_VERSION = "v18.0"


class FacebookOAuthService:
    """Facebook OAuth service for token verification and user data extraction"""
    
    @staticmethod
    def verify_token(token: str) -> Dict[str, Any]:
        """
        Verify Facebook access token and get user info from Graph API
        
        Args:
            token: Facebook access token from frontend
            
        Returns:
            User info from Facebook Graph API
            
        Raises:
            HTTPException: If token is invalid or API call fails
        """
        if not FACEBOOK_APP_ID or not FACEBOOK_APP_SECRET:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Facebook OAuth not configured"
            )
        
        try:
            # First verify the token is valid
            token_debug_url = f"https://graph.facebook.com/{FACEBOOK_API_VERSION}/debug_token"
            debug_params = {
                "input_token": token,
                "access_token": f"{FACEBOOK_APP_ID}|{FACEBOOK_APP_SECRET}"
            }
            
            debug_response = requests.get(token_debug_url, params=debug_params, timeout=5)
            debug_response.raise_for_status()
            debug_data = debug_response.json()
            
            if not debug_data.get("data", {}).get("is_valid"):
                raise ValueError("Token is not valid")
            
            # Get user info from Graph API
            user_info_url = f"https://graph.facebook.com/{FACEBOOK_API_VERSION}/me"
            params = {
                "access_token": token,
                "fields": "id,name,email,picture.type(large)",
            }
            
            response = requests.get(user_info_url, params=params, timeout=5)
            response.raise_for_status()
            
            return response.json()
            
        except requests.RequestException as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Facebook token verification failed: {str(e)}"
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Facebook token: {str(e)}"
            )
    
    @staticmethod
    def extract_user_info(user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract user information from Facebook response"""
        name_parts = user_data.get("name", "User").split(" ", 1)
        picture_url = None
        
        if "picture" in user_data and "data" in user_data["picture"]:
            picture_url = user_data["picture"]["data"].get("url")
        
        return {
            "provider_id": user_data.get("id"),
            "email": user_data.get("email"),
            "first_name": name_parts[0] if name_parts else "User",
            "last_name": name_parts[1] if len(name_parts) > 1 else None,
            "picture": picture_url,
        }


facebook_oauth_service = FacebookOAuthService()
