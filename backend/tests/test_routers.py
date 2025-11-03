"""ルーターモジュールのユニットテスト"""

import sys
from pathlib import Path

import pytest

# backend ディレクトリをパスに追加
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


class TestConvertRouter:
    """convertルーターのテストクラス"""

    def test_router_exists(self):
        """ルーターが存在することのテスト"""
        from routers import convert

        assert hasattr(convert, "router")
        assert convert.router is not None

    def test_router_prefix(self):
        """ルータープレフィックスのテスト"""
        from routers import convert

        assert convert.router.prefix == "/api"

    def test_router_tags(self):
        """ルータータグのテスト"""
        from routers import convert

        # タグが設定されていることを確認
        assert hasattr(convert.router, "tags")


class TestHealthRouter:
    """healthルーターのテストクラス"""

    def test_router_exists(self):
        """ルーターが存在することのテスト"""
        from routers import health

        assert hasattr(health, "router")
        assert health.router is not None

    def test_router_prefix(self):
        """ルータープレフィックスのテスト"""
        from routers import health

        assert health.router.prefix == "/api"

    def test_router_tags(self):
        """ルータータグのテスト"""
        from routers import health

        # タグが設定されていることを確認
        assert hasattr(health.router, "tags")


class TestConvertEndpointLogic:
    """変換エンドポイントのロジックテスト"""

    def test_convert_endpoint_exists(self):
        """変換エンドポイントが存在することのテスト"""
        from routers.convert import convert_image

        assert convert_image is not None
        assert callable(convert_image)


class TestHealthEndpointLogic:
    """ヘルスチェックエンドポイントのロジックテスト"""

    @pytest.mark.asyncio
    async def test_health_check_endpoint(self):
        """ヘルスチェックエンドポイントのテスト"""
        from routers.health import health_check

        # エンドポイントを呼び出し
        response = await health_check()

        # レスポンスの検証
        assert response is not None
        assert hasattr(response, "status")
        assert hasattr(response, "version")
        assert response.status == "healthy"
        assert response.version == "2.0.0"
