"""Composed finger spelling API router (learner-facing).

Admin content management lives in ``src.api.routes.admin`` (centralized, multi-track).
"""

from fastapi import APIRouter

from .finger_curriculum import router as curriculum_router
from .finger_exercise import router as exercise_router
from .finger_hand_predict import router as hand_predict_router
from .finger_hand_predict_ws import handle_websocket
from .finger_practice import router as practice_router
from .finger_progress import router as progress_router

practice_router.include_router(hand_predict_router)

router = APIRouter(tags=["finger-spelling"])
router.include_router(curriculum_router)
router.include_router(practice_router)
router.include_router(exercise_router)
router.include_router(progress_router)

# WebSocket endpoint for real-time prediction
# Full path: /api/finger_spelling/ws/predict (the parent api_router has no prefix,
# this router has no prefix either, so we include the full path here)
router.websocket("/api/finger_spelling/ws/predict")(handle_websocket)
