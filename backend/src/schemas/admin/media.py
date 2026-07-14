"""Admin media management schemas.

Defines response models for the /api/admin/media endpoints including
paginated list responses and media association details.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Literal

from pydantic import BaseModel, Field

from ..media import MediaType


class AssociateTargetType(str, Enum):
    """Valid target types for media association."""

    LETTER = "letter"
    WORD = "word"


class AssociateMediaRequest(BaseModel):
    """Request body for associating/disassociating media with a letter or word."""

    target_type: Literal["letter", "word"] = Field(
        ..., description="The type of target to associate: 'letter' or 'word'"
    )
    target_id: int = Field(
        ..., description="The ID of the target letter or word"
    )


class MediaAssociation(BaseModel):
    """Represents a link between a media asset and a letter or word."""

    target_type: str  # "letter" | "word"
    target_id: int
    target_name: str


class MediaResponse(BaseModel):
    """Full media detail including associations."""

    id: int
    media_type: MediaType
    file_url: str
    created_at: datetime | None = None
    associations: List[MediaAssociation] = []

    model_config = {"from_attributes": True}


class PaginatedMediaResponse(BaseModel):
    """Paginated list of media assets."""

    items: List[MediaResponse]
    total: int
    page: int
    size: int
    pages: int
