"""Admin contributions review routes.

Provides endpoints for reviewing, approving, and rejecting user-submitted
word detection video contributions. Includes a curriculum tree view with
pending contribution counts per node.

    /api/admin/contributions/tree          GET
    /api/admin/contributions               GET
    /api/admin/contributions/{id}          GET
    /api/admin/contributions/{id}/approve  PUT
    /api/admin/contributions/{id}/reject   PUT
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

import redis as redis_lib

from src.api.deps import get_admin_user, get_db
from src.core.cache import cache_get, cache_invalidate, cache_set
from src.core.redis import get_redis
from src.models.user import User
from src.models.word_detection import (
    WordDetectionChapter,
    WordDetectionContribution,
    WordDetectionLesson,
    WordDetectionUnit,
)
from src.schemas.admin.contributions import (
    ContributionDetail,
    ContributionListItem,
    ContributionTreeNode,
    RejectContributionRequest,
)

router = APIRouter(
    prefix="/api/admin/contributions",
    tags=["admin-contributions"],
    dependencies=[Depends(get_admin_user)],
)


def _get_contributor_name(contribution: WordDetectionContribution) -> str:
    """Get contributor display name from user or guest_id."""
    if contribution.user is not None:
        return contribution.user.display_name
    if contribution.guest_id:
        return f"Guest ({contribution.guest_id})"
    return "Unknown"


def _get_video_url(contribution: WordDetectionContribution) -> str | None:
    """Construct video URL from the associated contribution_media or filename."""
    if contribution.contribution_media is not None:
        return contribution.contribution_media.file_url
    # Fallback: construct from filename and word
    if contribution.filename and contribution.word:
        from src.services.word_detection.word_detection_contribution_service import (
            _safe_path_part,
        )

        word_part = _safe_path_part(contribution.word.word_kh)
        return f"/data_set/word_detection_contributions/{word_part}/{contribution.filename}"
    return None


def _build_contribution_detail(contribution: WordDetectionContribution) -> ContributionDetail:
    """Build a ContributionDetail response from a contribution ORM object."""
    return ContributionDetail(
        id=contribution.id,
        contributor_name=_get_contributor_name(contribution),
        word_kh=contribution.word.word_kh if contribution.word else "",
        word_en=contribution.word.word_en if contribution.word else None,
        status=contribution.status,
        created_at=contribution.created_at,
        video_url=_get_video_url(contribution),
        word_id=contribution.word_id,
        user_id=contribution.user_id,
        guest_id=contribution.guest_id,
        reviewed_by=contribution.reviewed_by,
        reviewed_at=contribution.reviewed_at,
        rejection_reason=contribution.rejection_reason,
    )


@router.get("/tree", response_model=list[ContributionTreeNode])
def get_contribution_tree(
    db: Session = Depends(get_db),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Return curriculum hierarchy (units → chapters → lessons) with pending counts.

    Builds a tree of units → chapters → lessons. For each lesson, counts the
    number of pending contributions linked via word_detection_lesson_id.
    Pending counts aggregate upward: chapter pending_count = sum of its lessons'
    pending counts, unit pending_count = sum of its chapters' pending counts.
    """
    # Check cache first (short TTL since pending counts change on approve/reject)
    cache_key = "ksl:cache:contributions:tree"
    cached = cache_get(rc, cache_key)
    if cached is not None:
        return cached

    # Get pending contribution counts grouped by lesson_id
    pending_counts_query = (
        select(
            WordDetectionContribution.word_detection_lesson_id,
            func.count(WordDetectionContribution.id).label("pending_count"),
        )
        .where(WordDetectionContribution.status == "pending")
        .where(WordDetectionContribution.word_detection_lesson_id.isnot(None))
        .group_by(WordDetectionContribution.word_detection_lesson_id)
    )
    pending_rows = db.execute(pending_counts_query).all()
    lesson_pending_map: dict[int, int] = {
        row.word_detection_lesson_id: row.pending_count for row in pending_rows
    }

    # Fetch all units ordered by order_index
    units = (
        db.execute(
            select(WordDetectionUnit).order_by(WordDetectionUnit.order_index)
        )
        .scalars()
        .all()
    )

    # Fetch all chapters ordered by unit_id, order_index
    chapters = (
        db.execute(
            select(WordDetectionChapter).order_by(
                WordDetectionChapter.unit_id, WordDetectionChapter.order_index
            )
        )
        .scalars()
        .all()
    )

    # Fetch all lessons ordered by chapter_id, order_index
    lessons = (
        db.execute(
            select(WordDetectionLesson).order_by(
                WordDetectionLesson.chapter_id, WordDetectionLesson.order_index
            )
        )
        .scalars()
        .all()
    )

    # Build lesson nodes
    chapter_lessons_map: dict[int, list[ContributionTreeNode]] = {}
    for lesson in lessons:
        pending = lesson_pending_map.get(lesson.id, 0)
        node = ContributionTreeNode(
            id=lesson.id,
            name_en=lesson.name_en,
            name_kh=lesson.name_kh,
            node_type="lesson",
            pending_count=pending,
            children=[],
        )
        chapter_lessons_map.setdefault(lesson.chapter_id, []).append(node)

    # Build chapter nodes with aggregated pending counts
    unit_chapters_map: dict[int, list[ContributionTreeNode]] = {}
    for chapter in chapters:
        chapter_children = chapter_lessons_map.get(chapter.id, [])
        chapter_pending = sum(child.pending_count for child in chapter_children)
        node = ContributionTreeNode(
            id=chapter.id,
            name_en=chapter.name_en,
            name_kh=chapter.name_kh,
            node_type="chapter",
            pending_count=chapter_pending,
            children=chapter_children,
        )
        unit_chapters_map.setdefault(chapter.unit_id, []).append(node)

    # Build unit nodes with aggregated pending counts
    tree: list[ContributionTreeNode] = []
    for unit in units:
        unit_children = unit_chapters_map.get(unit.id, [])
        unit_pending = sum(child.pending_count for child in unit_children)
        node = ContributionTreeNode(
            id=unit.id,
            name_en=unit.name_en,
            name_kh=unit.name_kh,
            node_type="unit",
            pending_count=unit_pending,
            children=unit_children,
        )
        tree.append(node)

    # Cache the tree for 60 seconds
    serialized = [n.model_dump(mode="json") for n in tree]
    cache_set(rc, cache_key, serialized, ttl=60)
    return tree


