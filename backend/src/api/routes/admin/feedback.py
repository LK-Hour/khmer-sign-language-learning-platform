"""Admin feedback routes.

    /api/admin/feedback                  GET   -paginated list of lesson feedback
    /api/admin/feedback/{id}             GET   -single feedback entry
    /api/admin/feedback/{id}             DELETE-soft-delete (is_active=false)
    /api/admin/feedback/{id}/restore     POST  -reactivate a feedback entry
"""

from __future__ import annotations

import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.api.deps import get_admin_user, get_db
from src.models.feedback import LessonFeedback
from src.models.user import User

router = APIRouter(
    prefix="/api/admin/feedback",
    tags=["admin-feedback"],
)


def _feedback_detail(fb: LessonFeedback) -> dict:
    return {
        "id": fb.id,
        "type": fb.type.value if fb.type else None,
        "category": fb.category,
        "lesson_id": fb.lesson_id,
        "characteristic": fb.characteristic,
        "mood": fb.mood.value if fb.mood else None,
        "comment": fb.comment,
        "is_active": fb.is_active,
        "created_at": fb.created_at.isoformat() if fb.created_at else None,
    }


@router.get("")
def list_feedback(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    mood: str | None = Query(None),
    feedback_type: str | None = Query(None, alias="type"),
    search: str | None = Query(None),
    include_inactive: bool = Query(False, description="Include soft-deleted feedback"),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """List feedback with pagination, optional mood and type filters.

    Soft-deleted entries are hidden unless ``include_inactive`` is set.
    """
    query = db.query(LessonFeedback)

    if not include_inactive:
        query = query.filter(LessonFeedback.is_active.is_(True))

    if mood:
        query = query.filter(LessonFeedback.mood == mood)
    if feedback_type:
        query = query.filter(LessonFeedback.type == feedback_type)
    if search:
        query = query.filter(
            LessonFeedback.comment.ilike(f"%{search}%")
            | LessonFeedback.category.ilike(f"%{search}%")
            | LessonFeedback.characteristic.ilike(f"%{search}%")
        )

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size

    items = query.order_by(LessonFeedback.id.asc()).offset(offset).limit(size).all()

    return {
        "items": [_feedback_detail(fb) for fb in items],
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }


@router.get("/{feedback_id}")
def get_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Get a single feedback entry by ID."""
    fb = db.query(LessonFeedback).filter(LessonFeedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return _feedback_detail(fb)


@router.delete("/{feedback_id}", status_code=204)
def soft_delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Soft-delete a feedback entry (``is_active=false``). The row is kept."""
    fb = db.query(LessonFeedback).filter(LessonFeedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    fb.is_active = False
    db.commit()


@router.post("/{feedback_id}/restore")
def restore_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Reactivate a soft-deleted feedback entry."""
    fb = db.query(LessonFeedback).filter(LessonFeedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    fb.is_active = True
    db.commit()
    db.refresh(fb)
    return _feedback_detail(fb)
