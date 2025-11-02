"""FastAPI application for Image to ICO converter."""

import os
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from core.logger import setup_logger
from exceptions import (
    ConversionFailedError,
    FileSizeExceededError,
    InvalidFileFormatError,
)
from routers import convert, health

# ロガーのセットアップ
log_level = os.getenv("LOG_LEVEL", "INFO")
setup_logger(log_level)

# レート制限の設定
limiter = Limiter(key_func=get_remote_address)

# アプリケーションインスタンスの作成
app = FastAPI(
    title="Image to ICO Converter API",
    description="Convert images to ICO format with transparency support",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# レート制限をアプリケーションに追加
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ロギングミドルウェア
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """リクエストとレスポンスをログに記録するミドルウェア

    Args:
        request: リクエストオブジェクト
        call_next: 次のミドルウェアまたはエンドポイント

    Returns:
        Response: レスポンスオブジェクト
    """
    # リクエストIDを生成
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id

    # リクエスト開始時刻
    start_time = time.time()

    # リクエスト情報をログに記録
    logger.info(
        "Request started",
        extra={
            "request_id": request_id,
            "method": request.method,
            "url": str(request.url),
            "client_host": request.client.host if request.client else None,
        },
    )

    # 次の処理を実行
    try:
        response = await call_next(request)

        # 処理時間を計算
        process_time = time.time() - start_time

        # レスポンス情報をログに記録
        logger.info(
            "Request completed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "url": str(request.url),
                "status_code": response.status_code,
                "process_time": f"{process_time:.3f}s",
            },
        )

        # レスポンスヘッダーにリクエストIDを追加
        response.headers["X-Request-ID"] = request_id

        return response

    except Exception as exc:
        # エラー情報をログに記録
        process_time = time.time() - start_time
        logger.error(
            "Request failed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "url": str(request.url),
                "error": str(exc),
                "error_type": type(exc).__name__,
                "process_time": f"{process_time:.3f}s",
            },
        )
        raise


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


# ルーターを登録
app.include_router(convert.router)
app.include_router(health.router)


# カスタム例外ハンドラー
@app.exception_handler(InvalidFileFormatError)
async def invalid_format_handler(request: Request, exc: InvalidFileFormatError) -> JSONResponse:
    """無効なファイル形式エラーのハンドラー

    Args:
        request: リクエストオブジェクト
        exc: 例外オブジェクト

    Returns:
        JSONResponse: エラーレスポンス（415 Unsupported Media Type）
    """
    logger.warning(f"Invalid file format: {exc}")
    return JSONResponse(
        status_code=415,
        content={
            "detail": str(exc),
            "error_code": "INVALID_FORMAT",
        },
    )


@app.exception_handler(FileSizeExceededError)
async def file_size_handler(request: Request, exc: FileSizeExceededError) -> JSONResponse:
    """ファイルサイズ超過エラーのハンドラー

    Args:
        request: リクエストオブジェクト
        exc: 例外オブジェクト

    Returns:
        JSONResponse: エラーレスポンス（413 Payload Too Large）
    """
    logger.warning(f"File size exceeded: {exc}")
    return JSONResponse(
        status_code=413,
        content={
            "detail": str(exc),
            "error_code": "FILE_TOO_LARGE",
        },
    )


@app.exception_handler(ConversionFailedError)
async def conversion_failed_handler(request: Request, exc: ConversionFailedError) -> JSONResponse:
    """変換失敗エラーのハンドラー

    Args:
        request: リクエストオブジェクト
        exc: 例外オブジェクト

    Returns:
        JSONResponse: エラーレスポンス（500 Internal Server Error）
    """
    logger.error(f"Conversion failed: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "error_code": "CONVERSION_FAILED",
        },
    )


@app.get("/")
async def root() -> dict[str, str]:
    """ルートエンドポイント."""
    return {
        "message": "Image to ICO Converter API",
        "version": "2.0.0",
        "docs": "/docs",
    }
