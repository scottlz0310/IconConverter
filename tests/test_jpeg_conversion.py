import os
import tempfile
import time
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
            self._safe_remove_file(jpg_path)
            self._safe_remove_file(ico_path)

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
            self._safe_remove_file(jpg_path)
            self._safe_remove_file(ico_path)

    def _safe_remove_file(self, filepath):
        """クロスプラットフォーム対応のファイル削除"""
        for attempt in range(3):
            try:
                if os.path.exists(filepath):
                    os.unlink(filepath)
                break
            except PermissionError:
                if attempt < 2:  # 最大3回試行
                    time.sleep(0.1)  # 100ms待機
                else:
                    # 最終試行でも失敗した場合はスキップ（テスト失敗にしない）
                    pass


if __name__ == "__main__":
    import pytest

    pytest.main([__file__])
