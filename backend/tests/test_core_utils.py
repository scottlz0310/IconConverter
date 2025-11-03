"""core/utils.pyのユニットテスト"""

import sys
from pathlib import Path

import pytest
from PIL import Image

# backend ディレクトリをパスに追加
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from core.utils import (  # noqa: E402
    get_file_extension,
    is_transparency_supported,
    prepare_image_for_conversion,
    setup_logger,
)


class TestSetupLogger:
    """setup_logger関数のテストクラス"""

    def test_setup_logger(self):
        """ロガーのセットアップテスト"""
        # エラーが発生しないことを確認
        setup_logger("test_logger")

        # logsディレクトリが作成されることを確認
        assert Path("logs").exists()


class TestPrepareImageForConversion:
    """prepare_image_for_conversion関数のテストクラス"""

    def test_prepare_rgba_with_transparency(self):
        """RGBA画像の透明度保持テスト"""
        img = Image.new("RGBA", (100, 100), color=(255, 0, 0, 128))
        result = prepare_image_for_conversion(img, preserve_transparency=True)

        assert result.mode == "RGBA"

    def test_prepare_rgb_with_transparency(self):
        """RGB画像を透明度保持でRGBAに変換するテスト"""
        img = Image.new("RGB", (100, 100), color=(255, 0, 0))
        result = prepare_image_for_conversion(img, preserve_transparency=True)

        assert result.mode == "RGBA"

    def test_prepare_rgba_without_transparency(self):
        """RGBA画像を透明度なしでRGBに変換するテスト"""
        img = Image.new("RGBA", (100, 100), color=(255, 0, 0, 128))
        result = prepare_image_for_conversion(img, preserve_transparency=False)

        assert result.mode == "RGB"

    def test_prepare_rgb_without_transparency(self):
        """RGB画像を透明度なしで保持するテスト"""
        img = Image.new("RGB", (100, 100), color=(255, 0, 0))
        result = prepare_image_for_conversion(img, preserve_transparency=False)

        assert result.mode == "RGB"

    def test_prepare_l_mode_with_transparency(self):
        """グレースケール画像を透明度保持でRGBAに変換するテスト"""
        img = Image.new("L", (100, 100), color=128)
        result = prepare_image_for_conversion(img, preserve_transparency=True)

        assert result.mode == "RGBA"

    def test_prepare_l_mode_without_transparency(self):
        """グレースケール画像を透明度なしで保持するテスト"""
        img = Image.new("L", (100, 100), color=128)
        result = prepare_image_for_conversion(img, preserve_transparency=False)

        # Lモードは変換されない（RGBAでもRGBでもない）
        assert result.mode == "L"


class TestGetFileExtension:
    """get_file_extension関数のテストクラス"""

    def test_get_extension_png(self):
        """PNG拡張子の取得テスト"""
        assert get_file_extension("test.png") == ".png"
        assert get_file_extension("test.PNG") == ".png"

    def test_get_extension_jpg(self):
        """JPEG拡張子の取得テスト"""
        assert get_file_extension("test.jpg") == ".jpg"
        assert get_file_extension("test.jpeg") == ".jpeg"
        assert get_file_extension("test.JPG") == ".jpg"

    def test_get_extension_with_path(self):
        """パス付きファイル名の拡張子取得テスト"""
        assert get_file_extension("/path/to/file.png") == ".png"
        assert get_file_extension("C:\\Users\\test\\image.jpg") == ".jpg"

    def test_get_extension_no_extension(self):
        """拡張子なしファイルのテスト"""
        assert get_file_extension("filename") == ""

    def test_get_extension_multiple_dots(self):
        """複数のドットを含むファイル名のテスト"""
        assert get_file_extension("file.name.png") == ".png"


class TestIsTransparencySupported:
    """is_transparency_supported関数のテストクラス"""

    def test_png_supported(self):
        """PNG形式の透明度サポートテスト"""
        assert is_transparency_supported("test.png") is True
        assert is_transparency_supported("test.PNG") is True

    def test_gif_supported(self):
        """GIF形式の透明度サポートテスト"""
        assert is_transparency_supported("test.gif") is True
        assert is_transparency_supported("test.GIF") is True

    def test_webp_supported(self):
        """WebP形式の透明度サポートテスト"""
        assert is_transparency_supported("test.webp") is True
        assert is_transparency_supported("test.WEBP") is True

    def test_jpeg_not_supported(self):
        """JPEG形式の透明度非サポートテスト"""
        assert is_transparency_supported("test.jpg") is False
        assert is_transparency_supported("test.jpeg") is False

    def test_bmp_not_supported(self):
        """BMP形式の透明度非サポートテスト"""
        assert is_transparency_supported("test.bmp") is False

    def test_tiff_not_supported(self):
        """TIFF形式の透明度非サポートテスト"""
        assert is_transparency_supported("test.tiff") is False
        assert is_transparency_supported("test.tif") is False

    def test_unknown_format_not_supported(self):
        """未知の形式の透明度非サポートテスト"""
        assert is_transparency_supported("test.txt") is False
        assert is_transparency_supported("test.pdf") is False

