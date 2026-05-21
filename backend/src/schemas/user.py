from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    display_name: str
    avatar_url: Optional[str] = None
    account_type: str = "student"
    auth_provider: str = "email"
    is_guest: bool = False


class UserCreate(UserBase):
    password: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
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
