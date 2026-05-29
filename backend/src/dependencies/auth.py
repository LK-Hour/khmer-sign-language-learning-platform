"""Optional and required JWT authentication dependencies."""

from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.models.user import User
from src.utils.jwt_utils import verify_token

_bearer = HTTPBearer(auto_error=False)


def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> User | None:
    if credentials is None or not credentials.credentials:
        return None
    payload = verify_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        return None
    try:
        uid = uuid.UUID(str(user_id))
    except ValueError:
        return None
    return db.query(User).filter(User.id == uid).first()


def get_current_user(
    user: Annotated[User | None, Depends(get_optional_user)],
) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user


def get_admin_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if user.account_type != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
