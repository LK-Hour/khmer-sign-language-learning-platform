"""Business logic for linear curriculum locking (unit -> chapter -> lesson)."""

from __future__ import annotations

from src.repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
)
from src.repositories.finger_spelling.finger_progress_repository import (
    FingerProgressRepository,
)
from src.services.linear_locking_service import LinearLockingService


class FingerLockingService(LinearLockingService):
    """Linear curriculum locking for the finger-spelling track."""

    curriculum_repository_cls = FingerCurriculumRepository
    progress_repository_cls = FingerProgressRepository
