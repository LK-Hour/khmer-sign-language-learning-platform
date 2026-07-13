"""Unit-level finger spelling exercise session routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.api.deps import get_current_user, get_db, get_optional_user
from src.models.user import User
from src.schemas.finger_spelling import (
    ExerciseSessionResponse,
    ExerciseSessionQuestionResponse,
    ExerciseSessionOptionResponse,
    ExerciseSessionAnswerResultResponse,
    ExerciseSessionSubmitRequest,
    GuestExerciseGradeRequest,
    UnitExerciseStatusResponse,
)
from src.services.finger_spelling.finger_exercise_attempt_service import (
    FingerExerciseAttemptService,
    ExerciseSession,
)

router = APIRouter(prefix="/api/finger_spelling", tags=["finger-spelling-exercise"])


def _session_to_response(session: ExerciseSession) -> ExerciseSessionResponse:
    questions = [
        ExerciseSessionQuestionResponse(
            exercise_id=q.exercise_id,
            exercise_type=q.exercise_type,
            question_en=q.question_en,
            question_kh=q.question_kh,
            media_url=q.media_url,
            options=[
                ExerciseSessionOptionResponse(
                    id=o.id,
                    option_text_en=o.option_text_en,
                    option_text_kh=o.option_text_kh,
                    media_url=o.media_url,
                    is_correct=o.is_correct,
                    order_index=o.order_index,
                )
                for o in q.options
            ],
        )
        for q in session.questions
    ]
    results = [
        ExerciseSessionAnswerResultResponse(
            exercise_id=r.exercise_id,
            is_correct=r.is_correct,
            score=r.score,
            selected_option_ids=r.selected_option_ids,
            correct_option_ids=r.correct_option_ids,
            matching_pairs=r.matching_pairs,
        )
        for r in session.per_question_results
    ]
    return ExerciseSessionResponse(
        attempt_id=session.attempt_id,
        unit_id=session.unit_id,
        questions=questions,
        is_completed=session.is_completed,
        score=session.score,
        max_score=session.max_score,
        per_question_results=results,
    )


@router.get(
    "/units/{unit_id}/exercise",
    response_model=ExerciseSessionResponse,
)
def start_or_resume_exercise(
    unit_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ExerciseSessionResponse:
    """Start a new exercise attempt or resume the current in-progress one."""
    service = FingerExerciseAttemptService(db)
    session = service.get_or_start_exercise(user.id, unit_id)
    return _session_to_response(session)


@router.get(
    "/units/{unit_id}/exercise/guest",
    response_model=ExerciseSessionResponse,
)
def start_guest_exercise(
    unit_id: int,
    db: Session = Depends(get_db),
) -> ExerciseSessionResponse:
    """Start an ephemeral guest exercise session (not persisted until social login import)."""
    service = FingerExerciseAttemptService(db)
    session = service.start_guest_exercise(unit_id)
    return _session_to_response(session)


@router.post(
    "/units/{unit_id}/exercise/submit",
    response_model=ExerciseSessionResponse,
)
def submit_exercise(
    unit_id: int,
    body: ExerciseSessionSubmitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ExerciseSessionResponse:
    """Submit all answers, grade the exercise, return results with correct answers revealed."""
    service = FingerExerciseAttemptService(db)
    raw_answers = [
        {
            "exercise_id": a.exercise_id,
            "selected_option_ids": a.selected_option_ids,
            "matching_pairs": a.matching_pairs,
        }
        for a in body.answers
    ]
    session = service.submit_exercise(user.id, body.attempt_id, raw_answers)
    return _session_to_response(session)


@router.post(
    "/units/{unit_id}/exercise/guest/grade",
    response_model=ExerciseSessionResponse,
)
def grade_guest_exercise(
    unit_id: int,
    body: GuestExerciseGradeRequest,
    db: Session = Depends(get_db),
) -> ExerciseSessionResponse:
    """Grade a guest exercise without writing to the database."""
    service = FingerExerciseAttemptService(db)
    raw_answers = [
        {
            "exercise_id": a.exercise_id,
            "selected_option_ids": a.selected_option_ids,
            "matching_pairs": a.matching_pairs,
        }
        for a in body.answers
    ]
    session = service.grade_guest_exercise(
        unit_id, body.attempt_id, body.question_ids, raw_answers
    )
    return _session_to_response(session)


@router.get(
    "/units/{unit_id}/exercise/status",
    response_model=UnitExerciseStatusResponse,
)
def get_exercise_status(
    unit_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> UnitExerciseStatusResponse:
    """Return unlock + completion state for the unit exercise (used by exercise list page)."""
    service = FingerExerciseAttemptService(db)
    exercise_status = service.get_unit_exercise_status(
        user.id if user else None, unit_id
    )
    return UnitExerciseStatusResponse(unit_id=unit_id, **exercise_status)
