from tkinter import messagebox
from typing import Any

import numpy as np
from PIL import Image

from .config import ICON_SIZES
from .utils import is_transparency_supported, prepare_image_for_conversion, setup_logger


class IconConverter:
    def __init__(self):
        self.logger = setup_logger(self.__class__.__name__)

    def _detect_background_color(self, image: Image.Image, tolerance: int = 10) -> Any:
        """画像の四隅の色を検出して背景色を推定"""
        width, height = image.size
        corners = [
            image.getpixel((0, 0)),  # 左上
            image.getpixel((width - 1, 0)),  # 右上
            image.getpixel((0, height - 1)),  # 左下
            image.getpixel((width - 1, height - 1)),  # 右下
        ]
        # 最も頻出する色を背景色として推定
        color_counts: dict[Any, int] = {}
        for color in corners:
            color_counts[color] = color_counts.get(color, 0) + 1

        background_color = max(color_counts, key=lambda x: color_counts[x])
        return background_color

    def _make_color_transparent(self, image: Image.Image, target_color: Any, tolerance: int = 10) -> Image.Image:
        """指定した色を透明化"""
        # RGBAモードに変換
        if image.mode != "RGBA":
            image = image.convert("RGBA")

        # 画像データをnumpy配列に変換
        img_array = np.array(image)

        # 色の類似度を計算
        color_diff = np.sqrt(np.sum((img_array[:, :, :3] - target_color[:3]) ** 2, axis=2))

        # 類似度が閾値以下のピクセルを透明化
        mask = color_diff <= tolerance
        img_array[mask, 3] = 0  # アルファチャンネルを0（透明）に設定

        return Image.fromarray(img_array)

    def convert_image_to_ico(
        self,
        input_path: str,
        output_ico_path: str,
        preserve_transparency: bool = True,
        auto_transparent_bg: bool = False,
    ) -> None:
        try:
            original_image = Image.open(input_path)
            # 型アノテーションのために明示的にキャスト
            image: Image.Image = original_image

            # ファイル形式に応じた透明化サポートチェック
            if preserve_transparency and not is_transparency_supported(input_path):
                self.logger.warning(f"ファイル形式 {input_path} は透明化をサポートしていません")
                preserve_transparency = False

            # 自動背景透明化
            if auto_transparent_bg and not preserve_transparency:
                background_color = self._detect_background_color(image)
                image = self._make_color_transparent(image, background_color)
                self.logger.info(f"背景色 {background_color} を自動透明化")

            # 画像前処理（utils.pyの責務）
            processed_image = prepare_image_for_conversion(image, preserve_transparency)
            image = processed_image

            image.save(output_ico_path, format="ICO", sizes=ICON_SIZES)

            if auto_transparent_bg and not preserve_transparency:
                transparency_status = "自動背景透明化"
            else:
                transparency_status = "透明化保持" if preserve_transparency else "透明化無効"

            messagebox.showinfo(
                "完了",
                f"画像を複数サイズのICOファイルに変換しました。\n{transparency_status}",
            )
            self.logger.info(f"変換成功: {input_path} -> {output_ico_path} ({transparency_status})")
        except Exception as e:
            messagebox.showerror("エラー", f"変換に失敗しました:\n{e}")
            self.logger.error(f"変換失敗: {input_path} -> {output_ico_path} | {e}")

    # 後方互換性のため、古い関数名も残す
    def convert_png_to_ico(
        self,
        input_png_path: str,
        output_ico_path: str,
        preserve_transparency: bool = True,
        auto_transparent_bg: bool = False,
    ) -> None:
        """後方互換性のためのエイリアス"""
        self.convert_image_to_ico(input_png_path, output_ico_path, preserve_transparency, auto_transparent_bg)
