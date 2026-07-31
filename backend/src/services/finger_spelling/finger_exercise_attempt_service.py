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
    FingerUserExerciseProgress,
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

MIN_QUESTIONS = 15
MAX_QUESTIONS = 25


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
    required_selection_count: int | None = None


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

    # ── Session start (ephemeral — no DB write) ──────────────────────────────

    def get_or_start_exercise(
        self, user_id: uuid.UUID, unit_id: int
    ) -> ExerciseSession:
        if not self.is_unit_exercise_unlocked(user_id, unit_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unit exercise is locked. Complete all lessons in this unit first.",
            )
        return self._start_ephemeral_session(unit_id)

    # ── Submit and grade ─────────────────────────────────────────────────────

    def submit_exercise(
        self,
        user_id: uuid.UUID,
        unit_id: int,
        attempt_id: uuid.UUID,
        question_ids: list[int],
        raw_answers: list[dict],
    ) -> ExerciseSession:
        """Grade answers, persist finished attempt, return preview payload."""
        if not self.is_unit_exercise_unlocked(user_id, unit_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unit exercise is locked. Complete all lessons in this unit first.",
            )

        session = self._grade_session(
            unit_id=unit_id,
            attempt_id=attempt_id,
            question_ids=question_ids,
            raw_answers=raw_answers,
        )

        self.attempt_repo.create_completed_attempt(
            user_id=user_id,
            unit_id=unit_id,
            score=session.score,
            max_score=session.max_score,
        )
        self.db.commit()
        return session

    # ── Unit exercise status (for list page) ─────────────────────────────────

    def get_unit_exercise_status(
        self, user_id: uuid.UUID | None, unit_id: int
    ) -> dict:
        unlocked = self.is_unit_exercise_unlocked(user_id, unit_id)
        best: FingerUserExerciseProgress | None = None
        if user_id:
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
        return self._start_ephemeral_session(unit_id)

    def grade_guest_exercise(
        self,
        unit_id: int,
        attempt_id: uuid.UUID,
        question_ids: list[int],
        raw_answers: list[dict],
    ) -> ExerciseSession:
        """Grade guest answers in-memory and return results with correct answers revealed."""
        return self._grade_session(
            unit_id=unit_id,
            attempt_id=attempt_id,
            question_ids=question_ids,
            raw_answers=raw_answers,
        )

    # ── Private helpers ──────────────────────────────────────────────────────

    def _start_ephemeral_session(self, unit_id: int) -> ExerciseSession:
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

    def _grade_session(
        self,
        *,
        unit_id: int,
        attempt_id: uuid.UUID,
        question_ids: list[int],
        raw_answers: list[dict],
    ) -> ExerciseSession:
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

    def _pick_question_ids(self, unit_id: int) -> list[int]:
        """Pick N questions (15–25 when pool allows), covering available types."""
        exercises = self.attempt_repo.list_exercises_for_unit(unit_id)
        if not exercises:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No exercise questions available for this unit.",
            )

        pool_size = len(exercises)
        if pool_size >= MIN_QUESTIONS:
            count = random.randint(MIN_QUESTIONS, min(MAX_QUESTIONS, pool_size))
        else:
            count = pool_size

        by_type: dict[str, list[FingerExercise]] = {}
        for ex in exercises:
            etype = ex.exercise_type
            if isinstance(etype, FingerExerciseType):
                etype = etype.value
            by_type.setdefault(str(etype), []).append(ex)

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

        for etype in type_keys:
            if len(picked) >= count:
                break
            pool = [ex for ex in by_type[etype] if ex.id not in picked_ids]
            if not pool:
                continue
            choice = random.choice(pool)
            picked.append(choice)
            picked_ids.add(choice.id)

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
            active_opts = [
                opt
                for opt in sorted(ex.options, key=lambda o: o.order_index)
                if opt.is_active
            ]
            opts = [
                ExerciseSessionOptionResult(
                    id=opt.id,
                    option_text_en=opt.option_text_en,
                    option_text_kh=opt.option_text_kh,
                    media_url=opt.media.file_url if opt.media else None,
                    is_correct=opt.is_correct if reveal_correct else False,
                    order_index=opt.order_index,
                )
                for opt in active_opts
            ]
            etype = (
                ex.exercise_type.value
                if isinstance(ex.exercise_type, FingerExerciseType)
                else str(ex.exercise_type)
            )
            required_selection_count = (
                sum(1 for opt in active_opts if opt.is_correct)
                if etype == FingerExerciseType.MULTIPLE_ANSWER.value
                else None
            )
            results.append(
                ExerciseSessionQuestionResult(
                    exercise_id=ex.id,
                    exercise_type=etype,
                    question_en=ex.question_en,
                    question_kh=ex.question_kh,
                    media_url=ex.media.file_url if ex.media else None,
                    options=opts,
                    required_selection_count=required_selection_count,
                )
            )
        return results

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
