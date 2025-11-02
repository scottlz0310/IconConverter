"""FastAPI application for Image to ICO converter."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

# アプリケーションインスタンスの作成
app = FastAPI(
    title="Image to ICO Converter API",
    description="Convert images to ICO format with transparency support",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS設定
# 開発環境ではlocalhost:5173を許可、本番環境では環境変数で設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite開発サーバー
        "http://localhost:3000",  # 代替ポート
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event() -> None:
    """アプリケーション起動時の処理."""
    logger.info("Starting Image to ICO Converter API v2.0.0")


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """アプリケーション終了時の処理."""
    logger.info("Shutting down Image to ICO Converter API")


@app.get("/")
async def root() -> dict[str, str]:
    """ルートエンドポイント."""
    return {
        "message": "Image to ICO Converter API",
        "version": "2.0.0",
        "docs": "/docs",
    }
