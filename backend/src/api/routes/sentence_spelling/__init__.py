"""Composed sentence-spelling API router (learner-facing).

Admin content management lives in ``src.api.routes.admin`` (centralized, multi-track).
"""

from fastapi import APIRouter

from .sentence_hand_predict import router as hand_predict_router
from .sentence_hand_predict_ws import handle_websocket
from .sentence_spelling_curriculum import router as curriculum_router
from .sentence_spelling_practice import router as practice_router

router = APIRouter(tags=["sentence-spelling"])
router.include_router(curriculum_router)
router.include_router(practice_router)
router.include_router(hand_predict_router)

# WebSocket endpoint for real-time prediction
# Full path: /api/sentence_spelling/ws/predict
router.websocket("/api/sentence_spelling/ws/predict")(handle_websocket)
