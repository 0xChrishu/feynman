from fastapi import APIRouter

router = APIRouter(prefix="/v2", tags=["v2"])

# v2 API will be used for new features like:
# - Learning paths
# - Multi-modal input
# - Voice features
# - Achievements

@router.get("/info")
async def v2_info():
    """V2 API information endpoint"""
    return {
        "version": "2.0",
        "status": "in_development",
        "features": [
            "Learning paths (coming soon)",
            "Multi-modal input (coming soon)",
            "Voice interaction (coming soon)",
            "Achievements (coming soon)"
        ]
    }
