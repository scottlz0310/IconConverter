"""ValidationServiceのユニットテスト"""

import io

import pytest

from exceptions import FileSizeExceededError, InvalidFileFormatError
from services.validation import ValidationService


class TestValidationService:
    """ValidationServiceのテストクラス"""

    def test_validate_file_size_success(self):
        """正常なファイルサイズの検証"""
        # 1MB（制限内）
        ValidationService.validate_file_size(1024 * 1024)
        # 10MB（制限ギリギリ）
        ValidationService.validate_file_size(10 * 1024 * 1024)

    def test_validate_file_size_exceeded(self):
        """ファイルサイズ超過の検証"""
        # 11MB（制限超過）
        with pytest.raises(FileSizeExceededError) as exc_info:
            ValidationService.validate_file_size(11 * 1024 * 1024)
        assert "ファイルサイズが大きすぎます" in str(exc_info.value)

    def test_validate_file_format_png_success(self):
        """PNG形式の検証（成功）"""
        ValidationService.validate_file_format("test.png", "image/png")
        ValidationService.validate_file_format("test.PNG", "image/png")

    def test_validate_file_format_jpeg_success(self):
        """JPEG形式の検証（成功）"""
        ValidationService.validate_file_format("test.jpg", "image/jpeg")
        ValidationService.validate_file_format("test.jpeg", "image/jpeg")
        ValidationService.validate_file_format("test.JPG", "image/jpeg")

    def test_validate_file_format_bmp_success(self):
        """BMP形式の検証（成功）"""
        ValidationService.validate_file_format("test.bmp", "image/bmp")

    def test_validate_file_format_gif_success(self):
        """GIF形式の検証（成功）"""
        ValidationService.validate_file_format("test.gif", "image/gif")

    def test_validate_file_format_tiff_success(self):
        """TIFF形式の検証（成功）"""
        ValidationService.validate_file_format("test.tiff", "image/tiff")
        ValidationService.validate_file_format("test.tif", "image/tiff")

    def test_validate_file_format_webp_success(self):
        """WebP形式の検証（成功）"""
        ValidationService.validate_file_format("test.webp", "image/webp")

    def test_validate_file_format_invalid_extension(self):
        """無効な拡張子の検証"""
        with pytest.raises(InvalidFileFormatError) as exc_info:
            ValidationService.validate_file_format("test.txt", "text/plain")
        assert "サポートされていないファイル形式です" in str(exc_info.value)

    def test_validate_file_format_invalid_mime_type(self):
        """無効なMIMEタイプの検証"""
        with pytest.raises(InvalidFileFormatError) as exc_info:
            ValidationService.validate_file_format("test.png", "application/pdf")
        assert "サポートされていないMIMEタイプです" in str(exc_info.value)

    def test_validate_file_format_no_content_type(self):
        """MIMEタイプなしの検証（拡張子のみ）"""
        ValidationService.validate_file_format("test.png", None)
        ValidationService.validate_file_format("test.jpg", None)

    def test_validate_image_content_success(self, sample_png_bytes):
        """正常な画像コンテンツの検証"""
        file_stream = io.BytesIO(sample_png_bytes)
        ValidationService.validate_image_content(file_stream)
        # ファイルポインタが先頭に戻っていることを確認
        assert file_stream.tell() == 0

    def test_validate_image_content_jpeg_success(self, sample_jpeg_bytes):
        """JPEG画像コンテンツの検証"""
        file_stream = io.BytesIO(sample_jpeg_bytes)
        ValidationService.validate_image_content(file_stream)
        assert file_stream.tell() == 0

    def test_validate_image_content_invalid(self, invalid_file_bytes):
        """無効な画像コンテンツの検証"""
        file_stream = io.BytesIO(invalid_file_bytes)
        with pytest.raises(InvalidFileFormatError) as exc_info:
            ValidationService.validate_image_content(file_stream)
        assert "画像ファイルとして読み込めません" in str(exc_info.value)

    def test_validate_uploaded_file_success(self, sample_png_bytes):
        """アップロードファイルの包括的検証（成功）"""
        file_stream = io.BytesIO(sample_png_bytes)
        ValidationService.validate_uploaded_file(
            filename="test.png",
            file_size=len(sample_png_bytes),
            file_content=file_stream,
            content_type="image/png",
        )

    def test_validate_uploaded_file_size_exceeded(self, large_file_bytes):
        """アップロードファイルのサイズ超過検証"""
        file_stream = io.BytesIO(large_file_bytes)
        with pytest.raises(FileSizeExceededError):
            ValidationService.validate_uploaded_file(
                filename="large.png",
                file_size=len(large_file_bytes),
                file_content=file_stream,
                content_type="image/png",
            )

    def test_validate_uploaded_file_invalid_format(self, invalid_file_bytes):
        """アップロードファイルの無効な形式検証"""
        file_stream = io.BytesIO(invalid_file_bytes)
        with pytest.raises(InvalidFileFormatError):
            ValidationService.validate_uploaded_file(
                filename="test.txt",
                file_size=len(invalid_file_bytes),
                file_content=file_stream,
                content_type="text/plain",
            )

    def test_validate_uploaded_file_corrupted_image(self):
        """破損した画像ファイルの検証"""
        # PNG形式のヘッダーだけを持つ破損ファイル
        corrupted_data = b"\x89PNG\r\n\x1a\n"
        file_stream = io.BytesIO(corrupted_data)
        with pytest.raises(InvalidFileFormatError):
            ValidationService.validate_uploaded_file(
                filename="corrupted.png",
                file_size=len(corrupted_data),
                file_content=file_stream,
                content_type="image/png",
            )
