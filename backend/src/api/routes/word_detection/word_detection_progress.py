"""Word detection progress routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.deps import get_db, get_current_user
from src.models.user import User
from src.schemas.word_detection import (
    WdChapterLessonProgressItem,
    WdChapterProgressResponse,
    WdLessonProgressResponse,
    WdPracticeAttemptRequest,
    WdPracticeAttemptResponse,
)
from src.services.word_detection.word_detection_curriculum_service import (
    WordDetectionCurriculumService,
)
from src.services.word_detection.word_detection_progress_service import (
    WordDetectionProgressService,
)

router = APIRouter(prefix="/api/word_detection/progress", tags=["word-detection-progress"])


@router.get("/lessons/{lesson_id}", response_model=WdLessonProgressResponse)
def get_lesson_progress(
    lesson_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> WdLessonProgressResponse:
    curriculum = WordDetectionCurriculumService(db)
    lesson = curriculum.get_lesson(lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    progress = WordDetectionProgressService(db)
    row = progress.get_lesson_progress(user.id, lesson_id)
    return WdLessonProgressResponse(
        lessonId=lesson_id,
        progressStatus=progress.progress_status_for_lesson(user.id, lesson_id),
        isLocked=progress.is_lesson_locked_by_id(user.id, lesson_id),
        attemptCount=(row.attempts if row and row.attempts is not None else 0),
        lastPracticedAt=(row.last_practiced_at if row else None),
        completedAt=(row.completed_at if row else None),
    )


@router.post("/lessons/{lesson_id}/practice", response_model=WdPracticeAttemptResponse)
def record_practice_attempt(
    lesson_id: int,
    body: WdPracticeAttemptRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> WdPracticeAttemptResponse:
    curriculum = WordDetectionCurriculumService(db)
    lesson = curriculum.get_lesson(lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    progress = WordDetectionProgressService(db)
    accuracy = body.accuracy
    passed = body.label_matched
    progress.record_practice_attempt(user.id, lesson_id, accuracy=accuracy, passed=passed)
    return WdPracticeAttemptResponse(
        lesson_id=lesson_id,
        accuracy=accuracy,
        lesson_completed=passed,
    )


@router.get("/chapters/{chapter_id}", response_model=WdChapterProgressResponse)
def get_chapter_progress(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> WdChapterProgressResponse:
    curriculum = WordDetectionCurriculumService(db)
    lessons = curriculum.list_lessons_for_chapter(chapter_id)
    if lessons is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    progress = WordDetectionProgressService(db)
    lesson_ids = [lesson.id for lesson in lessons]
    completed = curriculum.count_completed_lessons(user.id, lesson_ids)
    return WdChapterProgressResponse(
        chapterId=chapter_id,
        completedLessonCount=completed,
        totalLessonCount=len(lesson_ids),
        lessons=[
            WdChapterLessonProgressItem(
                lessonId=lesson.id,
                orderIndex=lesson.order_index,
                progressStatus=progress.progress_status_for_lesson(user.id, lesson.id),
                isLocked=progress.is_lesson_locked_by_id(user.id, lesson.id),
            )
            for lesson in lessons
        ],
    )
