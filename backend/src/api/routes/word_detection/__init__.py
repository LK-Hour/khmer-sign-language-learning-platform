"""Composed word detection API router (learner-facing + admin)."""

from fastapi import APIRouter

from .word_detection_curriculum import router as curriculum_router
from .word_detection_exercise import router as exercise_router
from .word_detection_progress import router as progress_router

router = APIRouter(tags=["word-detection"])
router.include_router(curriculum_router)
router.include_router(exercise_router)
router.include_router(progress_router)
