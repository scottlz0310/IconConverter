import os
import tempfile
from unittest.mock import patch

from icon_converter.logic import IconConverter
from PIL import Image


class TestIconConverter:
    def setup_method(self):
        self.converter = IconConverter()

    def test_convert_png_to_ico_success(self):
        # テスト用のPNG画像を作成
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_png:
            # 小さなテスト画像を作成
            test_image = Image.new("RGB", (32, 32), color="red")
            test_image.save(tmp_png.name, "PNG")
            png_path = tmp_png.name

        # 出力用のICOファイルパス
        with tempfile.NamedTemporaryFile(suffix=".ico", delete=False) as tmp_ico:
            ico_path = tmp_ico.name

        try:
            # 変換実行
            with patch("tkinter.messagebox.showinfo") as mock_showinfo:
                self.converter.convert_png_to_ico(png_path, ico_path)
                mock_showinfo.assert_called_once()

            # 出力ファイルが存在することを確認
            assert os.path.exists(ico_path)
            assert os.path.getsize(ico_path) > 0

        finally:
            # クリーンアップ
            os.unlink(png_path)
            os.unlink(ico_path)

    def test_convert_png_to_ico_failure(self):
        # 存在しないファイルでテスト
        with patch("tkinter.messagebox.showerror") as mock_showerror:
            self.converter.convert_png_to_ico("nonexistent.png", "output.ico")
            mock_showerror.assert_called_once()

    def test_converter_initialization(self):
        # ロガーが正しく初期化されていることを確認
        assert hasattr(self.converter, "logger")
        assert self.converter.logger.name == "IconConverter"

    def test_detect_background_color(self):
        # 検証対象: _detect_background_color() # 目的: 背景色検出の動作確認
        test_image = Image.new("RGB", (10, 10), color=(255, 0, 0))  # 赤色の画像
        background_color = self.converter._detect_background_color(test_image)
        assert background_color == (255, 0, 0)

    def test_make_color_transparent(self):
        # 検証対象: _make_color_transparent() # 目的: 色の透明化処理の動作確認
        test_image = Image.new("RGB", (10, 10), color=(255, 0, 0))  # 赤色の画像
        transparent_image = self.converter._make_color_transparent(test_image, (255, 0, 0))
        assert transparent_image.mode == "RGBA"
        # 透明化された画像のアルファチャンネルを確認
        alpha_channel = transparent_image.split()[-1]
        assert alpha_channel.getpixel((0, 0)) == 0  # 透明

    def test_convert_image_to_ico_with_transparency_options(self):
        # 検証対象: convert_image_to_ico() # 目的: 透明化オプションの動作確認
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_png:
            test_image = Image.new("RGB", (32, 32), color="blue")
            test_image.save(tmp_png.name, "PNG")
            png_path = tmp_png.name

        with tempfile.NamedTemporaryFile(suffix=".ico", delete=False) as tmp_ico:
            ico_path = tmp_ico.name

        try:
            # 自動背景透明化オプションでテスト
            with patch("tkinter.messagebox.showinfo") as mock_showinfo:
                self.converter.convert_image_to_ico(
                    png_path,
                    ico_path,
                    preserve_transparency=False,
                    auto_transparent_bg=True,
                )
                mock_showinfo.assert_called_once()
            assert os.path.exists(ico_path)

            # 透明化保持オプションでテスト
            with patch("tkinter.messagebox.showinfo") as mock_showinfo:
                self.converter.convert_image_to_ico(
                    png_path,
                    ico_path,
                    preserve_transparency=True,
                    auto_transparent_bg=False,
                )
                mock_showinfo.assert_called_once()

        finally:
            os.unlink(png_path)
            os.unlink(ico_path)

    def test_convert_image_to_ico_unsupported_transparency(self):
        # 検証対象: convert_image_to_ico() # 目的: 透明化非対応形式での警告確認
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_jpg:
            test_image = Image.new("RGB", (32, 32), color="green")
            test_image.save(tmp_jpg.name, "JPEG")
            jpg_path = tmp_jpg.name

        with tempfile.NamedTemporaryFile(suffix=".ico", delete=False) as tmp_ico:
            ico_path = tmp_ico.name

        try:
            with patch("tkinter.messagebox.showinfo") as mock_showinfo:
                self.converter.convert_image_to_ico(jpg_path, ico_path, preserve_transparency=True)
                mock_showinfo.assert_called_once()
            assert os.path.exists(ico_path)

        finally:
            os.unlink(jpg_path)
            os.unlink(ico_path)
