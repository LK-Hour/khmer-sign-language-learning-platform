"""Admin content-management schemas (shared across learning tracks)."""

from .analytics import (
    LeaderboardEntry,
    LessonDifficultyEntry,
    OverviewStats,
    TrackCompletionStats,
)
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
    "LeaderboardEntry",
    "LessonDifficultyEntry",
    "OverviewStats",
    "TrackCompletionStats",
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
