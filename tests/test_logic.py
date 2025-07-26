import tempfile
import os
from PIL import Image
from unittest.mock import patch
from icon_converter.logic import IconConverter

class TestIconConverter:
    def setup_method(self):
        self.converter = IconConverter()

    def test_convert_png_to_ico_success(self):
        # テスト用のPNG画像を作成
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_png:
            # 小さなテスト画像を作成
            test_image = Image.new('RGB', (32, 32), color='red')
            test_image.save(tmp_png.name, 'PNG')
            png_path = tmp_png.name

        # 出力用のICOファイルパス
        with tempfile.NamedTemporaryFile(suffix='.ico', delete=False) as tmp_ico:
            ico_path = tmp_ico.name

        try:
            # 変換実行
            with patch('tkinter.messagebox.showinfo') as mock_showinfo:
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
        with patch('tkinter.messagebox.showerror') as mock_showerror:
            self.converter.convert_png_to_ico('nonexistent.png', 'output.ico')
            mock_showerror.assert_called_once()

    def test_converter_initialization(self):
        # ロガーが正しく初期化されていることを確認
        assert hasattr(self.converter, 'logger')
        assert self.converter.logger.name == 'IconConverter' 