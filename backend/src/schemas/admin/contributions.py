"""Admin contributions review schemas.

Defines response models for the /api/admin/contributions endpoints including
the curriculum tree with pending counts, contribution list items, and
contribution detail views.
"""

from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, Field


class ContributionTreeNode(BaseModel):
    """A node in the curriculum hierarchy tree (unit/chapter/lesson).

    Each node has a type indicating its level in the hierarchy,
    a pending_count showing how many pending contributions exist
    at or below this node, and optional children for nested nodes.
    """

    id: int
    name_en: str
    name_kh: str
    node_type: str  # "unit" | "chapter" | "lesson"
    pending_count: int = 0
    children: List["ContributionTreeNode"] = []

    model_config = {"from_attributes": True}


class ContributionListItem(BaseModel):
    """Summary of a contribution for list display."""

    id: UUID
    contributor_name: str  # display_name or "Guest ({guest_id})"
    word_kh: str
    word_en: str | None = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ContributionDetail(ContributionListItem):
    """Full contribution detail including review metadata."""

    video_url: str | None = None
    word_id: int
    user_id: UUID | None = None
    guest_id: str | None = None
    reviewed_by: UUID | None = None
    reviewed_at: datetime | None = None
    rejection_reason: str | None = None


class RejectContributionRequest(BaseModel):
    """Request body for rejecting a contribution."""

    rejection_reason: str = Field(..., min_length=1, description="Reason for rejecting the contribution")
