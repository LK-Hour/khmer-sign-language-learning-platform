"""Finger spelling progress routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.schemas.finger_spelling import (
    FsChapterLessonProgressItem,
    FsChapterProgressResponse,
    FsLessonProgressResponse,
)
from src.services.finger_spelling.finger_curriculum_service import FingerCurriculumService
from src.services.finger_spelling.finger_progress_service import FingerProgressService

router = APIRouter(prefix="/api/finger_spelling/progress", tags=["finger-spelling-progress"])


@router.get("/lessons/{lesson_id}", response_model=FsLessonProgressResponse)
def get_lesson_progress(
    lesson_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> FsLessonProgressResponse:
    curriculum = FingerCurriculumService(db)
    lesson = curriculum.get_lesson(lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    progress = FingerProgressService(db)
    row = progress.get_lesson_progress(user.id, lesson_id)
    return FsLessonProgressResponse(
        lessonId=lesson_id,
        progressStatus=progress.progress_status_for_lesson(user.id, lesson_id),
        isLocked=progress.is_lesson_locked_by_id(user.id, lesson_id),
        attempts=(row.attempts if row and row.attempts is not None else 0),
        totalTimeSpent=(row.total_time_spent if row and row.total_time_spent is not None else 0),
        peakAccuracy=(float(row.peak_accuracy) if row and row.peak_accuracy is not None else None),
        startedAt=(row.started_at if row else None),
        completedAt=(row.completed_at if row else None),
        lastAccessedAt=(row.last_accessed_at if row else None),
    )


@router.get("/chapters/{chapter_id}", response_model=FsChapterProgressResponse)
def get_chapter_progress(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> FsChapterProgressResponse:
    curriculum = FingerCurriculumService(db)
    lessons = curriculum.list_lessons_for_chapter(chapter_id)
    if lessons is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")

    progress = FingerProgressService(db)
    lesson_ids = [lesson.id for lesson in lessons]
    completed = curriculum.count_completed_lessons(user.id, lesson_ids)
    return FsChapterProgressResponse(
        chapterId=chapter_id,
        completedLessonCount=completed,
        totalLessonCount=len(lesson_ids),
        isQuizUnlocked=curriculum.is_chapter_quiz_unlocked(user.id, chapter_id),
        lessons=[
            FsChapterLessonProgressItem(
                lessonId=lesson.id,
                orderIndex=lesson.order_index,
                progressStatus=progress.progress_status_for_lesson(user.id, lesson.id),
                isLocked=progress.is_lesson_locked_by_id(user.id, lesson.id),
            )
            for lesson in lessons
        ],
    )
