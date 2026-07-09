"""Word detection chapter practice routes.

GET  /api/word_detection/chapters/{chapter_id}/practice
POST /api/word_detection/chapters/{chapter_id}/practice/result
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.api.deps import get_current_user, get_db, get_optional_user
from src.models.user import User
from src.schemas.word_detection import (
    WdChapterPracticeResultRequest,
    WdChapterPracticeResultResponse,
    WdChapterPracticeResponse,
    WdPracticeItemResponse,
)
from src.services.word_detection.word_detection_chapter_practice_service import (
    WordDetectionChapterPracticeService,
)

router = APIRouter(
    prefix="/api/word_detection",
    tags=["word-detection-chapter-practice"],
)


@router.get(
    "/chapters/{chapter_id}/practice",
    response_model=WdChapterPracticeResponse,
)
def get_chapter_practice(
    chapter_id: int,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> WdChapterPracticeResponse:
    svc = WordDetectionChapterPracticeService(db)
    user_id = user.id if user else None
    session = svc.get_practice_session(user_id, chapter_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chapter not found",
        )
    return WdChapterPracticeResponse(
        chapterId=session.chapter_id,
        chapterTitle=session.chapter_title,
        chapterTitleKh=session.chapter_title_kh,
        unitId=session.unit_id,
        unitTitle=session.unit_title,
        unitTitleKh=session.unit_title_kh,
        isUnlocked=session.is_unlocked,
        practiceId=session.practice_id,
        items=[
            WdPracticeItemResponse(
                lessonId=item.lesson_id,
                wordId=item.word_id,
                wordKh=item.word_kh,
                wordEn=item.word_en,
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
    response_model=WdChapterPracticeResultResponse,
)
def record_chapter_practice_result(
    chapter_id: int,
    body: WdChapterPracticeResultRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> WdChapterPracticeResultResponse:
    svc = WordDetectionChapterPracticeService(db)
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
    return WdChapterPracticeResultResponse(
        chapterId=result.chapter_id,
        practiceId=result.practice_id,
        avgScore=result.avg_score,
        isComplete=result.is_complete,
        attempts=result.attempts,
    )
