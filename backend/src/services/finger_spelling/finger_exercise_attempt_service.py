"""Business logic for unit-level finger spelling exercises."""

from __future__ import annotations

import random
import uuid
from dataclasses import dataclass, field
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.models.finger_spelling import (
    FingerExercise,
    FingerExerciseType,
    FingerExerciseAttempt,
    FingerExerciseAttemptAnswer,
)
from src.repositories.finger_spelling.finger_curriculum_repository import (
    FingerCurriculumRepository,
)
from src.repositories.finger_spelling.finger_progress_repository import (
    FingerProgressRepository,
)
from src.repositories.finger_spelling.finger_exercise_attempt_repository import (
    FingerExerciseAttemptRepository,
)

EXERCISE_QUESTION_COUNT = 15


@dataclass
class ExerciseSessionOptionResult:
    id: int
    option_text_en: str | None
    option_text_kh: str | None
    media_url: str | None
    is_correct: bool
    order_index: int


@dataclass
class ExerciseSessionQuestionResult:
    exercise_id: int
    exercise_type: str
    question_en: str
    question_kh: str
    media_url: str | None
    options: list[ExerciseSessionOptionResult]


@dataclass
class ExerciseSessionAnswerResult:
    exercise_id: int
    is_correct: bool
    score: int
    selected_option_ids: list[int]
    correct_option_ids: list[int]
    matching_pairs: dict[str, int] | None


@dataclass
class ExerciseSession:
    attempt_id: uuid.UUID
    unit_id: int
    questions: list[ExerciseSessionQuestionResult]
    is_completed: bool = False
    score: int = 0
    max_score: int = 0
    per_question_results: list[ExerciseSessionAnswerResult] = field(default_factory=list)


