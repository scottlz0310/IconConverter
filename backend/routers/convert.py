"""画像変換エンドポイント

POST /api/convert - 画像をICOファイルに変換
"""

from io import BytesIO
from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, File, Form, Request, UploadFile
from fastapi.responses import StreamingResponse
from loguru import logger
from slowapi import Limiter
from slowapi.util import get_remote_address

from exceptions import ConversionFailedError, FileSizeExceededError, InvalidFileFormatError
from services.conversion import ImageConversionService
from services.validation import ValidationService

router = APIRouter(prefix="/api", tags=["conversion"])

# レート制限の設定
limiter = Limiter(key_func=get_remote_address)

# サービスインスタンス
validation_service = ValidationService()
conversion_service = ImageConversionService()


@router.post(
    "/convert",
    response_class=StreamingResponse,
    summary="画像をICOファイルに変換",
    description=(
        "アップロードされた画像を6つのサイズ（16x16, 32x32, 48x48, 64x64, 128x128, 256x256）のICOファイルに変換します。"
    ),
    responses={
        200: {
            "description": "変換成功",
            "content": {"application/octet-stream": {}},
        },
        400: {"description": "バリデーションエラー"},
        413: {"description": "ファイルサイズ超過"},
        415: {"description": "サポートされていないファイル形式"},
        429: {"description": "レート制限超過"},
        500: {"description": "サーバーエラー"},
    },
)
@limiter.limit("10/minute")
async def convert_image(
    request: Request,
    file: UploadFile = File(..., description="変換する画像ファイル"),  # noqa: B008
    preserve_transparency: bool = Form(  # noqa: B008
        default=True,
        description="既存の透明度を保持する（PNG, GIF, WebP）",
    ),
    auto_transparent_bg: bool = Form(  # noqa: B008
        default=False,
        description="自動背景透明化（四隅のピクセルから単色背景を検出）",
    ),
) -> StreamingResponse:
    """画像をICOファイルに変換するエンドポイント

    レート制限: 10リクエスト/分

    Args:
        request: リクエストオブジェクト（レート制限に必要）
        file: アップロードされた画像ファイル
        preserve_transparency: 透明化を保持するか
        auto_transparent_bg: 自動背景透明化を行うか

    Returns:
        StreamingResponse: ICOファイルのバイナリストリーム

    Raises:
        HTTPException: バリデーションエラーまたは変換エラー
    """
    logger.info(
        f"Received conversion request: filename={file.filename}, "
        f"content_type={file.content_type}, "
        f"preserve_transparency={preserve_transparency}, "
        f"auto_transparent_bg={auto_transparent_bg}",
    )

    try:
        # ファイルコンテンツを読み込み
        file_content = await file.read()
        file_size = len(file_content)

        # BytesIOでラップ
        file_stream = BytesIO(file_content)

        # バリデーション
        validation_service.validate_uploaded_file(
            filename=file.filename or "unknown",
            file_size=file_size,
            file_content=file_stream,
            content_type=file.content_type,
        )

        # 変換処理（非同期）
        ico_data = await conversion_service.convert_to_ico_async(
            file_content=file_stream,
            filename=file.filename or "image.png",
            preserve_transparency=preserve_transparency,
            auto_transparent_bg=auto_transparent_bg,
        )

        # 出力ファイル名を生成（元のファイル名から拡張子を除いて.icoを追加）
        original_name = Path(file.filename or "output").stem
        output_filename = f"{original_name}.ico"

        logger.info(f"Conversion successful: {file.filename} -> {output_filename} ({len(ico_data)} bytes)")

        # RFC 5987に従ってファイル名をエンコード（日本語対応）
        filename_utf8 = quote(output_filename, safe='')
        content_disposition = f'attachment; filename="{output_filename}"; filename*=UTF-8\'\'{filename_utf8}'

        # StreamingResponseでICOファイルを返却
        return StreamingResponse(
            BytesIO(ico_data),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition": content_disposition,
                "Content-Length": str(len(ico_data)),
            },
        )

    except (InvalidFileFormatError, FileSizeExceededError, ConversionFailedError):
        # カスタム例外はそのまま再送出（例外ハンドラーで処理）
        raise

    except Exception as e:
        # 予期しないエラー
        logger.error(f"Unexpected error during conversion: {e}", exc_info=True)
        # エラーメッセージをUTF-8で安全にエンコード
        error_msg = str(e)
        try:
            # UTF-8でエンコード可能か確認
            error_msg.encode('utf-8')
        except UnicodeEncodeError:
            error_msg = repr(e)
        raise ConversionFailedError(f"予期しないエラーが発生しました: {error_msg}") from e
