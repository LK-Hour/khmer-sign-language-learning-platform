"""Business logic for linear curriculum locking (unit -> chapter -> lesson) for Word Detection."""

from __future__ import annotations

from src.repositories.word_detection.word_detection_curriculum_repository import (
    WordDetectionCurriculumRepository,
)
from src.repositories.word_detection.word_detection_progress_repository import (
    WordDetectionProgressRepository,
)
from src.services.linear_locking_service import LinearLockingService


class WordDetectionLockingService(LinearLockingService):
    """Linear curriculum locking for the word-detection track."""

    curriculum_repository_cls = WordDetectionCurriculumRepository
    progress_repository_cls = WordDetectionProgressRepository
