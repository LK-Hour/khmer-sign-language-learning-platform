"""User CRUD service layer.

Encapsulates all User model database operations so routes remain thin
orchestration layers without direct ORM access.
"""

from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from src.models.user import User
from src.utils.password import hash_password


class UserService:
    """Service for User CRUD operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        """Fetch a user by primary key."""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_username(self, username: str) -> Optional[User]:
        """Fetch a user by username."""
        return self.db.query(User).filter(User.username == username).first()

    def get_by_email(self, email: str, active_only: bool = False) -> Optional[User]:
        """Fetch a user by email, optionally filtering to active users only."""
        query = self.db.query(User).filter(User.email == email)
        if active_only:
            query = query.filter(User.is_active.is_(True))
        return query.first()

    def list_users(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        account_type: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> list[User]:
        """List users with optional filters and pagination."""
        query = self.db.query(User)

        if search:
            term = f"%{search}%"
            query = query.filter(
                or_(
                    User.display_name.ilike(term),
                    User.email.ilike(term),
                )
            )
        if account_type:
            query = query.filter(User.account_type == account_type)
        if is_active is not None:
            query = query.filter(User.is_active == is_active)

        return query.offset(skip).limit(min(limit, 100)).all()

    def create(
        self,
        *,
        username: str,
        display_name: str,
        email: Optional[str] = None,
        password: Optional[str] = None,
        avatar_url: Optional[str] = None,
        account_type: str = "student",
        auth_provider: str = "email",
        is_guest: bool = False,
    ) -> User:
        """Create a new user and flush to get the ID."""
        user = User(
            username=username,
            email=email,
            password_hash=hash_password(password) if password else None,
            display_name=display_name,
            avatar_url=avatar_url,
            account_type=account_type,
            auth_provider=auth_provider,
            is_guest=is_guest,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_guest(self) -> User:
        """Create a guest user with a random identifier."""
        guest_id = str(uuid.uuid4())[:8]
        return self.create(
            username=f"guest_{guest_id}",
            display_name=f"Guest {guest_id}",
            account_type="student",
            auth_provider="guest",
            is_guest=True,
        )

    def update(
        self,
        user: User,
        *,
        update_data: dict,
        password: Optional[str] = None,
        account_type: Optional[str] = None,
    ) -> User:
        """Update user fields. Handles password hashing separately."""
        for field, value in update_data.items():
            setattr(user, field, value)
        if account_type is not None:
            user.account_type = account_type
        if password:
            user.password_hash = hash_password(password)
        self.db.commit()
        self.db.refresh(user)
        return user

    def deactivate(self, user: User) -> User:
        """Soft-delete: set is_active to False."""
        user.is_active = False
        self.db.commit()
        self.db.refresh(user)
        return user
