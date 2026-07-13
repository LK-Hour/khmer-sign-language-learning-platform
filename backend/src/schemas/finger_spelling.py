import uuid

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
    isExerciseUnlocked: bool = False
    isExerciseCompleted: bool = False
    bestScore: int | None = None
    maxScore: int | None = None


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
    isExerciseUnlocked: bool
    isPracticeUnlocked: bool = False
    isPracticeComplete: bool = False
    isLocked: bool = False


class FsLessonResponse(BaseModel):
    id: int
    chapterId: int
    letterId: int
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
    lesson_id: int
    progress_id: uuid.UUID
    explanation_en: str | None = None
    explanation_kh: str | None = None


class PracticeAttemptRequest(BaseModel):
    accuracy: float | None = None


class PracticeAttemptResponse(BaseModel):
    lesson_id: int
    accuracy: float | None = None
    lesson_completed: bool


class HandPredictFeaturesRequest(BaseModel):
    features: list[float]
    handedness: str | None = None
    category: str | None = None
    target_label: str | None = None


class HandPredictResponse(BaseModel):
    match_confidence: float
    predicted_class_index: int
    predicted_label: str | None = None
    handedness: str
    target_label: str | None = None
    label_matches: bool | None = None


class HandPredictStatusResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    available: bool
    model_loaded: bool = False
    label_encoder_loaded: bool = False
    label_count: int = 0
    output_class_count: int | None = None
    label_encoder_matches_model: bool = False


class FsLessonProgressResponse(BaseModel):
    lessonId: int
    progressStatus: str
    isLocked: bool
    attemptCount: int
    lastPracticedAt: datetime | None = None
    completedAt: datetime | None = None


class FsChapterLessonProgressItem(BaseModel):
    lessonId: int
    orderIndex: int
    progressStatus: str
    isLocked: bool


class FsChapterProgressResponse(BaseModel):
    chapterId: int
    completedLessonCount: int
    totalLessonCount: int
    isExerciseUnlocked: bool
    lessons: List[FsChapterLessonProgressItem] = []


# ── Chapter practice schemas ───────────────────────────────────────────────

class FsPracticeItemResponse(BaseModel):
    lessonId: int
    letterId: int
    letterKh: str
    letterEn: Optional[str] = None
    orderIndex: int
    practiceImageUrl: str


class FsChapterPracticeResponse(BaseModel):
    chapterId: int
    chapterTitle: str
    chapterTitleKh: str
    unitId: int
    unitTitle: str
    unitTitleKh: str
    isUnlocked: bool
    practiceId: Optional[int] = None
    items: List[FsPracticeItemResponse] = []
    # Per-user progress
    isComplete: bool = False
    attempts: int = 0
    avgScore: float = 0.0


class ChapterPracticeResultRequest(BaseModel):
    avgScore: float
    isComplete: bool


class ChapterPracticeResultResponse(BaseModel):
    chapterId: int
    practiceId: int
    avgScore: float
    isComplete: bool
    attempts: int


# ── Unit exercise session schemas ─────────────────────────────────────────────

class ExerciseSessionOptionResponse(BaseModel):
    id: int
    option_text_en: str | None = None
    option_text_kh: str | None = None
    media_url: str | None = None
    is_correct: bool = False
    order_index: int


class ExerciseSessionQuestionResponse(BaseModel):
    exercise_id: int
    exercise_type: str
    question_en: str
    question_kh: str
    media_url: str | None = None
    options: List[ExerciseSessionOptionResponse] = []


class ExerciseSessionAnswerResultResponse(BaseModel):
    exercise_id: int
    is_correct: bool
    score: int
    selected_option_ids: List[int] = []
    correct_option_ids: List[int] = []
    matching_pairs: dict | None = None


class ExerciseSessionResponse(BaseModel):
    attempt_id: uuid.UUID
    unit_id: int
    questions: List[ExerciseSessionQuestionResponse] = []
    is_completed: bool = False
    score: int = 0
    max_score: int = 0
    per_question_results: List[ExerciseSessionAnswerResultResponse] = []


class ExerciseSessionAnswerSubmit(BaseModel):
    exercise_id: int
    selected_option_ids: List[int] = []
    matching_pairs: dict | None = None


class ExerciseSessionSubmitRequest(BaseModel):
    attempt_id: uuid.UUID
    answers: List[ExerciseSessionAnswerSubmit] = []


class GuestExerciseGradeRequest(BaseModel):
    """Grade a guest exercise without persisting to the database."""

    attempt_id: uuid.UUID
    question_ids: List[int]
    answers: List[ExerciseSessionAnswerSubmit] = []


class UnitExerciseStatusResponse(BaseModel):
    unit_id: int
    isExerciseUnlocked: bool
    isExerciseCompleted: bool
    bestScore: int | None = None
    maxScore: int | None = None
