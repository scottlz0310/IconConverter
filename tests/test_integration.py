import os
import tempfile
from unittest.mock import patch

from PIL import Image

from icon_converter.logic import IconConverter


class TestIntegration:
    """統合テスト - GUI依存を避けてロジック中心にテスト"""

    def setup_method(self):
        self.converter = IconConverter()

    def test_end_to_end_conversion(self):
        """エンドツーエンドの変換テスト"""
        # テスト用のPNG画像を作成
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_png:
            test_image = Image.new("RGB", (64, 64), color="red")
            test_image.save(tmp_png.name, "PNG")
            png_path = tmp_png.name

        with tempfile.NamedTemporaryFile(suffix=".ico", delete=False) as tmp_ico:
            ico_path = tmp_ico.name

        try:
            # 変換実行（GUI部分をモック化）
            with patch("tkinter.messagebox.showinfo") as mock_showinfo:
                self.converter.convert_image_to_ico(png_path, ico_path)
                mock_showinfo.assert_called_once()

            # 出力ファイルが存在し、有効なICOファイルであることを確認
            assert os.path.exists(ico_path)
            assert os.path.getsize(ico_path) > 0

            # ICOファイルとして読み込めることを確認
            ico_image = Image.open(ico_path)
            assert ico_image.format == "ICO"

        finally:
            os.unlink(png_path)
            os.unlink(ico_path)

    def test_transparency_workflow(self):
        """透明化ワークフローのテスト"""
        # RGBA画像でテスト
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_png:
            test_image = Image.new("RGBA", (32, 32), (255, 0, 0, 128))  # 半透明の赤
            test_image.save(tmp_png.name, "PNG")
            png_path = tmp_png.name

        with tempfile.NamedTemporaryFile(suffix=".ico", delete=False) as tmp_ico:
            ico_path = tmp_ico.name

        try:
            with patch("tkinter.messagebox.showinfo"):
                # 透明化保持でテスト
                self.converter.convert_image_to_ico(png_path, ico_path, preserve_transparency=True)
                assert os.path.exists(ico_path)

                # 自動背景透明化でテスト
                self.converter.convert_image_to_ico(
                    png_path, ico_path, preserve_transparency=False, auto_transparent_bg=True
                )
                assert os.path.exists(ico_path)

        finally:
            os.unlink(png_path)
            os.unlink(ico_path)

    def test_error_handling_integration(self):
        """エラーハンドリングの統合テスト"""
        with patch("tkinter.messagebox.showerror") as mock_showerror:
            # 存在しないファイルでテスト
            self.converter.convert_image_to_ico("nonexistent.png", "output.ico")
            mock_showerror.assert_called_once()

    def test_multiple_format_support(self):
        """複数フォーマットサポートのテスト"""
        formats = [("JPEG", "jpg"), ("BMP", "bmp")]

        for format_name, ext in formats:
            with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp_img:
                test_image = Image.new("RGB", (32, 32), color="blue")
                test_image.save(tmp_img.name, format_name)
                img_path = tmp_img.name

            with tempfile.NamedTemporaryFile(suffix=".ico", delete=False) as tmp_ico:
                ico_path = tmp_ico.name

            try:
                with patch("tkinter.messagebox.showinfo"):
                    self.converter.convert_image_to_ico(img_path, ico_path)
                    assert os.path.exists(ico_path)
                    assert os.path.getsize(ico_path) > 0

            finally:
                os.unlink(img_path)
                os.unlink(ico_path)
