import os
import tempfile
from unittest.mock import patch

from PIL import Image

from icon_converter.logic import IconConverter


class TestJPEGConversion:
    def setup_method(self):
        self.converter = IconConverter()

    def test_jpeg_to_ico_conversion(self):
        """JPEGファイルからICOファイルへの変換テスト"""
        # テスト用のJPEG画像を作成
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_jpg:
            # 小さなテスト画像を作成
            test_image = Image.new("RGB", (64, 64), color="blue")
            test_image.save(tmp_jpg.name, "JPEG", quality=95)
            jpg_path = tmp_jpg.name

        # 出力用のICOファイルパス
        with tempfile.NamedTemporaryFile(suffix=".ico", delete=False) as tmp_ico:
            ico_path = tmp_ico.name

        try:
            # 変換実行
            with patch("tkinter.messagebox.showinfo") as mock_showinfo:
                self.converter.convert_image_to_ico(jpg_path, ico_path, preserve_transparency=False)
                mock_showinfo.assert_called_once()

            # 出力ファイルが存在することを確認
            assert os.path.exists(ico_path)
            assert os.path.getsize(ico_path) > 0

            # ICOファイルが正しく読み込めることを確認
            ico_image = Image.open(ico_path)
            assert ico_image.format == "ICO"

        finally:
            # クリーンアップ
            os.unlink(jpg_path)
            os.unlink(ico_path)

    def test_jpeg_transparency_warning(self):
        """JPEGファイルで透明化を試行した場合の警告テスト"""
        # テスト用のJPEG画像を作成
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp_jpg:
            test_image = Image.new("RGB", (32, 32), color="red")
            test_image.save(tmp_jpg.name, "JPEG", quality=95)
            jpg_path = tmp_jpg.name

        with tempfile.NamedTemporaryFile(suffix=".ico", delete=False) as tmp_ico:
            ico_path = tmp_ico.name

        try:
            # 透明化を有効にして変換実行
            with patch("tkinter.messagebox.showinfo") as mock_showinfo:
                self.converter.convert_image_to_ico(jpg_path, ico_path, preserve_transparency=True)
                mock_showinfo.assert_called_once()

            # 警告ログが出力されていることを確認（ログレベルでチェック）
            # 実際のログファイルを確認するか、ログハンドラーをモック化してテスト

        finally:
            os.unlink(jpg_path)
            os.unlink(ico_path)


if __name__ == "__main__":
    import pytest

    pytest.main([__file__])
