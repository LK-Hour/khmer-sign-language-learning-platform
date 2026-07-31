"""Data access for finger spelling unit exercise progress history."""

from __future__ import annotations

import uuid
from datetime import datetime
from uuid import uuid4

from sqlalchemy import case, cast, Float, select
from sqlalchemy.orm import Session, selectinload

from src.models.finger_spelling import (
    FingerExercise,
    FingerExerciseOption,
    FingerUserExerciseProgress,
)


class FingerExerciseAttemptRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_best_completed_attempt(
        self, user_id: uuid.UUID, unit_id: int
    ) -> FingerUserExerciseProgress | None:
        """Best finished attempt by percent (score/max_score)."""
        percent = case(
            (FingerUserExerciseProgress.max_score > 0,
             cast(FingerUserExerciseProgress.score, Float)
             / cast(FingerUserExerciseProgress.max_score, Float)),
            else_=0.0,
        )
        stmt = (
            select(FingerUserExerciseProgress)
            .where(
                FingerUserExerciseProgress.user_id == user_id,
                FingerUserExerciseProgress.unit_id == unit_id,
                FingerUserExerciseProgress.is_completed.is_(True),
            )
            .order_by(percent.desc(), FingerUserExerciseProgress.score.desc())
            .limit(1)
        )
        return self.db.scalars(stmt).first()

    def create_completed_attempt(
        self,
        *,
        user_id: uuid.UUID,
        unit_id: int,
        score: int,
        max_score: int,
    ) -> FingerUserExerciseProgress:
        row = FingerUserExerciseProgress(
            id=uuid4(),
            user_id=user_id,
            unit_id=unit_id,
            score=score,
            max_score=max_score,
            is_completed=True,
            completed_at=datetime.utcnow(),
        )
        self.db.add(row)
        self.db.flush()
        return row

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
