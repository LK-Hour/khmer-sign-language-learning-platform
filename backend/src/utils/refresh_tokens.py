"""Refresh token generation, hashing, rotation, and revocation."""

from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.core.config import settings
from src.models.refresh_token import RefreshToken

REFRESH_TOKEN_BYTES = 32

# Grace period (seconds) after a token is revoked during rotation.
# If the same token is reused within this window, we treat it as a
# benign race condition (e.g. two browser tabs refreshing simultaneously)
# rather than a malicious replay attack.
REUSE_GRACE_PERIOD_SECONDS = 30


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_refresh_token(
    db: Session,
    *,
    user_id: uuid.UUID,
    expires_in_days: int | None = None,
    user_agent: str | None = None,
    last_ip: str | None = None,
) -> str:
    plain = secrets.token_urlsafe(REFRESH_TOKEN_BYTES)
    lifetime_days = expires_in_days or settings.refresh_token_expire_days
    record = RefreshToken(
        user_id=user_id,
        token_hash=token_hash(plain),
        lifetime_days=lifetime_days,
        expires_at=datetime.now(timezone.utc) + timedelta(days=lifetime_days),
        user_agent=user_agent,
        last_ip=last_ip,
    )
    db.add(record)
    db.flush()
    return plain


def get_refresh_token_record(db: Session, plain_token: str) -> RefreshToken | None:
    return db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash(plain_token)).first()


def _is_within_reuse_grace_period(db: Session, record: RefreshToken) -> bool:
    """Check if this token was rotated recently by looking for a successor.

    Instead of relying on `last_used_at` (which may not be committed during
    concurrent requests), we look for a non-revoked successor token that was
    created after this token and within the grace period window.
    """
    successor = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.user_id == record.user_id,
            RefreshToken.revoked.is_(False),
            RefreshToken.created_at >= record.created_at,
            RefreshToken.id != record.id,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
        .order_by(RefreshToken.created_at.desc())
        .first()
    )
    if successor is None:
        return False
    elapsed = (datetime.now(timezone.utc) - successor.created_at).total_seconds()
    return elapsed <= REUSE_GRACE_PERIOD_SECONDS


def validate_refresh_token(db: Session, plain_token: str) -> RefreshToken:
    record = get_refresh_token_record(db, plain_token)
    if record is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if record.revoked:
        # If the token was rotated very recently, this is likely a race condition
        # (e.g. two concurrent API calls both tried to refresh). Return the latest
        # active token for this user instead of nuking all sessions.
        if _is_within_reuse_grace_period(db, record):
            latest_active = (
                db.query(RefreshToken)
                .filter(
                    RefreshToken.user_id == record.user_id,
                    RefreshToken.revoked.is_(False),
                    RefreshToken.expires_at > datetime.now(timezone.utc),
                )
                .order_by(RefreshToken.created_at.desc())
                .first()
            )
            if latest_active is not None:
                return latest_active

        # Outside grace period — genuine reuse attack, revoke everything
        revoke_all_user_refresh_tokens(db, record.user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token reuse detected",
        )

    if record.expires_at <= datetime.now(timezone.utc):
        record.revoked = True
        db.flush()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expired refresh token")

    return record


def revoke_refresh_token(db: Session, plain_token: str) -> None:
    record = get_refresh_token_record(db, plain_token)
    if record is not None:
        record.revoked = True
        db.flush()


def revoke_all_user_refresh_tokens(db: Session, user_id: uuid.UUID) -> None:
    (
        db.query(RefreshToken)
        .filter(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
        .update({"revoked": True}, synchronize_session=False)
    )
    db.flush()


def rotate_refresh_token(
    db: Session,
    *,
    plain_token: str,
    expires_in_days: int | None = None,
    user_agent: str | None = None,
    last_ip: str | None = None,
) -> tuple[RefreshToken, str]:
    record = validate_refresh_token(db, plain_token)
    record.revoked = True
    record.last_used_at = datetime.now(timezone.utc)
    new_plain = create_refresh_token(
        db,
        user_id=record.user_id,
        expires_in_days=expires_in_days or record.lifetime_days,
        user_agent=user_agent or record.user_agent,
        last_ip=last_ip or record.last_ip,
    )
    return record, new_plain
