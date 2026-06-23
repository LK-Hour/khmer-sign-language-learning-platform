from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from src.models.feedback import FeedbackMood, FeedbackType


class LessonFeedbackCreateRequest(BaseModel):
    type: FeedbackType
    category: str = Field(max_length=255)
    lesson_id: int
    characteristic: str = Field(max_length=255)
    mood: FeedbackMood
    comment: str | None = Field(default=None, max_length=500)


class LessonFeedbackResponse(BaseModel):
    id: int
    type: FeedbackType
    category: str
    lesson_id: int
    characteristic: str
    mood: FeedbackMood
    comment: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}