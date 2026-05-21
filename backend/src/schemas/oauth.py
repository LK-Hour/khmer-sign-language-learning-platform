"""
OAuth Request/Response Schemas
"""

from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Any


class OAuthLoginRequest(BaseModel):
    """OAuth login request with provider code"""
    code: str
    redirect_uri: Optional[str] = None


class TelegramLoginRequest(BaseModel):
    """Telegram login request supporting either a token or widget auth data"""
    model_config = ConfigDict(extra="allow")  # Allow extra fields from Telegram widget
    
    code: Optional[str] = None
    id: Optional[int | str] = None  # Telegram might send as string
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: Optional[int | str] = None  # Telegram might send as string
    hash: Optional[str] = None


class OAuthTokenRequest(BaseModel):
    """OAuth token request"""
    oauth_code: str
    provider: str  # 'google', 'facebook', 'telegram'


class TelegramAuthRequest(BaseModel):
    """Telegram authentication data"""
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str


class OAuthUserResponse(BaseModel):
    """OAuth user response"""
    id: str
    email: Optional[EmailStr] = None
    first_name: str
    last_name: Optional[str] = None
    picture: Optional[str] = None
    provider: str


class AuthTokenResponse(BaseModel):
    """Authentication token response"""
    access_token: str
    token_type: str = "bearer"
    user: OAuthUserResponse


class OAuthCallbackResponse(BaseModel):
    """OAuth callback response"""
    success: bool
    message: str
    access_token: Optional[str] = None
    user: Optional[OAuthUserResponse] = None
