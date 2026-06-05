"""Application API router.

Route modules live under ``src.api.routes``; endpoint paths stay defined in the
individual modules so moving files does not change the public API.
"""

from fastapi import APIRouter

from src.api.routes.admin.exercise import router as admin_exercise_router
from src.api.routes.curriculum import router as curriculum_router
from src.api.routes.finger_spelling import router as finger_spelling_router
from src.api.routes.oauth import router as oauth_router
from src.api.routes.users import router as users_router

router = APIRouter()
router.include_router(oauth_router)
router.include_router(users_router)
router.include_router(curriculum_router)
router.include_router(finger_spelling_router)
router.include_router(admin_exercise_router)
