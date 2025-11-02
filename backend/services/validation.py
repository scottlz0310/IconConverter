"""ファイルバリデーションサービス

アップロードされたファイルの形式とサイズを検証します。
"""

import mimetypes
from pathlib import Path
from typing import BinaryIO

from PIL import Image

from exceptions import FileSizeExceededError, InvalidFileFormatError

# 定数
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/bmp",
    "image/gif",
    "image/tiff",
    "image/webp",
}
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".gif", ".tiff", ".tif", ".webp"}


class ValidationService:
    """ファイルバリデーションサービスクラス"""

    @staticmethod
    def validate_file_size(file_size: int) -> None:
        """ファイルサイズを検証

        Args:
            file_size: ファイルサイズ（バイト）

        Raises:
            FileSizeExceededError: ファイルサイズが制限を超えた場合
        """
        if file_size > MAX_FILE_SIZE:
            raise FileSizeExceededError(
                f"ファイルサイズが大きすぎます。最大{MAX_FILE_SIZE / (1024 * 1024):.0f}MBまでです。",
            )

    @staticmethod
    def validate_file_format(filename: str, content_type: str | None = None) -> None:
        """ファイル形式を検証（拡張子とMIMEタイプ）

        Args:
            filename: ファイル名
            content_type: MIMEタイプ（オプション）

        Raises:
            InvalidFileFormatError: サポートされていないファイル形式の場合
        """
        # 拡張子チェック
        file_extension = Path(filename).suffix.lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            raise InvalidFileFormatError(
                f"サポートされていないファイル形式です: {file_extension}。対応形式: PNG, JPEG, BMP, GIF, TIFF, WebP",
            )

        # MIMEタイプチェック（提供されている場合）
        if content_type:
            if content_type not in ALLOWED_MIME_TYPES:
                raise InvalidFileFormatError(f"サポートされていないMIMEタイプです: {content_type}")
        else:
            # MIMEタイプが提供されていない場合は拡張子から推測
            guessed_type, _ = mimetypes.guess_type(filename)
            if guessed_type and guessed_type not in ALLOWED_MIME_TYPES:
                raise InvalidFileFormatError(f"サポートされていないファイル形式です: {guessed_type}")

    @staticmethod
    def validate_image_content(file_content: BinaryIO) -> None:
        """画像ファイルの内容を検証（Pillowで実際に開けるか確認）

        Args:
            file_content: ファイルコンテンツ（バイナリストリーム）

        Raises:
            InvalidFileFormatError: 画像として開けない、または破損している場合
        """
        try:
            # ファイルポインタを先頭に戻す
            file_content.seek(0)

            # Pillowで画像を開いて検証
            with Image.open(file_content) as img:
                # 画像の基本情報を取得して検証
                img.verify()

            # verifyの後はファイルを再度開く必要があるため、ポインタを先頭に戻す
            file_content.seek(0)

            # 実際に画像を読み込めるか確認
            with Image.open(file_content) as img:
                img.load()

            # 検証後、ファイルポインタを先頭に戻す
            file_content.seek(0)

        except Exception as e:
            raise InvalidFileFormatError(
                f"画像ファイルとして読み込めません。ファイルが破損しているか、サポートされていない形式です: {str(e)}",
            ) from e

    @classmethod
    def validate_uploaded_file(
        cls,
        filename: str,
        file_size: int,
        file_content: BinaryIO,
        content_type: str | None = None,
    ) -> None:
        """アップロードされたファイルを包括的に検証

        Args:
            filename: ファイル名
            file_size: ファイルサイズ（バイト）
            file_content: ファイルコンテンツ（バイナリストリーム）
            content_type: MIMEタイプ（オプション）

        Raises:
            FileSizeExceededError: ファイルサイズが制限を超えた場合
            InvalidFileFormatError: サポートされていないファイル形式の場合
        """
        # ファイルサイズ検証
        cls.validate_file_size(file_size)

        # ファイル形式検証（拡張子とMIMEタイプ）
        cls.validate_file_format(filename, content_type)

        # 画像内容検証（Pillowで実際に開けるか）
        cls.validate_image_content(file_content)
