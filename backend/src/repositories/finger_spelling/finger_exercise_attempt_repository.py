"""Data access for finger spelling unit exercise attempts."""

from __future__ import annotations

import uuid
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from src.models.finger_spelling import (
    FingerExercise,
    FingerExerciseOption,
    FingerExerciseAttempt,
    FingerExerciseAttemptAnswer,
)


class FingerExerciseAttemptRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ── Attempts ────────────────────────────────────────────────────────────

    def get_latest_incomplete_attempt(
        self, user_id: uuid.UUID, unit_id: int
    ) -> FingerExerciseAttempt | None:
        stmt = (
            select(FingerExerciseAttempt)
            .where(
                FingerExerciseAttempt.user_id == user_id,
                FingerExerciseAttempt.unit_id == unit_id,
                FingerExerciseAttempt.is_completed.is_(False),
            )
            .order_by(FingerExerciseAttempt.started_at.desc())
            .limit(1)
        )
        return self.db.scalars(stmt).first()

    def get_best_completed_attempt(
        self, user_id: uuid.UUID, unit_id: int
    ) -> FingerExerciseAttempt | None:
        stmt = (
            select(FingerExerciseAttempt)
            .where(
                FingerExerciseAttempt.user_id == user_id,
                FingerExerciseAttempt.unit_id == unit_id,
                FingerExerciseAttempt.is_completed.is_(True),
            )
            .order_by(FingerExerciseAttempt.score.desc())
            .limit(1)
        )
        return self.db.scalars(stmt).first()

    def create_attempt(
        self,
        user_id: uuid.UUID,
        unit_id: int,
        question_ids: list[int],
    ) -> FingerExerciseAttempt:
        attempt = FingerExerciseAttempt(
            id=uuid4(),
            user_id=user_id,
            unit_id=unit_id,
            question_ids=question_ids,
            max_score=len(question_ids),
        )
        self.db.add(attempt)
        self.db.flush()
        return attempt

    def complete_attempt(
        self,
        attempt: FingerExerciseAttempt,
        score: int,
        answers: list[FingerExerciseAttemptAnswer],
    ) -> FingerExerciseAttempt:
        from datetime import datetime

        attempt.score = score
        attempt.is_completed = True
        attempt.completed_at = datetime.utcnow()
        for ans in answers:
            self.db.add(ans)
        self.db.flush()
        return attempt

    # ── Exercises ───────────────────────────────────────────────────────────

    def list_exercises_for_attempt(
        self, question_ids: list[int]
    ) -> list[FingerExercise]:
        if not question_ids:
            return []
        stmt = (
            select(FingerExercise)
            .options(
                selectinload(FingerExercise.options).selectinload(
                    FingerExerciseOption.media
                ),
                selectinload(FingerExercise.media),
            )
            .where(FingerExercise.id.in_(question_ids))
        )
        exercises = list(self.db.scalars(stmt).unique().all())
        id_order = {eid: i for i, eid in enumerate(question_ids)}
        exercises.sort(key=lambda ex: id_order.get(ex.id, 999))
        return exercises

    def list_exercises_for_unit(
        self, unit_id: int, *, active_only: bool = True
    ) -> list[FingerExercise]:
        stmt = select(FingerExercise).where(FingerExercise.unit_id == unit_id)
        if active_only:
            stmt = stmt.where(FingerExercise.is_active.is_(True))
        return list(self.db.scalars(stmt).all())
