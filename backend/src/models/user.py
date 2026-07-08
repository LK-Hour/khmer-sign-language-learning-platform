import uuid
from uuid_extensions import uuid7
from sqlalchemy import String, Boolean, Text, func
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid7)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    display_name: Mapped[str] = mapped_column(String, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    account_type: Mapped[str] = mapped_column(String, nullable=False, default="student")  # student | admin
    auth_provider: Mapped[str] = mapped_column(String, nullable=False, default="email")  # email | google | facebook | telegram
    is_guest: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_at: Mapped[None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    created_at: Mapped[None] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[None] = mapped_column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    oauth_providers = relationship("UserOAuthProvider", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    
    # Finger spelling progress tracking
    lesson_progress = relationship("FingerUserLessonProgress", back_populates="user", cascade="all, delete-orphan")
    exercise_results = relationship("FingerExerciseProgress", back_populates="user", cascade="all, delete-orphan")

    # Word detection progress tracking
    word_detection_lesson_progress = relationship(
        "WordDetectionUserLessonProgress", back_populates="user", cascade="all, delete-orphan"
    )
    word_detection_exercise_results = relationship(
        "WordDetectionExerciseProgress", back_populates="user", cascade="all, delete-orphan"
    )
    
    # Word detection contributions
    word_detection_contributions = relationship(
        "WordDetectionContribution",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="WordDetectionContribution.user_id",
    )
    reviewed_word_detection_contributions = relationship(
        "WordDetectionContribution",
        foreign_keys="WordDetectionContribution.reviewed_by",
    )

    # Practice progress tracking
    finger_practice_progress = relationship(
        "FingerUserPracticeProgress", back_populates="user", cascade="all, delete-orphan"
    )
    word_detection_practice_progress = relationship(
        "WordDetectionUserPracticeProgress", back_populates="user", cascade="all, delete-orphan"
    )
