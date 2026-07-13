"""
OAuth Request/Response Schemas
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class OAuthLoginRequest(BaseModel):
    """OAuth login request — accepts id_token or access_token from provider."""
    code: str
    redirect_uri: Optional[str] = None
    guest_token: Optional[str] = None


class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class OAuthUserResponse(BaseModel):
    """OAuth user response"""
    id: str
    email: Optional[EmailStr] = None
    first_name: str
    last_name: Optional[str] = None
    picture: Optional[str] = None
    provider: str


class AuthTokenResponse(BaseModel):
    """Authentication token response"""
    access_token: str
    token_type: str = "bearer"
    user: OAuthUserResponse


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GuestLessonProgressImport(BaseModel):
    lesson_id: int
    is_completed: bool = False
    attempt_count: int = 0
    completed_at: datetime | None = None


class GuestPracticeSummaryImport(BaseModel):
    lesson_id: int
    attempt_count: int = 0
    completed_at: datetime | None = None


class GuestChapterPracticeImport(BaseModel):
    chapter_id: int
    avg_score: float = 0
    completed_at: datetime | None = None


class GuestUnitExerciseImport(BaseModel):
    unit_id: int
    score: int
    max_score: int
    question_ids: list[int] = []
    completed_at: datetime | None = None


class GuestProgressImportRequest(BaseModel):
    lessons: list[GuestLessonProgressImport] = []
    practice_summaries: list[GuestPracticeSummaryImport] = []
    last_accessed_lesson_id: int | None = None
    chapter_practices: list[GuestChapterPracticeImport] = []
    unit_exercises: list[GuestUnitExerciseImport] = []


class GuestProgressImportResponse(BaseModel):
    imported_lessons: int
    skipped_lessons: int
    imported_chapter_practices: int = 0
    imported_unit_exercises: int = 0
