import os
import tempfile
from unittest.mock import MagicMock, patch

import pytest
from PIL import Image


class TestGUI:
    """GUI テスト - ヘッドレス環境対応"""

    @pytest.fixture(autouse=True)
    def setup_gui_mocks(self):
        """GUI環境を完全にモック化"""
        # Tkinter全体をモック化
        with (
            patch("tkinter.Tk") as mock_tk,
            patch("tkinter.Button") as mock_button,
            patch("tkinter.Label") as mock_label,
            patch("tkinter.Frame") as mock_frame,
            patch("tkinter.Checkbutton") as mock_checkbutton,
            patch("tkinter.BooleanVar") as mock_boolvar,
            patch("PIL.ImageTk.PhotoImage") as mock_photo,
        ):
            # モックの戻り値を設定
            self.mock_root = MagicMock()
            mock_tk.return_value = self.mock_root
            mock_button.return_value = MagicMock()
            mock_label.return_value = MagicMock()
            mock_frame.return_value = MagicMock()
            mock_checkbutton.return_value = MagicMock()
            mock_boolvar.return_value = MagicMock()
            mock_photo.return_value = MagicMock()

            # BooleanVarのget/setメソッドをモック
            mock_bool_instance = MagicMock()
            mock_bool_instance.get.return_value = True
            mock_boolvar.return_value = mock_bool_instance

            from icon_converter.gui import IconConverterApp

            self.app = IconConverterApp(self.mock_root)
            yield

    def test_app_initialization(self):
        """アプリケーション初期化テスト"""
        # 検証対象: IconConverterApp.__init__() # 目的: 初期化の確認
        assert hasattr(self.app, "converter")
        assert hasattr(self.app, "preview_img")
        assert hasattr(self.app, "transparency_var")
        assert hasattr(self.app, "auto_transparent_var")

    def test_widget_creation(self):
        """ウィジェット作成テスト"""
        # 検証対象: _build_widgets() # 目的: ウィジェット作成の確認
        assert hasattr(self.app, "btn_select_file")
        assert hasattr(self.app, "lbl_preview")
        assert hasattr(self.app, "chk_transparency")
        assert hasattr(self.app, "chk_auto_transparent")

    def test_transparency_change_handler(self):
        """透明化オプション変更ハンドラーテスト"""
        # 検証対象: _on_transparency_change() # 目的: 透明化オプション排他制御
        self.app.transparency_var.get.return_value = True
        self.app._on_transparency_change()
        self.app.auto_transparent_var.set.assert_called_with(False)

    def test_auto_transparent_change_handler(self):
        """自動透明化オプション変更ハンドラーテスト"""
        # 検証対象: _on_auto_transparent_change() # 目的: 自動透明化オプション排他制御
        self.app.auto_transparent_var.get.return_value = True
        self.app._on_auto_transparent_change()
        self.app.transparency_var.set.assert_called_with(False)

    def test_show_preview_success(self):
        """プレビュー表示成功テスト"""
        # 検証対象: show_preview() # 目的: プレビュー表示の動作確認
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_png:
            test_image = Image.new("RGB", (32, 32), color="blue")
            test_image.save(tmp_png.name, "PNG")
            png_path = tmp_png.name

        try:
            with patch("tkinter.messagebox.showerror") as mock_showerror:
                self.app.show_preview(png_path)
                mock_showerror.assert_not_called()
        finally:
            os.unlink(png_path)

    def test_show_preview_error(self):
        """プレビュー表示エラーテスト"""
        # 検証対象: show_preview() # 目的: エラーハンドリングの確認
        with patch("tkinter.messagebox.showerror") as mock_showerror:
            self.app.show_preview("nonexistent.png")
            mock_showerror.assert_called_once()

    def test_select_file_with_conversion(self):
        """ファイル選択・変換テスト"""
        # 検証対象: select_file() # 目的: ファイル選択から変換までの流れ
        with (
            patch("tkinter.filedialog.askopenfilename") as mock_open,
            patch("tkinter.filedialog.asksaveasfilename") as mock_save,
            patch.object(self.app, "show_preview") as mock_preview,
            patch.object(self.app.converter, "convert_image_to_ico") as mock_convert,
        ):
            mock_open.return_value = "/test/path/test.png"
            mock_save.return_value = "/test/path/test.ico"
            # transparency_varのgetメソッドを直接設定
            with (
                patch.object(self.app.transparency_var, "get", return_value=True),
                patch.object(self.app.auto_transparent_var, "get", return_value=False),
            ):
                self.app.select_file()

                mock_open.assert_called_once()
                mock_preview.assert_called_once_with("/test/path/test.png")
                mock_save.assert_called_once()
                mock_convert.assert_called_once_with("/test/path/test.png", "/test/path/test.ico", False, False)

    def test_select_file_cancelled(self):
        """ファイル選択キャンセルテスト"""
        # 検証対象: select_file() # 目的: キャンセル時の動作確認
        with (
            patch("tkinter.filedialog.askopenfilename") as mock_open,
            patch.object(self.app, "show_preview") as mock_preview,
        ):
            mock_open.return_value = ""  # キャンセル

            self.app.select_file()

            mock_open.assert_called_once()
            mock_preview.assert_not_called()

    def test_main_function(self):
        """main関数テスト"""
        # 検証対象: main() # 目的: main関数の動作確認
        with (
            patch("tkinter.Tk") as mock_tk,
            patch("icon_converter.gui.IconConverterApp") as mock_app,
        ):
            mock_root = MagicMock()
            mock_tk.return_value = mock_root

            from icon_converter.gui import main

            main()

            mock_tk.assert_called_once()
            mock_app.assert_called_once_with(mock_root)
            mock_root.mainloop.assert_called_once()
