"""Centralized admin content-management API router.

A single, track-parameterized admin surface for every learning track. All
endpoints require an admin account (``get_admin_user``) and live under
``/api/admin/{track}/...`` where ``track`` is resolved by the track registry
(currently ``finger``; ``sign`` becomes available once its models exist).
"""

from fastapi import APIRouter

from .curriculum import router as curriculum_router
from .exercise import router as exercise_router

router = APIRouter()
router.include_router(curriculum_router)
router.include_router(exercise_router)
