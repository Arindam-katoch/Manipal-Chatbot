from fastapi import APIRouter
# from schemas import PlacementStatSchema, AIResponseSchema

router = APIRouter(
    prefix="/mock",
    tags=["Mock API"]
)

@router.get("/placement-stats")
async def get_mock_placement_stats():
    """Returns dummy placement data."""
    return {
        "status": "success",
        "data": {
            "total_students": 500,
            "placed_students": 420,
            "top_companies": ["Google", "Microsoft", "Amazon", "LocalTech"],
            "average_salary_lpa": 12.5,
            "highest_salary_lpa": 45.0
        }
    }

@router.post("/ai-chat")
async def get_mock_ai_response(user_message: dict):
    """Returns a static AI response."""
    return {
        "status": "success",
        "data": {
            "role": "ai",
            "message": "Hello! I am the mock AI. Here are some bullet points to test formatting:\n- Point A\n- Point B",
            "confidence_score": 0.95
        }
    }
