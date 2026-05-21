import uuid
from uuid_extensions import uuid7
from sqlalchemy import String, Boolean, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, INET
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.session import Base


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    refresh_token_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)
    device_id: Mapped[str | None] = mapped_column(String, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    expires_at: Mapped[None] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    refresh_expires_at: Mapped[None] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    last_used_at: Mapped[None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at: Mapped[None] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    revoked_at: Mapped[None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
