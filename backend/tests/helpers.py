"""Shared helpers for backend API tests."""

from __future__ import annotations

import uuid


def unique_suffix() -> str:
    return uuid.uuid4().hex[:8]


def safe_order_index(suffix: str | None = None) -> int:
    """Map a hex suffix to a PostgreSQL-safe positive order_index."""
    token = suffix or unique_suffix()
    return int(token, 16) % 1_000_000 + 1
