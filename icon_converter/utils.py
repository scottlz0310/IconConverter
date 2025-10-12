import logging
import os

from PIL import Image


def setup_logger(name: str) -> logging.Logger:
    os.makedirs("logs", exist_ok=True)
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        fh = logging.FileHandler("logs/app.log", encoding="utf-8")
        formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
        fh.setFormatter(formatter)
        logger.addHandler(fh)
    return logger


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
