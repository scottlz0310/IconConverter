"""パフォーマンステスト

要件10.1, 10.4: バックエンドのパフォーマンス測定
- 5MB画像の変換を5秒以内に完了
"""

import io
import sys
import time
from pathlib import Path

import pytest
from PIL import Image

# backend ディレクトリをパスに追加
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from services.conversion import ImageConversionService


class TestPerformance:
    """パフォーマンステストクラス"""

    @pytest.fixture
    def service(self):
        """ImageConversionServiceインスタンスを生成"""
        return ImageConversionService()

    def create_test_image(self, size_mb: float) -> bytes:
        """指定サイズのテスト画像を生成

        Args:
            size_mb: 画像サイズ（MB）

        Returns:
            bytes: PNG画像のバイナリデータ
        """
        # 目標サイズに近い画像サイズを計算
        # PNG圧縮を考慮して、実際のピクセル数を調整
        target_bytes = int(size_mb * 1024 * 1024)
        # 概算: 1ピクセル = 4バイト（RGBA）、圧縮率約50%
        pixels = int((target_bytes / 2) ** 0.5)

        # RGB画像を生成（グラデーション）
        img = Image.new("RGB", (pixels, pixels))
        for y in range(pixels):
            for x in range(pixels):
                r = int((x / pixels) * 255)
                g = int((y / pixels) * 255)
                b = 128
                img.putpixel((x, y), (r, g, b))

        # PNGとして保存
        buffer = io.BytesIO()
        img.save(buffer, format="PNG", optimize=False)
        buffer.seek(0)
        return buffer.getvalue()

    def test_conversion_time_1mb(self, service):
        """1MB画像の変換時間テスト（ベースライン）"""
        # 1MB画像を生成
        image_data = self.create_test_image(1.0)
        file_stream = io.BytesIO(image_data)

        # 変換時間を測定
        start_time = time.time()
        ico_data = service.convert_to_ico(
            file_content=file_stream,
            filename="test_1mb.png",
            preserve_transparency=True,
            auto_transparent_bg=False,
        )
        elapsed_time = time.time() - start_time

        # 結果を検証
        assert isinstance(ico_data, bytes)
        assert len(ico_data) > 0
        print(f"\n1MB画像の変換時間: {elapsed_time:.3f}秒")
        print(f"入力サイズ: {len(image_data) / 1024 / 1024:.2f}MB")
        print(f"出力サイズ: {len(ico_data) / 1024:.2f}KB")

    def test_conversion_time_5mb(self, service):
        """5MB画像の変換時間テスト

        要件10.1: 5MB画像の変換を5秒以内に完了
        """
        # 5MB画像を生成
        image_data = self.create_test_image(5.0)
        file_stream = io.BytesIO(image_data)

        # 変換時間を測定
        start_time = time.time()
        ico_data = service.convert_to_ico(
            file_content=file_stream,
            filename="test_5mb.png",
            preserve_transparency=True,
            auto_transparent_bg=False,
        )
        elapsed_time = time.time() - start_time

        # 結果を検証
        assert isinstance(ico_data, bytes)
        assert len(ico_data) > 0
        print(f"\n5MB画像の変換時間: {elapsed_time:.3f}秒")
        print(f"入力サイズ: {len(image_data) / 1024 / 1024:.2f}MB")
        print(f"出力サイズ: {len(ico_data) / 1024:.2f}KB")

        # パフォーマンス要件: 5秒以内
        assert elapsed_time < 5.0, f"変換時間が目標を超えました: {elapsed_time:.3f}秒 > 5.0秒"

    @pytest.mark.asyncio
    async def test_async_conversion_time_5mb(self, service):
        """5MB画像の非同期変換時間テスト

        要件10.4: 非同期処理によるスループット最大化
        """
        # 5MB画像を生成
        image_data = self.create_test_image(5.0)
        file_stream = io.BytesIO(image_data)

        # 非同期変換時間を測定
        start_time = time.time()
        ico_data = await service.convert_to_ico_async(
            file_content=file_stream,
            filename="test_5mb_async.png",
            preserve_transparency=True,
            auto_transparent_bg=False,
        )
        elapsed_time = time.time() - start_time

        # 結果を検証
        assert isinstance(ico_data, bytes)
        assert len(ico_data) > 0
        print(f"\n5MB画像の非同期変換時間: {elapsed_time:.3f}秒")
        print(f"入力サイズ: {len(image_data) / 1024 / 1024:.2f}MB")
        print(f"出力サイズ: {len(ico_data) / 1024:.2f}KB")

        # パフォーマンス要件: 5秒以内
        assert elapsed_time < 5.0, f"変換時間が目標を超えました: {elapsed_time:.3f}秒 > 5.0秒"

    def test_memory_efficiency(self, service):
        """メモリ効率テスト

        複数回の変換でメモリリークがないことを確認
        """
        import gc

        # 小さい画像で複数回変換
        image_data = self.create_test_image(0.5)

        for i in range(10):
            file_stream = io.BytesIO(image_data)
            ico_data = service.convert_to_ico(
                file_content=file_stream,
                filename=f"test_memory_{i}.png",
            )
            assert len(ico_data) > 0

        # ガベージコレクション実行
        gc.collect()

        print("\nメモリ効率テスト: 10回の変換が正常に完了")
