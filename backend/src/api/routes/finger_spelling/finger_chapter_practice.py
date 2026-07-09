"""Finger spelling chapter practice routes.

GET  /api/finger_spelling/chapters/{chapter_id}/practice
    Returns the full practice session (items, unlock state, prior progress).
    Optional auth — guests see isUnlocked=False and no progress fields.

POST /api/finger_spelling/chapters/{chapter_id}/practice/result
    Records the session outcome. Auth required.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.deps import get_current_user, get_db, get_optional_user
from src.models.user import User
from src.schemas.finger_spelling import (
    ChapterPracticeResultRequest,
    ChapterPracticeResultResponse,
    FsChapterPracticeResponse,
    FsPracticeItemResponse,
)
from src.services.finger_spelling.finger_chapter_practice_service import (
    FingerChapterPracticeService,
)

router = APIRouter(
    prefix="/api/finger_spelling",
    tags=["finger-spelling-chapter-practice"],
)


@router.get(
    "/chapters/{chapter_id}/practice",
    response_model=FsChapterPracticeResponse,
)
def get_chapter_practice(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> FsChapterPracticeResponse:
    svc = FingerChapterPracticeService(db)
    user_id = user.id if user else None
    session = svc.get_practice_session(user_id, chapter_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter not found",
        )
    return FsChapterPracticeResponse(
        chapterId=session.chapter_id,
        chapterTitle=session.chapter_title,
        chapterTitleKh=session.chapter_title_kh,
        unitId=session.unit_id,
        unitTitle=session.unit_title,
        unitTitleKh=session.unit_title_kh,
        isUnlocked=session.is_unlocked,
        practiceId=session.practice_id,
        items=[
            FsPracticeItemResponse(
                lessonId=item.lesson_id,
                letterId=item.letter_id,
                letterKh=item.letter_kh,
                letterEn=item.letter_en,
                orderIndex=item.order_index,
                practiceImageUrl=item.practice_image_url,
            )
            for item in session.items
        ],
        isComplete=session.is_complete,
        attempts=session.attempts,
        avgScore=session.avg_score,
    )


@router.post(
    "/chapters/{chapter_id}/practice/result",
    response_model=ChapterPracticeResultResponse,
)
def record_chapter_practice_result(
    chapter_id: int,
    body: ChapterPracticeResultRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ChapterPracticeResultResponse:
    svc = FingerChapterPracticeService(db)
    result = svc.record_session_result(
        user_id=user.id,
        chapter_id=chapter_id,
        avg_score=body.avgScore,
        is_complete=body.isComplete,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter not found",
        )
    return ChapterPracticeResultResponse(
        chapterId=result.chapter_id,
        practiceId=result.practice_id,
        avgScore=result.avg_score,
        isComplete=result.is_complete,
        attempts=result.attempts,
    )
