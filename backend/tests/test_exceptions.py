"""カスタム例外のユニットテスト"""

import sys
from pathlib import Path

import pytest

# backend ディレクトリをパスに追加
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from exceptions import (  # noqa: E402
    ConversionFailedError,
    FileSizeExceededError,
    ImageConversionError,
    InvalidFileFormatError,
)


class TestImageConversionError:
    """ImageConversionError基底クラスのテストクラス"""

    def test_raise_base_error(self):
        """基底例外の発生テスト"""
        with pytest.raises(ImageConversionError) as exc_info:
            raise ImageConversionError("基底エラー")
        assert str(exc_info.value) == "基底エラー"

    def test_inheritance(self):
        """継承関係のテスト"""
        assert issubclass(ImageConversionError, Exception)


class TestInvalidFileFormatError:
    """InvalidFileFormatErrorのテストクラス"""

    def test_raise_error(self):
        """例外の発生テスト"""
        with pytest.raises(InvalidFileFormatError) as exc_info:
            raise InvalidFileFormatError("無効なファイル形式です")
        assert str(exc_info.value) == "無効なファイル形式です"

    def test_inheritance(self):
        """継承関係のテスト"""
        assert issubclass(InvalidFileFormatError, ImageConversionError)

    def test_catch_as_base_error(self):
        """基底クラスでキャッチできることのテスト"""
        with pytest.raises(ImageConversionError):
            raise InvalidFileFormatError("無効なファイル形式です")


class TestFileSizeExceededError:
    """FileSizeExceededErrorのテストクラス"""

    def test_raise_error(self):
        """例外の発生テスト"""
        with pytest.raises(FileSizeExceededError) as exc_info:
            raise FileSizeExceededError("ファイルサイズが大きすぎます")
        assert str(exc_info.value) == "ファイルサイズが大きすぎます"

    def test_inheritance(self):
        """継承関係のテスト"""
        assert issubclass(FileSizeExceededError, ImageConversionError)

    def test_catch_as_base_error(self):
        """基底クラスでキャッチできることのテスト"""
        with pytest.raises(ImageConversionError):
            raise FileSizeExceededError("ファイルサイズが大きすぎます")


class TestConversionFailedError:
    """ConversionFailedErrorのテストクラス"""

    def test_raise_error(self):
        """例外の発生テスト"""
        with pytest.raises(ConversionFailedError) as exc_info:
            raise ConversionFailedError("変換に失敗しました")
        assert str(exc_info.value) == "変換に失敗しました"

    def test_inheritance(self):
        """継承関係のテスト"""
        assert issubclass(ConversionFailedError, ImageConversionError)

    def test_catch_as_base_error(self):
        """基底クラスでキャッチできることのテスト"""
        with pytest.raises(ImageConversionError):
            raise ConversionFailedError("変換に失敗しました")


class TestExceptionMessages:
    """例外メッセージのテストクラス"""

    def test_custom_message(self):
        """カスタムメッセージのテスト"""
        error = InvalidFileFormatError("カスタムエラーメッセージ")
        assert str(error) == "カスタムエラーメッセージ"

    def test_empty_message(self):
        """空メッセージのテスト"""
        error = InvalidFileFormatError("")
        assert str(error) == ""

    def test_japanese_message(self):
        """日本語メッセージのテスト"""
        error = FileSizeExceededError("ファイルサイズが10MBを超えています")
        assert "ファイルサイズが10MBを超えています" in str(error)


class TestExceptionHandling:
    """例外ハンドリングのテストクラス"""

    def test_multiple_exception_types(self):
        """複数の例外タイプのテスト"""
        errors = [
            InvalidFileFormatError("形式エラー"),
            FileSizeExceededError("サイズエラー"),
            ConversionFailedError("変換エラー"),
        ]

        for error in errors:
            with pytest.raises(ImageConversionError):
                raise error

    def test_exception_in_function(self):
        """関数内での例外発生テスト"""

        def validate_file(size: int) -> None:
            if size > 10 * 1024 * 1024:
                raise FileSizeExceededError("ファイルサイズが大きすぎます")

        with pytest.raises(FileSizeExceededError):
            validate_file(11 * 1024 * 1024)

        # 正常なサイズではエラーが発生しない
        validate_file(5 * 1024 * 1024)
