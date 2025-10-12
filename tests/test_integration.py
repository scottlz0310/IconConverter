import os
import tempfile
import tkinter as tk
import unittest
from unittest.mock import patch

from PIL import Image

from icon_converter.gui import IconConverterApp


class TestIntegration:
    def setup_method(self):
        try:
            self.root = tk.Tk()
            self.root.withdraw()  # ヘッドレス環境でウィンドウを非表示
            self.app = IconConverterApp(self.root)
        except tk.TclError:
            # ヘッドレス環境でTkinterが使用できない場合はスキップ
            import pytest

            pytest.skip("GUI not available in headless environment")

    def teardown_method(self):
        if hasattr(self, "root"):
            self.root.destroy()

    def test_app_initialization(self):
        """アプリケーションが正しく初期化されることを確認"""
        assert self.app.root.title() == "Image to ICO Converter"
        assert hasattr(self.app, "converter")
        assert hasattr(self.app, "preview_img")

    def test_widget_creation(self):
        """ウィジェットが正しく作成されることを確認"""
        assert hasattr(self.app, "btn_select_file")
        assert hasattr(self.app, "lbl_preview")

    def test_preview_functionality(self):
        """プレビュー機能のテスト"""
        # テスト用のPNG画像を作成
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_png:
            test_image = Image.new("RGB", (32, 32), color="blue")
            test_image.save(tmp_png.name, "PNG")
            png_path = tmp_png.name

        try:
            # プレビュー表示をテスト
            with patch("tkinter.messagebox.showerror") as mock_showerror:
                self.app.show_preview(png_path)
                mock_showerror.assert_not_called()
                assert self.app.preview_img is not None

        finally:
            os.unlink(png_path)

    def test_file_selection_mock(self):
        """ファイル選択機能のモックテスト"""
        with (
            patch("tkinter.filedialog.askopenfilename") as mock_open,
            patch("tkinter.filedialog.asksaveasfilename") as mock_save,
            patch.object(self.app, "show_preview") as mock_preview,
            patch.object(self.app.converter, "convert_image_to_ico") as mock_convert,
        ):
            # ファイル選択のシミュレーション
            mock_open.return_value = "/test/path/test.png"
            mock_save.return_value = "/test/path/test.ico"

            self.app.select_file()

            mock_open.assert_called_once()
            mock_preview.assert_called_once_with("/test/path/test.png")
            mock_save.assert_called_once()
            mock_convert.assert_called_once_with("/test/path/test.png", "/test/path/test.ico", True, False)


if __name__ == "__main__":
    unittest.main()
