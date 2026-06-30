"""Composed word detection API router (learner-facing + admin)."""

from fastapi import APIRouter

from .word_detection_curriculum import router as curriculum_router
from .word_detection_exercise import router as exercise_router
from .word_detection_progress import router as progress_router
from .word_predict_ws import handle_websocket

router = APIRouter(tags=["word-detection"])
router.include_router(curriculum_router)
router.include_router(exercise_router)
router.include_router(progress_router)

# WebSocket endpoint for real-time word prediction
# Full path: /api/word_detection/ws/predict
router.websocket("/api/word_detection/ws/predict")(handle_websocket)