class FingerExerciseAttemptService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.attempt_repo = FingerExerciseAttemptRepository(db)
        self.curriculum = FingerCurriculumRepository(db)
        self.progress_repo = FingerProgressRepository(db)

    # ── Unlock check ────────────────────────────────────────────────────────

    def is_unit_exercise_unlocked(
        self, user_id: uuid.UUID | None, unit_id: int
    ) -> bool:
        """All active lessons in the unit must be completed."""
        if user_id is None:
            return False
        lesson_ids = self.curriculum.list_lesson_ids_for_unit(unit_id)
        if not lesson_ids:
            return False
        completed = self.progress_repo.count_completed_lessons(user_id, lesson_ids)
        return completed >= len(lesson_ids)

    # ── Session start / resume ───────────────────────────────────────────────

    def get_or_start_exercise(
        self, user_id: uuid.UUID, unit_id: int
    ) -> ExerciseSession:
        if not self.is_unit_exercise_unlocked(user_id, unit_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unit exercise is locked. Complete all lessons in this unit first.",
            )

        unit = self.curriculum.get_unit_by_id(unit_id)
        if unit is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

        attempt = self.attempt_repo.get_latest_incomplete_attempt(user_id, unit_id)

        if attempt is None:
            question_ids = self._pick_question_ids(unit_id)
            attempt = self.attempt_repo.create_attempt(user_id, unit_id, question_ids)
            self.db.commit()
            self.db.refresh(attempt)

        questions = self._build_questions(attempt.question_ids, reveal_correct=False)
        return ExerciseSession(
            attempt_id=attempt.id,
            unit_id=unit_id,
            questions=questions,
            max_score=attempt.max_score,
        )

    # ── Submit and grade ─────────────────────────────────────────────────────

    def submit_exercise(
        self,
        user_id: uuid.UUID,
        attempt_id: uuid.UUID,
        raw_answers: list[dict],
    ) -> ExerciseSession:
        """Grade all submitted answers; mark attempt complete; return session with results."""
        attempt = self._get_owned_attempt(user_id, attempt_id)

        if attempt.is_completed:
            return self._build_completed_session(attempt)

        exercises = self.attempt_repo.list_exercises_for_attempt(attempt.question_ids)
        exercise_map: dict[int, FingerExercise] = {ex.id: ex for ex in exercises}

        answers_by_exercise: dict[int, dict] = {
            a["exercise_id"]: a for a in raw_answers
        }

        total_score = 0
        answer_rows: list[FingerExerciseAttemptAnswer] = []
        per_question_results: list[ExerciseSessionAnswerResult] = []

        for ex_id in attempt.question_ids:
            exercise = exercise_map.get(ex_id)
            if exercise is None:
                continue

            submitted = answers_by_exercise.get(ex_id, {})
            selected_ids: list[int] = submitted.get("selected_option_ids", [])
            matching_pairs: dict[str, int] | None = submitted.get("matching_pairs")

            is_correct, score = self._grade(exercise, selected_ids, matching_pairs)
            total_score += score
            correct_ids = [o.id for o in exercise.options if o.is_correct]

            row = FingerExerciseAttemptAnswer(
                id=uuid4(),
                attempt_id=attempt.id,
                exercise_id=ex_id,
                selected_option_ids=selected_ids,
                matching_pairs=matching_pairs,
                is_correct=is_correct,
                score=score,
            )
            answer_rows.append(row)
            per_question_results.append(
                ExerciseSessionAnswerResult(
                    exercise_id=ex_id,
                    is_correct=is_correct,
                    score=score,
                    selected_option_ids=selected_ids,
                    correct_option_ids=correct_ids,
                    matching_pairs=matching_pairs,
                )
            )

        self.attempt_repo.complete_attempt(attempt, total_score, answer_rows)
        self.db.commit()
        self.db.refresh(attempt)

        questions = self._build_questions(attempt.question_ids, reveal_correct=True)
        return ExerciseSession(
            attempt_id=attempt.id,
            unit_id=attempt.unit_id,
            questions=questions,
            is_completed=True,
            score=total_score,
            max_score=attempt.max_score,
            per_question_results=per_question_results,
        )

    # ── Unit exercise status (for list page) ─────────────────────────────────

    def get_unit_exercise_status(
        self, user_id: uuid.UUID | None, unit_id: int
    ) -> dict:
        unlocked = self.is_unit_exercise_unlocked(user_id, unit_id)
        best: FingerExerciseAttempt | None = None
        if user_id and unlocked:
            best = self.attempt_repo.get_best_completed_attempt(user_id, unit_id)
        return {
            "isExerciseUnlocked": unlocked,
            "isExerciseCompleted": best is not None,
            "bestScore": best.score if best else None,
            "maxScore": best.max_score if best else None,
        }

    # ── Guest (ephemeral, no DB write) ───────────────────────────────────────

    def start_guest_exercise(self, unit_id: int) -> ExerciseSession:
        """Pick questions for a guest session without persisting an attempt."""
        unit = self.curriculum.get_unit_by_id(unit_id)
        if unit is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

        question_ids = self._pick_question_ids(unit_id)
        questions = self._build_questions(question_ids, reveal_correct=False)
        return ExerciseSession(
            attempt_id=uuid4(),
            unit_id=unit_id,
            questions=questions,
            max_score=len(question_ids),
        )

    def grade_guest_exercise(
        self,
        unit_id: int,
        attempt_id: uuid.UUID,
        question_ids: list[int],
        raw_answers: list[dict],
    ) -> ExerciseSession:
        """Grade guest answers in-memory and return results with correct answers revealed."""
        unit = self.curriculum.get_unit_by_id(unit_id)
        if unit is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")
        if not question_ids:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No question_ids provided.",
            )

        unit_exercises = {
            ex.id for ex in self.attempt_repo.list_exercises_for_unit(unit_id)
        }
        if any(qid not in unit_exercises for qid in question_ids):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="One or more question_ids do not belong to this unit.",
            )

        exercises = self.attempt_repo.list_exercises_for_attempt(question_ids)
        exercise_map: dict[int, FingerExercise] = {ex.id: ex for ex in exercises}
        answers_by_exercise: dict[int, dict] = {
            a["exercise_id"]: a for a in raw_answers
        }

        total_score = 0
        per_question_results: list[ExerciseSessionAnswerResult] = []

        for ex_id in question_ids:
            exercise = exercise_map.get(ex_id)
            if exercise is None:
                continue

            submitted = answers_by_exercise.get(ex_id, {})
            selected_ids: list[int] = submitted.get("selected_option_ids", [])
            matching_pairs: dict[str, int] | None = submitted.get("matching_pairs")

            is_correct, score = self._grade(exercise, selected_ids, matching_pairs)
            total_score += score
            correct_ids = [o.id for o in exercise.options if o.is_correct]

            per_question_results.append(
                ExerciseSessionAnswerResult(
                    exercise_id=ex_id,
                    is_correct=is_correct,
                    score=score,
                    selected_option_ids=selected_ids,
                    correct_option_ids=correct_ids,
                    matching_pairs=matching_pairs,
                )
            )

        questions = self._build_questions(question_ids, reveal_correct=True)
        return ExerciseSession(
            attempt_id=attempt_id,
            unit_id=unit_id,
            questions=questions,
            is_completed=True,
            score=total_score,
            max_score=len(question_ids),
            per_question_results=per_question_results,
        )

    # ── Private helpers ──────────────────────────────────────────────────────

    def _pick_question_ids(self, unit_id: int) -> list[int]:
        """Pick a session that includes every available exercise type.

        Guarantees at least one question of each type present in the unit
        (multiple_choice, true_false, multiple_answer, matching), then fills
        remaining slots randomly up to ``EXERCISE_QUESTION_COUNT``.
        """
        exercises = self.attempt_repo.list_exercises_for_unit(unit_id)
        if not exercises:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No exercise questions available for this unit.",
            )

        count = min(EXERCISE_QUESTION_COUNT, len(exercises))
        by_type: dict[str, list[FingerExercise]] = {}
        for ex in exercises:
            etype = ex.exercise_type
            if isinstance(etype, FingerExerciseType):
                etype = etype.value
            by_type.setdefault(str(etype), []).append(ex)

        # Prefer the canonical type order so sessions feel consistent.
        preferred_order = [
            FingerExerciseType.MULTIPLE_CHOICE.value,
            FingerExerciseType.TRUE_FALSE.value,
            FingerExerciseType.MULTIPLE_ANSWER.value,
            FingerExerciseType.MATCHING.value,
        ]
        type_keys = [t for t in preferred_order if t in by_type]
        for t in by_type:
            if t not in type_keys:
                type_keys.append(t)

        picked: list[FingerExercise] = []
        picked_ids: set[int] = set()

        # Round 1: one of each available type.
        for etype in type_keys:
            if len(picked) >= count:
                break
            pool = [ex for ex in by_type[etype] if ex.id not in picked_ids]
            if not pool:
                continue
            choice = random.choice(pool)
            picked.append(choice)
            picked_ids.add(choice.id)

        # Round 2: fill remaining slots, still spreading across types when possible.
        while len(picked) < count:
            remaining_by_type = {
                etype: [ex for ex in pool if ex.id not in picked_ids]
                for etype, pool in by_type.items()
            }
            available_types = [t for t, pool in remaining_by_type.items() if pool]
            if not available_types:
                break
            etype = random.choice(available_types)
            choice = random.choice(remaining_by_type[etype])
            picked.append(choice)
            picked_ids.add(choice.id)

        random.shuffle(picked)
        return [ex.id for ex in picked]

    def _build_questions(
        self, question_ids: list[int], *, reveal_correct: bool
    ) -> list[ExerciseSessionQuestionResult]:
        exercises = self.attempt_repo.list_exercises_for_attempt(question_ids)
        results: list[ExerciseSessionQuestionResult] = []
        for ex in exercises:
            opts = [
                ExerciseSessionOptionResult(
                    id=opt.id,
                    option_text_en=opt.option_text_en,
                    option_text_kh=opt.option_text_kh,
                    media_url=opt.media.file_url if opt.media else None,
                    is_correct=opt.is_correct if reveal_correct else False,
                    order_index=opt.order_index,
                )
                for opt in sorted(ex.options, key=lambda o: o.order_index)
                if opt.is_active
            ]
            results.append(
                ExerciseSessionQuestionResult(
                    exercise_id=ex.id,
                    exercise_type=(
                        ex.exercise_type.value
                        if isinstance(ex.exercise_type, FingerExerciseType)
                        else str(ex.exercise_type)
                    ),
                    question_en=ex.question_en,
                    question_kh=ex.question_kh,
                    media_url=ex.media.file_url if ex.media else None,
                    options=opts,
                )
            )
        return results

    def _get_owned_attempt(
        self, user_id: uuid.UUID, attempt_id: uuid.UUID
    ) -> FingerExerciseAttempt:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        stmt = (
            select(FingerExerciseAttempt)
            .options(
                selectinload(FingerExerciseAttempt.answers)
            )
            .where(
                FingerExerciseAttempt.id == attempt_id,
                FingerExerciseAttempt.user_id == user_id,
            )
        )
        attempt = self.db.scalars(stmt).first()
        if attempt is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Exercise attempt not found"
            )
        return attempt

    def _build_completed_session(self, attempt: FingerExerciseAttempt) -> ExerciseSession:
        questions = self._build_questions(attempt.question_ids, reveal_correct=True)
        per_question_results: list[ExerciseSessionAnswerResult] = []
        exercises = self.attempt_repo.list_exercises_for_attempt(attempt.question_ids)
        exercise_map = {ex.id: ex for ex in exercises}
        answer_map = {ans.exercise_id: ans for ans in attempt.answers}

        for ex_id in attempt.question_ids:
            exercise = exercise_map.get(ex_id)
            ans = answer_map.get(ex_id)
            if exercise is None:
                continue
            correct_ids = [o.id for o in exercise.options if o.is_correct]
            per_question_results.append(
                ExerciseSessionAnswerResult(
                    exercise_id=ex_id,
                    is_correct=ans.is_correct if ans else False,
                    score=ans.score if ans else 0,
                    selected_option_ids=ans.selected_option_ids if ans else [],
                    correct_option_ids=correct_ids,
                    matching_pairs=ans.matching_pairs if ans else None,
                )
            )
        return ExerciseSession(
            attempt_id=attempt.id,
            unit_id=attempt.unit_id,
            questions=questions,
            is_completed=True,
            score=attempt.score,
            max_score=attempt.max_score,
            per_question_results=per_question_results,
        )

    @staticmethod
    def _grade(
        exercise: FingerExercise,
        selected_ids: list[int],
        matching_pairs: dict[str, int] | None,
    ) -> tuple[bool, int]:
        etype = exercise.exercise_type
        if isinstance(etype, FingerExerciseType):
            etype = etype.value
        else:
            etype = str(etype)

        correct_ids = {o.id for o in exercise.options if o.is_correct}

        if etype in (
            FingerExerciseType.MULTIPLE_CHOICE.value,
            FingerExerciseType.TRUE_FALSE.value,
        ):
            is_correct = len(selected_ids) == 1 and selected_ids[0] in correct_ids
        elif etype == FingerExerciseType.MULTIPLE_ANSWER.value:
            is_correct = set(selected_ids) == correct_ids
        elif etype == FingerExerciseType.MATCHING.value:
            if not matching_pairs:
                is_correct = False
            else:
                submitted = {int(k): v for k, v in matching_pairs.items()}
                is_correct = True
                for opt in exercise.options:
                    if opt.id not in submitted or submitted[opt.id] != opt.id:
                        is_correct = False
                        break
                if len(submitted) != len(exercise.options):
                    is_correct = False
        else:
            is_correct = False

        return is_correct, 1 if is_correct else 0
