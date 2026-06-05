from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    display_name: str = Field(min_length=1, max_length=200)
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = Field(default=None, min_length=8, max_length=256)
    account_type: str = "student"
    auth_provider: str = "email"
    is_guest: bool = False


class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    display_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    avatar_url: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=256)
    account_type: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    account_type: str
    auth_provider: str
    is_guest: bool
    is_active: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserSessionResponse(BaseModel):
    id: UUID
    ip_address: Optional[str] = None
    device_id: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool
    expires_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
