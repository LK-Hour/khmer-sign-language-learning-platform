"""Registry that maps a learning track to its ORM model bundle.

This is the single extension point that lets the generic admin services manage
multiple learning tracks without duplicated logic. Every track exposes the same
curriculum hierarchy (Unit -> Chapter -> Lesson -> Exercise -> Option), so the
admin layer only needs to know *which* model classes to operate on.

Adding a new track (e.g. Word Sign) is a one-line registration once its models
exist - no changes to repositories, services, schemas, or routes are required.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from fastapi import HTTPException, status

from src.db.session import Base
from src.models.finger_spelling import (
    FingerChapter,
    FingerExercise,
    FingerExerciseOption,
    FingerExerciseType,
    FingerLesson,
    FingerUnit,
)
from src.models.word_detection import (
    WordDetectionChapter,
    WordDetectionExercise,
    WordDetectionExerciseOption,
    WordDetectionExerciseType,
    WordDetectionLesson,
    WordDetectionUnit,
)


@dataclass(frozen=True)
class TrackConfig:
    """Model bundle and metadata for one learning track."""

    key: str
    label: str
    unit_model: type[Base]
    chapter_model: type[Base]
    lesson_model: type[Base]
    exercise_model: type[Base]
    option_model: type[Base]
    exercise_type_enum: type[Enum]

    def valid_exercise_types(self) -> list[str]:
        return [member.value for member in self.exercise_type_enum]


_REGISTRY: dict[str, TrackConfig] = {
    "finger": TrackConfig(
        key="finger",
        label="Finger Spelling",
        unit_model=FingerUnit,
        chapter_model=FingerChapter,
        lesson_model=FingerLesson,
        exercise_model=FingerExercise,
        option_model=FingerExerciseOption,
        exercise_type_enum=FingerExerciseType,
    ),
    "word_detection": TrackConfig(
        key="word_detection",
        label="Word Detection",
        unit_model=WordDetectionUnit,
        chapter_model=WordDetectionChapter,
        lesson_model=WordDetectionLesson,
        exercise_model=WordDetectionExercise,
        option_model=WordDetectionExerciseOption,
        exercise_type_enum=WordDetectionExerciseType,
    ),
}


def list_tracks() -> list[str]:
    return list(_REGISTRY.keys())


def get_track_config(track: str) -> TrackConfig:
    config = _REGISTRY.get(track)
    if config is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Unknown or unsupported track '{track}'. "
                f"Available tracks: {', '.join(_REGISTRY) or 'none'}."
            ),
        )
    return config
