"""ヘルスチェックエンドポイント

GET /api/health - サービスの状態を確認
"""

from fastapi import APIRouter
from loguru import logger

from models import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="ヘルスチェック",
    description="APIサービスの状態とバージョン情報を返します。",
    responses={
        200: {
            "description": "サービスは正常に動作しています",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "version": "2.0.0",
                    },
                },
            },
        },
    },
)
async def health_check() -> HealthResponse:
    """ヘルスチェックエンドポイント

    サービスの状態とバージョン情報を返します。
    モニタリングやロードバランサーのヘルスチェックに使用できます。

    Returns:
        HealthResponse: サービスの状態とバージョン情報
    """
    logger.debug("Health check requested")

    return HealthResponse(
        status="healthy",
        version="2.0.0",
    )
