"""Business logic for aggregate finger spelling practice attempts."""

from __future__ import annotations

import uuid
import logging
from dataclasses import dataclass

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from src.models.finger_spelling import FingerUserLessonProgress
from src.repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
)
from src.services.finger_spelling.finger_progress_service import FingerProgressService

logger = logging.getLogger(__name__)


@dataclass
class PracticeAttemptResult:
    lesson_id: int
    accuracy: float | None
    lesson_completed: bool
    progress: FingerUserLessonProgress


class FingerPracticeService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.curriculum = FingerCurriculumRepository(db)
        self.progress = FingerProgressService(db)

    def record_attempt(
        self,
        *,
        user_id: uuid.UUID,
        lesson_id: int,
        accuracy: float | None,
    ) -> PracticeAttemptResult | None:
        try:
            logger.info(f"[record_attempt] user_id={user_id}, lesson_id={lesson_id}, accuracy={accuracy}")

            lesson = self.curriculum.get_lesson_by_id(lesson_id, active_only=True)
            if lesson is None:
                logger.warning(f"[record_attempt] lesson {lesson_id} not found or inactive")
                return None

            normalized_accuracy = None if accuracy is None else round(float(accuracy), 2)
            passed = (
                normalized_accuracy is not None
                and normalized_accuracy >= FingerProgressService.PRACTICE_PASS_ACCURACY
            )
            logger.info(f"[record_attempt] normalized_accuracy={normalized_accuracy}, passed={passed}")

            progress = self.progress.record_practice_attempt(
                user_id,
                lesson_id,
                accuracy=normalized_accuracy,
                passed=passed,
            )
            if progress is None:
                logger.warning(f"[record_attempt] record_practice_attempt returned None")
                return None

            logger.info(f"[record_attempt] success — attempts={progress.attempts}, is_completed={progress.is_completed}, last_practiced_at={progress.last_practiced_at}")

            return PracticeAttemptResult(
                lesson_id=lesson_id,
                accuracy=normalized_accuracy,
                lesson_completed=bool(progress.is_completed),
                progress=progress,
            )
        except SQLAlchemyError as e:
            logger.error(f"[record_attempt] database error: {e}", exc_info=True)
            self.db.rollback()
            raise
        except Exception as e:
            logger.error(f"[record_attempt] unexpected error: {e}", exc_info=True)
            raise
