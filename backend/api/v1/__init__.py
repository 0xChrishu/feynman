from fastapi import APIRouter
from api.v1 import learning, auth, sessions, statistics, flashcards

router = APIRouter(prefix="/v1", tags=["v1"])

router.include_router(learning.router, prefix="/learning", tags=["learning"])
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
router.include_router(statistics.router, prefix="/statistics", tags=["statistics"])
router.include_router(flashcards.router, tags=["flashcards"])
