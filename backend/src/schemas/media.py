from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class MediaType(str, Enum):
    VIDEO = "video"
    GIF = "gif"
    IMAGE = "image"


class MediaBase(BaseModel):
    media_type: MediaType
    file_url: str


class MediaResponse(MediaBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
