"""
OAuth User Service
Finds or creates users from OAuth provider data in the database
"""

from typing import Optional
from sqlalchemy.orm import Session

from ..models.user import User
from ..models.user_oauth_provider import UserOAuthProvider


def find_or_create_oauth_user(
    db: Session,
    provider: str,
    provider_id: str,
    email: Optional[str],
    first_name: str,
    last_name: Optional[str],
    picture: Optional[str],
) -> User:
    """
    Find existing user by OAuth provider+id, or create a new one.
    Also links the OAuth provider record to the user.
    """
    # Check if this OAuth provider account is already linked
    oauth_link = (
        db.query(UserOAuthProvider)
        .filter(
            UserOAuthProvider.provider == provider,
            UserOAuthProvider.provider_user_id == provider_id,
        )
        .first()
    )

    if oauth_link:
        user = oauth_link.user
        # Update avatar/email if changed
        if picture:
            user.avatar_url = picture
        if email and not user.email:
            user.email = email
        oauth_link.provider_email = email
        oauth_link.provider_avatar_url = picture
        db.commit()
        db.refresh(user)
        return user

    # No existing link — check if user exists by email
    user = None
    if email:
        user = db.query(User).filter(User.email == email).first()

    # Create new user if not found
    if not user:
        display_name = f"{first_name} {last_name}".strip() if last_name else first_name
        username = f"{provider}_{provider_id}"
        user = User(
            username=username,
            email=email,
            display_name=display_name,
            avatar_url=picture,
            account_type="student",
            auth_provider=provider,
        )
        db.add(user)
        db.flush()

    # Create OAuth provider link
    oauth_link = UserOAuthProvider(
        user_id=user.id,
        provider=provider,
        provider_user_id=provider_id,
        provider_email=email,
        provider_avatar_url=picture,
    )
    db.add(oauth_link)
    db.commit()
    db.refresh(user)
    return user
