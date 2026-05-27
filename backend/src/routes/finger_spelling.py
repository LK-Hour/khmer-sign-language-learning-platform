"""Finger spelling learner API."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.dependencies.auth import get_current_user, get_optional_user
from src.models.media import Media
from src.models.user import User
from src.schemas.finger_spelling import (
    ExerciseResponse,
    ExerciseSubmitRequest,
    ExerciseSubmitResponse,
    FsChapterResponse,
    FsLessonDetailResponse,
    FsLessonResponse,
    FsUnitResponse,
    PracticeEndResponse,
    PracticeLetterSubmitRequest,
    PracticeLetterSubmitResponse,
    PracticeSessionResponse,
    PracticeSessionStartRequest,
)
from src.schemas.media import MediaResponse
from src.services.finger_spelling.finger_curriculum_service import (
    FingerCurriculumService,
    LessonDetailBundle,
)
from src.services.finger_spelling.finger_exercise_service import FingerExerciseService
from src.services.finger_spelling.finger_practice_service import FingerPracticeService
from src.services.finger_spelling.finger_progress_service import FingerProgressService

router = APIRouter(prefix="/api/finger_spelling", tags=["finger-spelling"])

_PLACEHOLDER_IMAGE = "/finger-spelling/placeholder-sign.svg"


def _image_url(medias: list[Media]) -> str:
    if medias:
        return medias[0].file_url
    return _PLACEHOLDER_IMAGE


def _to_fs_lesson(
    *,
    lesson,
    chapter_id: int,
    letter_kh: str,
    letter_en: str | None,
    medias: list[Media],
    order_index: int,
    user_id: uuid.UUID | None,
    progress: FingerProgressService,
) -> FsLessonResponse:
    return FsLessonResponse(
        id=lesson.id,
        chapterId=chapter_id,
        letter=letter_kh,
        romanization=letter_en,
        letterNameEn=letter_en,
        letterNameKh=letter_kh,
        imageUrl=_image_url(medias),
        orderIndex=order_index,
        isLocked=progress.is_lesson_locked_by_id(user_id, lesson.id),
        progressStatus=progress.progress_status_for_lesson(user_id, lesson.id),
    )


def _lesson_detail_to_response(
    bundle: LessonDetailBundle,
    user_id: uuid.UUID | None,
    progress: FingerProgressService,
) -> FsLessonDetailResponse:
    primary = bundle.letters[0] if bundle.letters else None
    letter = primary.letter if primary else None
    medias = primary.medias if primary else []
    letter_kh = letter.letter_kh if letter else bundle.lesson.name_kh
    letter_en = letter.letter_en if letter else None

    base = _to_fs_lesson(
        lesson=bundle.lesson,
        chapter_id=bundle.chapter.id,
        letter_kh=letter_kh,
        letter_en=letter_en,
        medias=medias,
        order_index=bundle.lesson.order_index,
        user_id=user_id,
        progress=progress,
    )
    return FsLessonDetailResponse(
        **base.model_dump(),
        description=bundle.lesson.description_en,
        descriptionKh=bundle.lesson.description_kh,
    )


@router.get("/units", response_model=list[FsUnitResponse])
def list_units(
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> list[FsUnitResponse]:
    curriculum = FingerCurriculumService(db)
    progress = FingerProgressService(db)
    user_id = user.id if user else None
    result: list[FsUnitResponse] = []
    for unit in curriculum.list_units():
        lesson_ids = curriculum.curriculum.list_lesson_ids_for_unit(unit.id)
        completed = progress.progress.count_completed_lessons(user_id, lesson_ids) if user_id else 0
        result.append(
            FsUnitResponse(
                id=unit.id,
                title=unit.name_en,
                titleKh=unit.name_kh,
                category=None,
                orderIndex=unit.order_index,
                chapterCount=curriculum.count_chapters(unit.id),
                completedLessonCount=completed,
                totalLessonCount=len(lesson_ids),
            )
        )
    return result


@router.get("/units/{unit_id}", response_model=FsUnitResponse)
def get_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> FsUnitResponse:
    curriculum = FingerCurriculumService(db)
    unit = curriculum.get_unit(unit_id)
    if unit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

    user_id = user.id if user else None
    lesson_ids = curriculum.curriculum.list_lesson_ids_for_unit(unit.id)
    completed = (
        FingerProgressService(db).progress.count_completed_lessons(user_id, lesson_ids)
        if user_id
        else 0
    )
    return FsUnitResponse(
        id=unit.id,
        title=unit.name_en,
        titleKh=unit.name_kh,
        orderIndex=unit.order_index,
        chapterCount=curriculum.count_chapters(unit.id),
        completedLessonCount=completed,
        totalLessonCount=len(lesson_ids),
    )


@router.get("/units/{unit_id}/chapters", response_model=list[FsChapterResponse])
def list_chapters(
    unit_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> list[FsChapterResponse]:
    curriculum = FingerCurriculumService(db)
    chapters = curriculum.list_chapters_for_unit(unit_id)
    if chapters is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

    user_id = user.id if user else None
    progress_svc = FingerProgressService(db)
    result: list[FsChapterResponse] = []
    for chapter in chapters:
        lesson_ids = curriculum.curriculum.list_lesson_ids_for_chapter(chapter.id)
        completed = (
            progress_svc.progress.count_completed_lessons(user_id, lesson_ids) if user_id else 0
        )
        result.append(
            FsChapterResponse(
                id=chapter.id,
                unitId=chapter.unit_id,
                title=chapter.name_en,
                titleKh=chapter.name_kh,
                description=chapter.description_en,
                descriptionKh=chapter.description_kh,
                orderIndex=chapter.order_index,
                lessonCount=len(lesson_ids),
                completedLessonCount=completed,
                isQuizUnlocked=curriculum.is_chapter_quiz_unlocked(user_id, chapter.id),
            )
        )
    return result


@router.get("/chapters/{chapter_id}", response_model=FsChapterResponse)
def get_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> FsChapterResponse:
    curriculum = FingerCurriculumService(db)
    chapter = curriculum.get_chapter(chapter_id)
    if chapter is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    user_id = user.id if user else None
    lesson_ids = curriculum.curriculum.list_lesson_ids_for_chapter(chapter.id)
    completed = (
        FingerProgressService(db).progress.count_completed_lessons(user_id, lesson_ids)
        if user_id
        else 0
    )
    return FsChapterResponse(
        id=chapter.id,
        unitId=chapter.unit_id,
        title=chapter.name_en,
        titleKh=chapter.name_kh,
        description=chapter.description_en,
        descriptionKh=chapter.description_kh,
        orderIndex=chapter.order_index,
        lessonCount=len(lesson_ids),
        completedLessonCount=completed,
        isQuizUnlocked=curriculum.is_chapter_quiz_unlocked(user_id, chapter.id),
    )


@router.get("/chapters/{chapter_id}/lessons", response_model=list[FsLessonResponse])
def list_lessons(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> list[FsLessonResponse]:
    curriculum = FingerCurriculumService(db)
    lessons = curriculum.list_lessons_for_chapter(chapter_id)
    if lessons is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    user_id = user.id if user else None
    progress = FingerProgressService(db)
    result: list[FsLessonResponse] = []
    for lesson in lessons:
        letter = curriculum.curriculum.get_primary_letter_for_lesson(lesson.id)
        medias = (
            curriculum.curriculum.list_medias_for_letter(letter.id) if letter else []
        )
        result.append(
            _to_fs_lesson(
                lesson=lesson,
                chapter_id=chapter_id,
                letter_kh=letter.letter_kh if letter else lesson.name_kh,
                letter_en=letter.letter_en if letter else None,
                medias=medias,
                order_index=lesson.order_index,
                user_id=user_id,
                progress=progress,
            )
        )
    return result


@router.get("/lessons/{lesson_id}", response_model=FsLessonDetailResponse)
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> FsLessonDetailResponse:
    curriculum = FingerCurriculumService(db)
    bundle = curriculum.get_lesson_detail(lesson_id)
    if bundle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    user_id = user.id if user else None
    return _lesson_detail_to_response(bundle, user_id, FingerProgressService(db))


@router.get("/lessons/{lesson_id}/exercises", response_model=list[ExerciseResponse])
def list_lesson_exercises(
    lesson_id: int,
    db: Session = Depends(get_db),
) -> list[ExerciseResponse]:
    exercises = FingerExerciseService(db).list_lesson_exercises(lesson_id)
    if exercises is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return [ExerciseResponse.model_validate(ex) for ex in exercises]


@router.post("/exercises/{exercise_id}/submit", response_model=ExerciseSubmitResponse)
def submit_exercise(
    exercise_id: int,
    body: ExerciseSubmitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ExerciseSubmitResponse:
    result = FingerExerciseService(db).submit_answer(
        user_id=user.id,
        exercise_id=exercise_id,
        selected_option_id=body.selected_option_id,
        selected_answer=body.selected_answer,
        time_taken=body.time_taken,
    )
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")
    return ExerciseSubmitResponse(
        is_correct=result.is_correct,
        attempt_number=result.attempt_number,
        progress_id=str(result.progress_id),
        explanation_en=result.explanation_en,
        explanation_kh=result.explanation_kh,
    )


@router.post("/lessons/{lesson_id}/practice/sessions", response_model=PracticeSessionResponse)
def start_practice_session(
    lesson_id: int,
    body: PracticeSessionStartRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PracticeSessionResponse:
    session = FingerPracticeService(db).start_session(
        user_id=user.id,
        lesson_id=lesson_id,
        media_id=body.media_id,
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    return PracticeSessionResponse(
        id=session.id,
        lesson_id=session.lesson_id,
        started_at=session.started_at,
        is_completed=session.is_completed,
    )


@router.post(
    "/practice/sessions/{session_id}/letters",
    response_model=PracticeLetterSubmitResponse,
)
def submit_practice_letter(
    session_id: int,
    body: PracticeLetterSubmitRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PracticeLetterSubmitResponse:
    result = FingerPracticeService(db).submit_letter(
        user_id=user.id,
        session_id=session_id,
        letter_id=body.letter_id,
        accuracy=body.accuracy,
        attempts=body.attempts,
        time_spent_seconds=body.time_spent_seconds,
        media_id=body.media_id,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or completed practice session, or letter not in lesson",
        )
    return PracticeLetterSubmitResponse(
        session_id=result.session_id,
        letter_id=result.letter_id,
        accuracy=result.accuracy,
    )


@router.post("/practice/sessions/{session_id}/end", response_model=PracticeEndResponse)
def end_practice_session(
    session_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PracticeEndResponse:
    result = FingerPracticeService(db).end_session(user_id=user.id, session_id=session_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Practice session not found or already completed",
        )
    progress = FingerProgressService(db).get_lesson_progress(user.id, result.session.lesson_id)
    lesson_completed = progress is not None and progress.is_completed
    return PracticeEndResponse(
        session_id=result.session.id,
        lesson_id=result.session.lesson_id,
        average_accuracy=result.average_accuracy,
        peak_accuracy=result.peak_accuracy,
        duration_seconds=result.duration_seconds,
        lesson_completed=lesson_completed,
    )
