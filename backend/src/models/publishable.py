"""Publish-workflow mixin for admin-managed content tables.

Content lifecycle (single admin role, confirm-publish workflow):

- ``is_active``       soft-delete flag. DELETE sets it false, restore sets it
                      back to true. Inactive rows are never learner-visible.
- ``publish_status``  ``"draft"`` or ``"published"``. Admin creates and edits
                      always land in ``draft``; an explicit publish action
                      (confirm click in the admin UI) moves the row to
                      ``published``. Only ``published`` + active rows are
                      learner-visible.

``publish_status`` defaults to "published" at the model level so seed scripts
and direct ORM inserts stay learner-visible; the admin services explicitly
force "draft" on create/update.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, and_
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

PUBLISH_STATUS_DRAFT = "draft"
PUBLISH_STATUS_PUBLISHED = "published"
PUBLISH_STATUSES = (PUBLISH_STATUS_DRAFT, PUBLISH_STATUS_PUBLISHED)


class PublishableMixin:
    """Adds publish workflow columns to a content model."""

    publish_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=PUBLISH_STATUS_PUBLISHED,
        server_default=PUBLISH_STATUS_PUBLISHED,
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    published_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )


def live(model):
    """SQL predicate: row is learner-visible (active and, when the model is
    publishable, published)."""
    condition = model.is_active.is_(True)
    if hasattr(model, "publish_status"):
        condition = and_(condition, model.publish_status == PUBLISH_STATUS_PUBLISHED)
    return condition


def is_live(entity) -> bool:
    """Python-side counterpart of :func:`live` for loaded ORM instances."""
    if not entity.is_active:
        return False
    if hasattr(entity, "publish_status"):
        return entity.publish_status == PUBLISH_STATUS_PUBLISHED
    return True
