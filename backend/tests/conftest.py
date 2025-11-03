"""Pytest configuration and fixtures for backend tests."""

import io

import pytest
from PIL import Image


@pytest.fixture
def sample_png_bytes() -> bytes:
    """PNG画像のバイナリデータを生成するフィクスチャ

    Returns:
        bytes: PNG形式の画像データ
    """
    img = Image.new("RGBA", (100, 100), color=(255, 0, 0, 255))
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture
def sample_png_with_transparency_bytes() -> bytes:
    """透明度付きPNG画像のバイナリデータを生成するフィクスチャ

    Returns:
        bytes: 透明度付きPNG形式の画像データ
    """
    img = Image.new("RGBA", (100, 100), color=(255, 0, 0, 128))
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture
def sample_jpeg_bytes() -> bytes:
    """JPEG画像のバイナリデータを生成するフィクスチャ

    Returns:
        bytes: JPEG形式の画像データ
    """
    img = Image.new("RGB", (100, 100), color=(0, 255, 0))
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    return buffer.getvalue()


@pytest.fixture
def sample_bmp_bytes() -> bytes:
    """BMP画像のバイナリデータを生成するフィクスチャ

    Returns:
        bytes: BMP形式の画像データ
    """
    img = Image.new("RGB", (100, 100), color=(0, 0, 255))
    buffer = io.BytesIO()
    img.save(buffer, format="BMP")
    return buffer.getvalue()


@pytest.fixture
def invalid_file_bytes() -> bytes:
    """無効なファイルデータを生成するフィクスチャ

    Returns:
        bytes: 画像ではないバイナリデータ
    """
    return b"This is not an image file"


@pytest.fixture
def large_file_bytes() -> bytes:
    """大きなファイルデータを生成するフィクスチャ（11MB）

    Returns:
        bytes: 11MBのバイナリデータ
    """
    return b"x" * (11 * 1024 * 1024)
