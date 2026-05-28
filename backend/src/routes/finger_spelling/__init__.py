"""Composed finger spelling API router."""

from fastapi import APIRouter

from .finger_curriculum import router as curriculum_router
from .finger_exercise import router as exercise_router
from .finger_practice import router as practice_router
from .finger_progress import router as progress_router

router = APIRouter(tags=["finger-spelling"])
router.include_router(curriculum_router)
router.include_router(practice_router)
router.include_router(exercise_router)
router.include_router(progress_router)
