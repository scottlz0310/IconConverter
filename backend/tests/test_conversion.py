"""ImageConversionServiceのユニットテスト"""

import io
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

# backend ディレクトリをパスに追加
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from exceptions import ConversionFailedError  # noqa: E402
from services.conversion import ImageConversionService  # noqa: E402


class TestImageConversionService:
    """ImageConversionServiceのテストクラス"""

    @pytest.fixture
    def service(self):
        """ImageConversionServiceインスタンスを生成"""
        return ImageConversionService()

    def test_initialization(self, service):
        """サービスの初期化テスト"""
        assert service.converter is not None

    def test_create_temp_file(self, service):
        """一時ファイル作成のテスト"""
        temp_path = service._create_temp_file(".png")
        try:
            assert temp_path.exists()
            assert temp_path.suffix == ".png"
            assert "iconconv_" in temp_path.name
        finally:
            # クリーンアップ
            if temp_path.exists():
                temp_path.unlink()

    def test_cleanup_temp_file(self, service):
        """一時ファイル削除のテスト"""
        temp_path = service._create_temp_file(".png")
        assert temp_path.exists()

        service._cleanup_temp_file(temp_path)
        assert not temp_path.exists()

    def test_cleanup_temp_file_nonexistent(self, service):
        """存在しないファイルの削除テスト（エラーが発生しないこと）"""
        nonexistent_path = Path("/tmp/nonexistent_file_12345.png")
        # エラーが発生しないことを確認
        service._cleanup_temp_file(nonexistent_path)

    def test_save_uploaded_file(self, service, sample_png_bytes):
        """アップロードファイルの保存テスト"""
        file_stream = io.BytesIO(sample_png_bytes)
        temp_path = service._create_temp_file(".png")

        try:
            service._save_uploaded_file(file_stream, temp_path)
            assert temp_path.exists()
            assert temp_path.stat().st_size == len(sample_png_bytes)

            # ファイル内容が正しいことを確認
            with open(temp_path, "rb") as f:
                saved_data = f.read()
            assert saved_data == sample_png_bytes
        finally:
            service._cleanup_temp_file(temp_path)

    def test_save_uploaded_file_error(self, service):
        """ファイル保存エラーのテスト"""
        file_stream = io.BytesIO(b"test data")
        invalid_path = Path("/invalid/path/file.png")

        with pytest.raises(ConversionFailedError) as exc_info:
            service._save_uploaded_file(file_stream, invalid_path)
        assert "ファイルの保存に失敗しました" in str(exc_info.value)

    def test_read_ico_file(self, service, sample_png_bytes):
        """ICOファイル読み込みのテスト"""
        temp_path = service._create_temp_file(".ico")

        try:
            # テストデータを書き込み
            with open(temp_path, "wb") as f:
                f.write(sample_png_bytes)

            # 読み込みテスト
            data = service._read_ico_file(temp_path)
            assert data == sample_png_bytes
        finally:
            service._cleanup_temp_file(temp_path)

    def test_read_ico_file_error(self, service):
        """ICOファイル読み込みエラーのテスト"""
        nonexistent_path = Path("/tmp/nonexistent_file_12345.ico")

        with pytest.raises(ConversionFailedError) as exc_info:
            service._read_ico_file(nonexistent_path)
        assert "ICOファイルの読み込みに失敗しました" in str(exc_info.value)

    def test_convert_to_ico_success(self, service, sample_png_bytes):
        """画像変換の成功テスト"""
        file_stream = io.BytesIO(sample_png_bytes)

        ico_data = service.convert_to_ico(
            file_content=file_stream,
            filename="test.png",
            preserve_transparency=True,
            auto_transparent_bg=False,
        )

        # ICOデータが生成されていることを確認
        assert isinstance(ico_data, bytes)
        assert len(ico_data) > 0
        # ICOファイルのマジックバイト（0x00 0x00 0x01 0x00）を確認
        assert ico_data[:4] == b"\x00\x00\x01\x00"

    def test_convert_to_ico_with_transparency(self, service, sample_png_with_transparency_bytes):
        """透明度付き画像の変換テスト"""
        file_stream = io.BytesIO(sample_png_with_transparency_bytes)

        ico_data = service.convert_to_ico(
            file_content=file_stream,
            filename="transparent.png",
            preserve_transparency=True,
            auto_transparent_bg=False,
        )

        assert isinstance(ico_data, bytes)
        assert len(ico_data) > 0
        assert ico_data[:4] == b"\x00\x00\x01\x00"

    def test_convert_to_ico_auto_transparent_bg(self, service, sample_png_bytes):
        """自動背景透明化の変換テスト"""
        file_stream = io.BytesIO(sample_png_bytes)

        ico_data = service.convert_to_ico(
            file_content=file_stream,
            filename="test.png",
            preserve_transparency=False,
            auto_transparent_bg=True,
        )

        assert isinstance(ico_data, bytes)
        assert len(ico_data) > 0
        assert ico_data[:4] == b"\x00\x00\x01\x00"

    def test_convert_to_ico_jpeg(self, service, sample_jpeg_bytes):
        """JPEG画像の変換テスト"""
        file_stream = io.BytesIO(sample_jpeg_bytes)

        ico_data = service.convert_to_ico(
            file_content=file_stream,
            filename="test.jpg",
            preserve_transparency=False,
            auto_transparent_bg=False,
        )

        assert isinstance(ico_data, bytes)
        assert len(ico_data) > 0
        assert ico_data[:4] == b"\x00\x00\x01\x00"

    def test_convert_to_ico_cleanup_on_success(self, service, sample_png_bytes):
        """変換成功時の一時ファイルクリーンアップテスト"""
        file_stream = io.BytesIO(sample_png_bytes)

        # 変換前の一時ファイル数を記録
        import tempfile

        temp_dir = Path(tempfile.gettempdir())
        before_files = set(temp_dir.glob("iconconv_*"))

        # 変換実行
        service.convert_to_ico(
            file_content=file_stream,
            filename="test.png",
        )

        # 変換後の一時ファイル数を確認（増えていないこと）
        after_files = set(temp_dir.glob("iconconv_*"))
        new_files = after_files - before_files
        assert len(new_files) == 0, "一時ファイルがクリーンアップされていません"

    def test_convert_to_ico_cleanup_on_error(self, service):
        """変換エラー時の一時ファイルクリーンアップテスト"""
        # 無効なデータで変換を試みる
        file_stream = io.BytesIO(b"invalid image data")

        import tempfile

        temp_dir = Path(tempfile.gettempdir())
        before_files = set(temp_dir.glob("iconconv_*"))

        with pytest.raises(ConversionFailedError):
            service.convert_to_ico(
                file_content=file_stream,
                filename="invalid.png",
            )

        # エラー時も一時ファイルがクリーンアップされていることを確認
        after_files = set(temp_dir.glob("iconconv_*"))
        new_files = after_files - before_files
        assert len(new_files) == 0, "エラー時に一時ファイルがクリーンアップされていません"

    def test_convert_to_ico_invalid_image(self, service, invalid_file_bytes):
        """無効な画像データの変換テスト"""
        file_stream = io.BytesIO(invalid_file_bytes)

        with pytest.raises(ConversionFailedError) as exc_info:
            service.convert_to_ico(
                file_content=file_stream,
                filename="invalid.png",
            )
        assert "画像の変換に失敗しました" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_convert_to_ico_async_success(self, service, sample_png_bytes):
        """非同期変換の成功テスト"""
        file_stream = io.BytesIO(sample_png_bytes)

        ico_data = await service.convert_to_ico_async(
            file_content=file_stream,
            filename="test.png",
            preserve_transparency=True,
            auto_transparent_bg=False,
        )

        assert isinstance(ico_data, bytes)
        assert len(ico_data) > 0
        assert ico_data[:4] == b"\x00\x00\x01\x00"

    @pytest.mark.asyncio
    async def test_convert_to_ico_async_error(self, service, invalid_file_bytes):
        """非同期変換のエラーテスト"""
        file_stream = io.BytesIO(invalid_file_bytes)

        with pytest.raises(ConversionFailedError):
            await service.convert_to_ico_async(
                file_content=file_stream,
                filename="invalid.png",
            )

    def test_convert_to_ico_with_mock(self, service, sample_png_bytes):
        """IconConverterをモックした変換テスト"""
        file_stream = io.BytesIO(sample_png_bytes)

        # IconConverterのconvert_image_to_icoメソッドをモック
        with patch.object(service.converter, "convert_image_to_ico") as mock_convert:
            # モックが呼ばれたときに実際のICOファイルを作成
            def side_effect(input_path, output_ico_path, **kwargs):
                # 簡易的なICOファイルを作成
                with open(output_ico_path, "wb") as f:
                    f.write(b"\x00\x00\x01\x00" + b"\x00" * 100)

            mock_convert.side_effect = side_effect

            ico_data = service.convert_to_ico(
                file_content=file_stream,
                filename="test.png",
                preserve_transparency=True,
                auto_transparent_bg=False,
            )

            # モックが呼ばれたことを確認
            assert mock_convert.called
            assert mock_convert.call_count == 1

            # 引数を確認
            call_args = mock_convert.call_args
            assert call_args.kwargs["preserve_transparency"] is True
            assert call_args.kwargs["auto_transparent_bg"] is False

            # ICOデータが返されることを確認
            assert isinstance(ico_data, bytes)
            assert ico_data[:4] == b"\x00\x00\x01\x00"
