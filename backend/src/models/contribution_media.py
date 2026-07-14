"""
Dedicated media storage model for user-contributed sign language recordings.

Separates user contributions from the shared `medias` table to enable
independent lifecycle management and prevent contribution volume from
impacting curriculum media queries.
"""

from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import BigInteger, DateTime, Enum as SQLEnum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.session import Base
from src.models.media import MediaType

if TYPE_CHECKING:
    from src.models.word_detection import WordDetectionContribution


class ContributionMedia(Base):
    """
    Dedicated media storage for user-contributed sign language recordings.

    Mirrors relevant columns of the shared Media model but is exclusively
    used for contribution uploads (videos, gifs, images submitted by users).
    """
    __tablename__ = "contribution_medias"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    media_type: Mapped[str] = mapped_column(
        SQLEnum(MediaType, name="media_type", create_type=False,
                values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    contributions: Mapped[List["WordDetectionContribution"]] = relationship(
        back_populates="contribution_media"
    )
