"""Shared FastAPI dependencies for API route modules."""

from src.db.session import get_db
from src.dependencies.auth import get_admin_user, get_current_user, get_optional_user

__all__ = [
    "get_admin_user",
    "get_current_user",
    "get_db",
    "get_optional_user",
]

