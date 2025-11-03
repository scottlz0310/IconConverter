"""IconConverterクラスのユニットテスト"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from PIL import Image

# backend ディレクトリをパスに追加
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from core.logic import IconConverter  # noqa: E402


class TestIconConverter:
    """IconConverterクラスのテストクラス"""

    @pytest.fixture
    def converter(self):
        """IconConverterインスタンスを生成"""
        return IconConverter()

    @pytest.fixture
    def temp_image_path(self, tmp_path, sample_png_bytes):
        """一時的な画像ファイルを作成"""
        image_path = tmp_path / "test.png"
        image_path.write_bytes(sample_png_bytes)
        return str(image_path)

    @pytest.fixture
    def temp_output_path(self, tmp_path):
        """一時的な出力ファイルパスを生成"""
        return str(tmp_path / "output.ico")

    def test_initialization(self, converter):
        """IconConverterの初期化テスト"""
        assert converter is not None

    def test_detect_background_color(self, converter):
        """背景色検出のテスト"""
        # 赤い背景の画像を作成
        img = Image.new("RGB", (100, 100), color=(255, 0, 0))
        bg_color = converter._detect_background_color(img)
        assert bg_color == (255, 0, 0)

    def test_detect_background_color_mixed(self, converter):
        """混合背景色検出のテスト"""
        # 四隅が異なる色の画像を作成
        img = Image.new("RGB", (100, 100), color=(255, 255, 255))
        # 左上と右上を赤に
        for x in range(50):
            for y in range(50):
                img.putpixel((x, y), (255, 0, 0))
                img.putpixel((99 - x, y), (255, 0, 0))

        bg_color = converter._detect_background_color(img)
        # 赤が最も多いはず
        assert bg_color == (255, 0, 0)

    def test_make_color_transparent(self, converter):
        """色の透明化テスト"""
        # 赤い背景の画像を作成
        img = Image.new("RGB", (100, 100), color=(255, 0, 0))
        # 中央に青い四角を描画
        for x in range(40, 60):
            for y in range(40, 60):
                img.putpixel((x, y), (0, 0, 255))

        # 赤を透明化
        result = converter._make_color_transparent(img, (255, 0, 0))

        # RGBAモードに変換されていることを確認
        assert result.mode == "RGBA"

        # 赤い部分が透明になっていることを確認
        assert result.getpixel((0, 0))[3] == 0  # 透明

        # 青い部分は不透明のまま
        assert result.getpixel((50, 50))[3] == 255  # 不透明

    def test_make_color_transparent_with_tolerance(self, converter):
        """許容範囲付き色の透明化テスト"""
        # 赤い背景の画像を作成
        img = Image.new("RGB", (100, 100), color=(255, 0, 0))
        # 少し異なる赤を追加
        for x in range(20, 40):
            for y in range(20, 40):
                img.putpixel((x, y), (250, 5, 5))

        # 赤を透明化（許容範囲10）
        result = converter._make_color_transparent(img, (255, 0, 0), tolerance=10)

        # 両方の赤が透明になっていることを確認
        assert result.getpixel((0, 0))[3] == 0
        assert result.getpixel((30, 30))[3] == 0

    def test_convert_image_to_ico_success(self, converter, temp_image_path, temp_output_path):
        """画像からICOへの変換成功テスト"""
        converter.convert_image_to_ico(
            input_path=temp_image_path,
            output_ico_path=temp_output_path,
            preserve_transparency=True,
            auto_transparent_bg=False,
        )

        # 出力ファイルが作成されていることを確認
        assert Path(temp_output_path).exists()

        # ICOファイルとして読み込めることを確認
        with open(temp_output_path, "rb") as f:
            ico_data = f.read()
            # ICOファイルのマジックバイトを確認
            assert ico_data[:4] == b"\x00\x00\x01\x00"

    def test_convert_image_to_ico_with_transparency(self, converter, tmp_path, sample_png_with_transparency_bytes):
        """透明度付き画像の変換テスト"""
        # 透明度付きPNG画像を作成
        input_path = tmp_path / "transparent.png"
        input_path.write_bytes(sample_png_with_transparency_bytes)
        output_path = tmp_path / "output.ico"

        converter.convert_image_to_ico(
            input_path=str(input_path),
            output_ico_path=str(output_path),
            preserve_transparency=True,
            auto_transparent_bg=False,
        )

        assert output_path.exists()

    def test_convert_image_to_ico_auto_transparent_bg(self, converter, temp_image_path, temp_output_path):
        """自動背景透明化の変換テスト"""
        converter.convert_image_to_ico(
            input_path=temp_image_path,
            output_ico_path=temp_output_path,
            preserve_transparency=False,
            auto_transparent_bg=True,
        )

        assert Path(temp_output_path).exists()

    def test_convert_image_to_ico_jpeg(self, converter, tmp_path, sample_jpeg_bytes):
        """JPEG画像の変換テスト"""
        input_path = tmp_path / "test.jpg"
        input_path.write_bytes(sample_jpeg_bytes)
        output_path = tmp_path / "output.ico"

        converter.convert_image_to_ico(
            input_path=str(input_path),
            output_ico_path=str(output_path),
            preserve_transparency=False,
            auto_transparent_bg=False,
        )

        assert output_path.exists()

    def test_convert_image_to_ico_unsupported_transparency(self, converter, tmp_path, sample_jpeg_bytes):
        """透明化非対応形式での変換テスト"""
        input_path = tmp_path / "test.jpg"
        input_path.write_bytes(sample_jpeg_bytes)
        output_path = tmp_path / "output.ico"

        # JPEGは透明化をサポートしていないが、エラーにならずに変換される
        converter.convert_image_to_ico(
            input_path=str(input_path),
            output_ico_path=str(output_path),
            preserve_transparency=True,  # JPEGなので無視される
            auto_transparent_bg=False,
        )

        assert output_path.exists()

    def test_convert_image_to_ico_error(self, converter, tmp_path):
        """無効な画像ファイルの変換エラーテスト"""
        from PIL import UnidentifiedImageError

        input_path = tmp_path / "invalid.png"
        input_path.write_text("not an image")
        output_path = tmp_path / "output.ico"

        with pytest.raises(UnidentifiedImageError):
            converter.convert_image_to_ico(
                input_path=str(input_path),
                output_ico_path=str(output_path),
            )

    def test_convert_png_to_ico_backward_compatibility(self, converter, temp_image_path, temp_output_path):
        """後方互換性のためのconvert_png_to_icoテスト"""
        converter.convert_png_to_ico(
            input_png_path=temp_image_path,
            output_ico_path=temp_output_path,
            preserve_transparency=True,
            auto_transparent_bg=False,
        )

        assert Path(temp_output_path).exists()

    def test_convert_image_to_ico_with_mock(self, converter, temp_image_path, temp_output_path):
        """Imageモジュールをモックした変換テスト"""
        with patch("core.logic.Image.open") as mock_open:
            # モック画像を作成
            mock_image = MagicMock(spec=Image.Image)
            mock_image.mode = "RGBA"
            mock_image.size = (100, 100)
            mock_open.return_value = mock_image

            converter.convert_image_to_ico(
                input_path=temp_image_path,
                output_ico_path=temp_output_path,
            )

            # Image.openが呼ばれたことを確認
            mock_open.assert_called_once_with(temp_image_path)
            # saveが呼ばれたことを確認
            mock_image.save.assert_called_once()
