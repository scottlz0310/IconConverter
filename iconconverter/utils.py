import os
from loguru import logger
from PIL import Image


def setup_logger(name: str) -> None:
    """Configure loguru logger with structured JSON output"""
    os.makedirs("logs", exist_ok=True)
    
    # Remove default handler
    logger.remove()
    
    # Add structured JSON file logging
    logger.add(
        "logs/app.log",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message}",
        level="INFO",
        rotation="10 MB",
        retention="30 days",
        encoding="utf-8",
        enqueue=True,
    )
    
    # Add console output for development
    logger.add(
        lambda msg: print(msg, end=""),
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> | {message}",
        level="INFO",
    )


def prepare_image_for_conversion(image: Image.Image, preserve_transparency: bool = True) -> Image.Image:
    """画像をICO変換用に前処理する"""
    # JPEG等のアルファチャンネルがない画像をRGBAに変換
    if preserve_transparency and image.mode != "RGBA":
        image = image.convert("RGBA")
    elif not preserve_transparency and image.mode == "RGBA":
        # RGBA画像をRGBに変換（透明チャンネル削除）
        image = image.convert("RGB")

    return image


def get_file_extension(file_path: str) -> str:
    """ファイルパスから拡張子を取得"""
    return os.path.splitext(file_path)[1].lower()


def is_transparency_supported(file_path: str) -> bool:
    """ファイル形式が透明化をサポートしているかチェック"""
    ext = get_file_extension(file_path)
    # PNG、GIF、WebPは透明化をサポート
    return ext in [".png", ".gif", ".webp"]
