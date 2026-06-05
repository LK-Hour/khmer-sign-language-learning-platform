"""
OAuth Request/Response Schemas
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


class OAuthLoginRequest(BaseModel):
    """OAuth login request — accepts id_token or access_token from provider."""
    code: str
    redirect_uri: Optional[str] = None
    guest_token: Optional[str] = None


class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str


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
