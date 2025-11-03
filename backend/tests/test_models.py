"""Pydanticモデルのユニットテスト"""

import sys
from pathlib import Path

import pytest
from pydantic import ValidationError

# backend ディレクトリをパスに追加
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from models import (  # noqa: E402
    ConversionRequest,
    ConversionResponse,
    ErrorResponse,
    HealthResponse,
)


class TestConversionRequest:
    """ConversionRequestモデルのテストクラス"""

    def test_default_values(self):
        """デフォルト値のテスト"""
        request = ConversionRequest()
        assert request.preserve_transparency is True
        assert request.auto_transparent_bg is False

    def test_custom_values(self):
        """カスタム値のテスト"""
        request = ConversionRequest(
            preserve_transparency=False,
            auto_transparent_bg=True,
        )
        assert request.preserve_transparency is False
        assert request.auto_transparent_bg is True

    def test_both_true_allowed(self):
        """両方Trueの場合のテスト（許可される）"""
        # 両方Trueは技術的には許可される（ロジック側で処理）
        request = ConversionRequest(
            preserve_transparency=True,
            auto_transparent_bg=True,
        )
        assert request.preserve_transparency is True
        assert request.auto_transparent_bg is True

    def test_both_false_allowed(self):
        """両方Falseの場合のテスト"""
        request = ConversionRequest(
            preserve_transparency=False,
            auto_transparent_bg=False,
        )
        assert request.preserve_transparency is False
        assert request.auto_transparent_bg is False

    def test_json_serialization(self):
        """JSON シリアライゼーションのテスト"""
        request = ConversionRequest(
            preserve_transparency=True,
            auto_transparent_bg=False,
        )
        json_data = request.model_dump()
        assert json_data["preserve_transparency"] is True
        assert json_data["auto_transparent_bg"] is False

    def test_json_deserialization(self):
        """JSON デシリアライゼーションのテスト"""
        json_data = {
            "preserve_transparency": False,
            "auto_transparent_bg": True,
        }
        request = ConversionRequest(**json_data)
        assert request.preserve_transparency is False
        assert request.auto_transparent_bg is True


class TestConversionResponse:
    """ConversionResponseモデルのテストクラス"""

    def test_creation(self):
        """レスポンスモデルの作成テスト"""
        response = ConversionResponse(
            filename="test.ico",
            size_bytes=1024,
            transparency_mode="preserve",
        )
        assert response.filename == "test.ico"
        assert response.size_bytes == 1024
        assert response.transparency_mode == "preserve"

    def test_transparency_mode_preserve(self):
        """透明度保持モードのテスト"""
        response = ConversionResponse(
            filename="test.ico",
            size_bytes=1024,
            transparency_mode="preserve",
        )
        assert response.transparency_mode == "preserve"

    def test_transparency_mode_auto(self):
        """自動透明化モードのテスト"""
        response = ConversionResponse(
            filename="test.ico",
            size_bytes=1024,
            transparency_mode="auto",
        )
        assert response.transparency_mode == "auto"

    def test_transparency_mode_none(self):
        """透明化なしモードのテスト"""
        response = ConversionResponse(
            filename="test.ico",
            size_bytes=1024,
            transparency_mode="none",
        )
        assert response.transparency_mode == "none"

    def test_invalid_transparency_mode(self):
        """無効な透明化モードのテスト"""
        with pytest.raises(ValidationError):
            ConversionResponse(
                filename="test.ico",
                size_bytes=1024,
                transparency_mode="invalid",  # type: ignore
            )

    def test_json_serialization(self):
        """JSON シリアライゼーションのテスト"""
        response = ConversionResponse(
            filename="test.ico",
            size_bytes=2048,
            transparency_mode="auto",
        )
        json_data = response.model_dump()
        assert json_data["filename"] == "test.ico"
        assert json_data["size_bytes"] == 2048
        assert json_data["transparency_mode"] == "auto"


class TestHealthResponse:
    """HealthResponseモデルのテストクラス"""

    def test_healthy_status(self):
        """健全ステータスのテスト"""
        response = HealthResponse(
            status="healthy",
            version="2.0.0",
        )
        assert response.status == "healthy"
        assert response.version == "2.0.0"

    def test_unhealthy_status(self):
        """不健全ステータスのテスト"""
        response = HealthResponse(
            status="unhealthy",
            version="2.0.0",
        )
        assert response.status == "unhealthy"

    def test_invalid_status(self):
        """無効なステータスのテスト"""
        with pytest.raises(ValidationError):
            HealthResponse(
                status="unknown",  # type: ignore
                version="2.0.0",
            )

    def test_json_serialization(self):
        """JSON シリアライゼーションのテスト"""
        response = HealthResponse(
            status="healthy",
            version="2.0.0",
        )
        json_data = response.model_dump()
        assert json_data["status"] == "healthy"
        assert json_data["version"] == "2.0.0"


class TestErrorResponse:
    """ErrorResponseモデルのテストクラス"""

    def test_with_error_code(self):
        """エラーコード付きレスポンスのテスト"""
        response = ErrorResponse(
            detail="ファイルサイズが大きすぎます",
            error_code="FILE_TOO_LARGE",
        )
        assert response.detail == "ファイルサイズが大きすぎます"
        assert response.error_code == "FILE_TOO_LARGE"

    def test_without_error_code(self):
        """エラーコードなしレスポンスのテスト"""
        response = ErrorResponse(
            detail="エラーが発生しました",
        )
        assert response.detail == "エラーが発生しました"
        assert response.error_code is None

    def test_json_serialization_with_code(self):
        """エラーコード付きJSON シリアライゼーションのテスト"""
        response = ErrorResponse(
            detail="無効なファイル形式です",
            error_code="INVALID_FORMAT",
        )
        json_data = response.model_dump()
        assert json_data["detail"] == "無効なファイル形式です"
        assert json_data["error_code"] == "INVALID_FORMAT"

    def test_json_serialization_without_code(self):
        """エラーコードなしJSON シリアライゼーションのテスト"""
        response = ErrorResponse(
            detail="エラーが発生しました",
        )
        json_data = response.model_dump()
        assert json_data["detail"] == "エラーが発生しました"
        assert json_data["error_code"] is None

