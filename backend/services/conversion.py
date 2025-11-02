"""画像変換サービス

画像をICOファイルに変換するサービスを提供します。
一時ファイル管理と非同期処理をサポートします。
"""

import asyncio
import tempfile
from pathlib import Path
from typing import BinaryIO

from loguru import logger

from core.logic import IconConverter
from exceptions import ConversionFailedError


class ImageConversionService:
    """画像変換サービスクラス

    既存のIconConverterクラスをラップし、Web API向けの機能を提供します。
    - 一時ファイル管理（作成・削除）
    - 非同期変換処理
    - エラーハンドリングとログ記録
    """

    def __init__(self):
        """ImageConversionServiceを初期化"""
        self.converter = IconConverter()
        logger.info("ImageConversionService initialized")

    def _create_temp_file(self, suffix: str) -> Path:
        """一時ファイルを作成

        Args:
            suffix: ファイル拡張子（例: '.png', '.ico'）

        Returns:
            Path: 作成された一時ファイルのパス
        """
        # 一時ファイルを作成（自動削除はFalse、手動で管理）
        temp_file = tempfile.NamedTemporaryFile(suffix=suffix, delete=False, prefix="iconconv_")
        temp_file.close()
        temp_path = Path(temp_file.name)
        logger.debug(f"Created temporary file: {temp_path}")
        return temp_path

    def _cleanup_temp_file(self, file_path: Path) -> None:
        """一時ファイルを削除

        Args:
            file_path: 削除する一時ファイルのパス
        """
        try:
            if file_path.exists():
                file_path.unlink()
                logger.debug(f"Deleted temporary file: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to delete temporary file {file_path}: {e}")

    def _save_uploaded_file(self, file_content: BinaryIO, temp_path: Path) -> None:
        """アップロードされたファイルを一時ファイルに保存

        Args:
            file_content: ファイルコンテンツ（バイナリストリーム）
            temp_path: 保存先の一時ファイルパス
        """
        try:
            file_content.seek(0)
            with open(temp_path, "wb") as f:
                f.write(file_content.read())
            logger.debug(f"Saved uploaded file to: {temp_path}")
        except Exception as e:
            logger.error(f"Failed to save uploaded file: {e}")
            raise ConversionFailedError(f"ファイルの保存に失敗しました: {str(e)}") from e

    def _read_ico_file(self, ico_path: Path) -> bytes:
        """ICOファイルを読み込み

        Args:
            ico_path: ICOファイルのパス

        Returns:
            bytes: ICOファイルのバイナリデータ
        """
        try:
            with open(ico_path, "rb") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Failed to read ICO file: {e}")
            raise ConversionFailedError(f"ICOファイルの読み込みに失敗しました: {str(e)}") from e

    def convert_to_ico(
        self,
        file_content: BinaryIO,
        filename: str,
        preserve_transparency: bool = True,
        auto_transparent_bg: bool = False,
    ) -> bytes:
        """画像をICOファイルに変換（同期版）

        Args:
            file_content: 画像ファイルのバイナリストリーム
            filename: 元のファイル名
            preserve_transparency: 透明化を保持するか
            auto_transparent_bg: 自動背景透明化を行うか

        Returns:
            bytes: 変換されたICOファイルのバイナリデータ

        Raises:
            ConversionFailedError: 変換処理が失敗した場合
        """
        input_temp_path = None
        output_temp_path = None

        try:
            # 入力ファイルの拡張子を取得
            input_suffix = Path(filename).suffix or ".png"

            # 一時ファイルを作成
            input_temp_path = self._create_temp_file(input_suffix)
            output_temp_path = self._create_temp_file(".ico")

            # アップロードされたファイルを一時ファイルに保存
            self._save_uploaded_file(file_content, input_temp_path)

            logger.info(
                f"Starting conversion: {filename} "
                f"(preserve_transparency={preserve_transparency}, "
                f"auto_transparent_bg={auto_transparent_bg})",
            )

            # IconConverterで変換
            self.converter.convert_image_to_ico(
                input_path=str(input_temp_path),
                output_ico_path=str(output_temp_path),
                preserve_transparency=preserve_transparency,
                auto_transparent_bg=auto_transparent_bg,
            )

            # 変換されたICOファイルを読み込み
            ico_data = self._read_ico_file(output_temp_path)

            logger.info(f"Conversion completed successfully: {filename} -> ICO ({len(ico_data)} bytes)")

            return ico_data

        except ConversionFailedError:
            # 既にConversionFailedErrorの場合はそのまま再送出
            raise
        except Exception as e:
            logger.error(f"Conversion failed for {filename}: {e}")
            raise ConversionFailedError(f"画像の変換に失敗しました: {str(e)}") from e

        finally:
            # 一時ファイルをクリーンアップ
            if input_temp_path:
                self._cleanup_temp_file(input_temp_path)
            if output_temp_path:
                self._cleanup_temp_file(output_temp_path)

    async def convert_to_ico_async(
        self,
        file_content: BinaryIO,
        filename: str,
        preserve_transparency: bool = True,
        auto_transparent_bg: bool = False,
    ) -> bytes:
        """画像をICOファイルに変換（非同期版）

        Args:
            file_content: 画像ファイルのバイナリストリーム
            filename: 元のファイル名
            preserve_transparency: 透明化を保持するか
            auto_transparent_bg: 自動背景透明化を行うか

        Returns:
            bytes: 変換されたICOファイルのバイナリデータ

        Raises:
            ConversionFailedError: 変換処理が失敗した場合
        """
        # CPU集約的な処理を別スレッドで実行
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.convert_to_ico,
            file_content,
            filename,
            preserve_transparency,
            auto_transparent_bg,
        )
