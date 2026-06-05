"""Generic CRUD data access for any SQLAlchemy model.

This repository is intentionally model-agnostic so the same code drives admin
content management for every learning track (Finger Spelling, Word Sign, ...).
It assumes the bound model exposes an ``id`` primary key and, for soft delete,
an ``is_active`` boolean column.
"""

from __future__ import annotations

from typing import Any, Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.db.session import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseCrudRepository(Generic[ModelT]):
    def __init__(self, db: Session, model: type[ModelT]) -> None:
        self.db = db
        self.model = model

    def list(
        self,
        *,
        filters: dict[str, Any] | None = None,
        active_only: bool = False,
        order_by: list | None = None,
    ) -> list[ModelT]:
        stmt = select(self.model)
        for column, value in (filters or {}).items():
            stmt = stmt.where(getattr(self.model, column) == value)
        if active_only and hasattr(self.model, "is_active"):
            stmt = stmt.where(self.model.is_active.is_(True))
        if order_by:
            stmt = stmt.order_by(*order_by)
        return list(self.db.scalars(stmt).all())

    def get(self, obj_id: int) -> ModelT | None:
        return self.db.get(self.model, obj_id)

    def create(self, **kwargs: Any) -> ModelT:
        obj = self.model(**kwargs)
        self.db.add(obj)
        self.db.flush()
        return obj

    def update(self, obj: ModelT, data: dict[str, Any]) -> ModelT:
        for key, value in data.items():
            setattr(obj, key, value)
        self.db.flush()
        return obj

    def soft_delete(self, obj: ModelT) -> ModelT:
        """Mark a record inactive instead of removing it."""
        if hasattr(obj, "is_active"):
            obj.is_active = False
            self.db.flush()
        return obj

    def hard_delete(self, obj: ModelT) -> None:
        self.db.delete(obj)
        self.db.flush()

    def count(self, **filters: Any) -> int:
        stmt = select(func.count()).select_from(self.model)
        for column, value in filters.items():
            stmt = stmt.where(getattr(self.model, column) == value)
        return int(self.db.scalar(stmt) or 0)