@router.get("", response_model=list[ContributionListItem])
def list_contributions(
    status_filter: str = Query("pending", alias="status"),
    word_id: int | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List contributions with optional status and word_id filters.

    Defaults to showing pending contributions. Supports pagination via skip/limit.
    """
    query = (
        select(WordDetectionContribution)
        .options(
            joinedload(WordDetectionContribution.user),
            joinedload(WordDetectionContribution.word),
        )
    )

    if status_filter and status_filter != "all":
        query = query.where(WordDetectionContribution.status == status_filter)

    if word_id is not None:
        query = query.where(WordDetectionContribution.word_id == word_id)

    query = query.order_by(WordDetectionContribution.created_at.desc())
    query = query.offset(skip).limit(limit)

    contributions = db.execute(query).unique().scalars().all()

    return [
        ContributionListItem(
            id=c.id,
            contributor_name=_get_contributor_name(c),
            word_kh=c.word.word_kh if c.word else "",
            word_en=c.word.word_en if c.word else None,
            status=c.status,
            created_at=c.created_at,
        )
        for c in contributions
    ]


@router.get("/{contribution_id}", response_model=ContributionDetail)
def get_contribution(
    contribution_id: UUID,
    db: Session = Depends(get_db),
):
    """Get full contribution detail including video URL, word info, and review metadata."""
    contribution = (
        db.execute(
            select(WordDetectionContribution)
            .options(
                joinedload(WordDetectionContribution.user),
                joinedload(WordDetectionContribution.word),
                joinedload(WordDetectionContribution.contribution_media),
            )
            .where(WordDetectionContribution.id == contribution_id)
        )
        .unique()
        .scalar_one_or_none()
    )

    if contribution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contribution not found",
        )

    return _build_contribution_detail(contribution)


@router.put("/{contribution_id}/approve", response_model=ContributionDetail)
def approve_contribution(
    contribution_id: UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Set contribution status to approved with reviewer info."""
    contribution = (
        db.execute(
            select(WordDetectionContribution)
            .options(
                joinedload(WordDetectionContribution.user),
                joinedload(WordDetectionContribution.word),
                joinedload(WordDetectionContribution.contribution_media),
            )
            .where(WordDetectionContribution.id == contribution_id)
        )
        .unique()
        .scalar_one_or_none()
    )

    if contribution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contribution not found",
        )

    if contribution.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Contribution is not in pending status",
        )

    contribution.status = "approved"
    contribution.reviewed_by = admin.id
    contribution.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(contribution)

    cache_invalidate(rc, "ksl:cache:contributions:tree")
    return _build_contribution_detail(contribution)


@router.put("/{contribution_id}/reject", response_model=ContributionDetail)
def reject_contribution(
    contribution_id: UUID,
    body: RejectContributionRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
    rc: redis_lib.Redis = Depends(get_redis),
):
    """Set contribution status to rejected with rejection reason."""
    contribution = (
        db.execute(
            select(WordDetectionContribution)
            .options(
                joinedload(WordDetectionContribution.user),
                joinedload(WordDetectionContribution.word),
                joinedload(WordDetectionContribution.contribution_media),
            )
            .where(WordDetectionContribution.id == contribution_id)
        )
        .unique()
        .scalar_one_or_none()
    )

    if contribution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contribution not found",
        )

    if contribution.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Contribution is not in pending status",
        )

    contribution.status = "rejected"
    contribution.rejection_reason = body.rejection_reason
    contribution.reviewed_by = admin.id
    contribution.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(contribution)

    cache_invalidate(rc, "ksl:cache:contributions:tree")
    return _build_contribution_detail(contribution)
