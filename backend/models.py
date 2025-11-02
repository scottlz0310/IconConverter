"""Pydantic models for request/response validation."""

from typing import Literal

from pydantic import BaseModel, Field


class ConversionRequest(BaseModel):
    """画像変換リクエストモデル.

    Attributes:
        preserve_transparency: 既存の透明度を保持するかどうか（デフォルト: True）
        auto_transparent_bg: 自動背景透明化を行うかどうか（デフォルト: False）
    """

    preserve_transparency: bool = Field(
        default=True,
        description="既存の透明度を保持する（PNG, GIF, WebP）",
    )
    auto_transparent_bg: bool = Field(
        default=False,
        description="自動背景透明化（四隅のピクセルから単色背景を検出）",
    )

    class Config:
        """Pydantic設定."""

        json_schema_extra = {
            "example": {
                "preserve_transparency": True,
                "auto_transparent_bg": False,
            },
        }


class ConversionResponse(BaseModel):
    """画像変換レスポンスモデル（メタデータ）.

    Attributes:
        filename: 生成されたICOファイル名
        size_bytes: ファイルサイズ（バイト）
        transparency_mode: 透明化モード
    """

    filename: str = Field(description="生成されたICOファイル名")
    size_bytes: int = Field(description="ファイルサイズ（バイト）", gt=0)
    transparency_mode: Literal["preserve", "auto", "none"] = Field(description="透明化モード")

    class Config:
        """Pydantic設定."""

        json_schema_extra = {
            "example": {
                "filename": "output.ico",
                "size_bytes": 12345,
                "transparency_mode": "preserve",
            },
        }


class HealthResponse(BaseModel):
    """ヘルスチェックレスポンスモデル.

    Attributes:
        status: サービスの状態
        version: APIバージョン
    """

    status: Literal["healthy", "unhealthy"] = Field(description="サービスの状態")
    version: str = Field(description="APIバージョン")

    class Config:
        """Pydantic設定."""

        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "2.0.0",
            },
        }


class ErrorResponse(BaseModel):
    """エラーレスポンスモデル.

    Attributes:
        detail: エラーメッセージ
        error_code: エラーコード（オプション）
    """

    detail: str = Field(description="エラーメッセージ")
    error_code: str | None = Field(
        default=None,
        description="エラーコード（INVALID_FORMAT, FILE_TOO_LARGE等）",
    )

    class Config:
        """Pydantic設定."""

        json_schema_extra = {
            "example": {
                "detail": "対応していないファイル形式です",
                "error_code": "INVALID_FORMAT",
            },
        }
