"""Admin content-management schemas (shared across learning tracks)."""

from .curriculum import (
    ChapterCreate,
    ChapterResponse,
    ChapterUpdate,
    LessonCreate,
    LessonResponse,
    LessonUpdate,
    UnitCreate,
    UnitResponse,
    UnitUpdate,
)
from .exercise import (
    ExerciseCreate,
    ExerciseOptionCreate,
    ExerciseOptionResponse,
    ExerciseOptionUpdate,
    ExerciseResponse,
    ExerciseUpdate,
)

__all__ = [
    "UnitCreate",
    "UnitUpdate",
    "UnitResponse",
    "ChapterCreate",
    "ChapterUpdate",
    "ChapterResponse",
    "LessonCreate",
    "LessonUpdate",
    "LessonResponse",
    "ExerciseCreate",
    "ExerciseUpdate",
    "ExerciseResponse",
    "ExerciseOptionCreate",
    "ExerciseOptionUpdate",
    "ExerciseOptionResponse",
]
