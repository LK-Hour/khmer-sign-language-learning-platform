"""Application API router.

Route modules live under ``src.api.routes``; endpoint paths stay defined in the
individual modules so moving files does not change the public API.
"""

from fastapi import APIRouter

from src.api.routes.admin.curriculum import router as admin_curriculum_router
from src.api.routes.admin.exercise import router as admin_exercise_router
from src.api.routes.auth_session import router as auth_session_router
from src.api.routes.curriculum import router as curriculum_router
from src.api.routes.dictionary import router as dictionary_router
from src.api.routes.feedback import router as feedback_router
from src.api.routes.finger_spelling import router as finger_spelling_router
from src.api.routes.oauth import router as oauth_router
from src.api.routes.users import router as users_router
from src.api.routes.word_detection import router as word_detection_router

router = APIRouter()
router.include_router(oauth_router)
router.include_router(auth_session_router)
router.include_router(users_router)
router.include_router(curriculum_router)
router.include_router(dictionary_router)
router.include_router(feedback_router)
router.include_router(finger_spelling_router)
router.include_router(word_detection_router)
router.include_router(admin_curriculum_router)
router.include_router(admin_exercise_router)
