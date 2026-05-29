from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .media import MediaResponse


class UnitBase(BaseModel):
    name_en: str
    name_kh: str
    description_en: Optional[str] = None
    description_kh: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class UnitResponse(UnitBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ChapterBase(BaseModel):
    unit_id: int
    name_en: str
    name_kh: str
    description_en: Optional[str] = None
    description_kh: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class ChapterResponse(ChapterBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LessonBase(BaseModel):
    chapter_id: int
    name_en: str
    name_kh: str
    description_en: Optional[str] = None
    description_kh: Optional[str] = None
    order_index: int = 0
    is_active: bool = True


class LessonResponse(LessonBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LetterBase(BaseModel):
    letter_kh: str
    letter_en: Optional[str] = None
    description_en: Optional[str] = None
    description_kh: Optional[str] = None
    is_active: bool = True


class LetterResponse(LetterBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    medias: List[MediaResponse] = []

    model_config = {"from_attributes": True}


# Response shapes used by the curriculum endpoints
class LessonPathItem(BaseModel):
    lesson: LessonResponse
    chapter: Optional[ChapterResponse] = None
    unit: Optional[UnitResponse] = None


class UnitChapterPair(BaseModel):
    unit: UnitResponse
    chapter: ChapterResponse


class LetterDataResponse(BaseModel):
    letter: LetterResponse
    lessons: List[LessonPathItem] = []
    units_and_chapters: List[UnitChapterPair] = []
    medias_count: int = 0

    model_config = {"from_attributes": True}


class LetterMediaListResponse(BaseModel):
    letter_kh: str
    letter_en: str | None = None
    total_medias: int
    medias: List[MediaResponse] = []


# Frontend-aligned API shapes (/api/finger_spelling/*)
class FsUnitResponse(BaseModel):
    id: int
    title: str
    titleKh: str
    category: str | None = None
    orderIndex: int
    chapterCount: int
    completedLessonCount: int
    totalLessonCount: int
    isLocked: bool = False


class FsChapterResponse(BaseModel):
    id: int
    unitId: int
    title: str
    titleKh: str
    description: str | None = None
    descriptionKh: str | None = None
    orderIndex: int
    lessonCount: int
    completedLessonCount: int
    isQuizUnlocked: bool
    isLocked: bool = False


class FsLessonResponse(BaseModel):
    id: int
    chapterId: int
    letter: str
    romanization: str | None = None
    letterNameEn: str | None = None
    letterNameKh: str | None = None
    imageUrl: str
    orderIndex: int
    isLocked: bool
    progressStatus: str


class FsLessonDetailResponse(FsLessonResponse):
    description: str | None = None
    descriptionKh: str | None = None


class ExerciseOptionResponse(BaseModel):
    id: int
    option_text_en: str | None = None
    option_text_kh: str | None = None
    media_id: int | None = None
    order_index: int
    media: MediaResponse | None = None

    model_config = {"from_attributes": True}


class ExerciseResponse(BaseModel):
    id: int
    lesson_id: int
    question_en: str
    question_kh: str
    exercise_type: str
    media_id: int | None = None
    order_index: int
    options: List[ExerciseOptionResponse] = []
    media: MediaResponse | None = None

    model_config = {"from_attributes": True}


class ExerciseSubmitRequest(BaseModel):
    selected_option_id: int | None = None
    selected_answer: str | None = None
    time_taken: int = 0


class ExerciseSubmitResponse(BaseModel):
    is_correct: bool
    attempt_number: int
    progress_id: str
    explanation_en: str | None = None
    explanation_kh: str | None = None


class PracticeSessionStartRequest(BaseModel):
    media_id: int | None = None


class PracticeSessionResponse(BaseModel):
    id: int
    lesson_id: int
    started_at: datetime
    is_completed: bool


class PracticeLetterSubmitRequest(BaseModel):
    letter_id: int
    accuracy: float | None = None
    attempts: int = 1
    time_spent_seconds: int = 0
    media_id: int | None = None


class PracticeLetterSubmitResponse(BaseModel):
    session_id: int
    letter_id: int
    accuracy: float | None = None


class PracticeEndResponse(BaseModel):
    session_id: int
    lesson_id: int
    average_accuracy: float | None = None
    peak_accuracy: float | None = None
    duration_seconds: int
    lesson_completed: bool


class PracticeAccuracyResponse(BaseModel):
    session_id: int
    lesson_id: int
    average_accuracy: float | None = None
    peak_accuracy: float | None = None
    samples: int = 0
    is_completed: bool


class FsLessonProgressResponse(BaseModel):
    lessonId: int
    progressStatus: str
    isLocked: bool
    attempts: int
    totalTimeSpent: int
    peakAccuracy: float | None = None
    startedAt: datetime | None = None
    completedAt: datetime | None = None
    lastAccessedAt: datetime | None = None


class FsChapterLessonProgressItem(BaseModel):
    lessonId: int
    orderIndex: int
    progressStatus: str
    isLocked: bool


class FsChapterProgressResponse(BaseModel):
    chapterId: int
    completedLessonCount: int
    totalLessonCount: int
    isQuizUnlocked: bool
    lessons: List[FsChapterLessonProgressItem] = []
