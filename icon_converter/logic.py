from PIL import Image
from tkinter import messagebox
from .config import ICON_SIZES
from .utils import setup_logger
import numpy as np

class IconConverter:
    def __init__(self):
        self.logger = setup_logger(self.__class__.__name__)

    def _detect_background_color(self, image: Image.Image, tolerance: int = 10) -> tuple:
        """画像の四隅の色を検出して背景色を推定"""
        width, height = image.size
        corners = [
            image.getpixel((0, 0)),  # 左上
            image.getpixel((width-1, 0)),  # 右上
            image.getpixel((0, height-1)),  # 左下
            image.getpixel((width-1, height-1))  # 右下
        ]
        
        # 最も頻出する色を背景色として推定
        color_counts = {}
        for color in corners:
            color_counts[color] = color_counts.get(color, 0) + 1
        
        background_color = max(color_counts, key=color_counts.get)
        return background_color

    def _make_color_transparent(self, image: Image.Image, target_color: tuple, tolerance: int = 10) -> Image.Image:
        """指定した色を透明化"""
        # RGBAモードに変換
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        # 画像データをnumpy配列に変換
        img_array = np.array(image)
        
        # 色の類似度を計算
        color_diff = np.sqrt(np.sum((img_array[:, :, :3] - target_color[:3])**2, axis=2))
        
        # 類似度が閾値以下のピクセルを透明化
        mask = color_diff <= tolerance
        img_array[mask, 3] = 0  # アルファチャンネルを0（透明）に設定
        
        return Image.fromarray(img_array)

    def convert_png_to_ico(self, input_png_path: str, output_ico_path: str, preserve_transparency: bool = True, auto_transparent_bg: bool = False) -> None:
        try:
            png_image = Image.open(input_png_path)
            
            # 自動背景透明化
            if auto_transparent_bg and not preserve_transparency:
                background_color = self._detect_background_color(png_image)
                png_image = self._make_color_transparent(png_image, background_color)
                self.logger.info(f"背景色 {background_color} を自動透明化")
            
            # 透明化処理
            elif preserve_transparency and png_image.mode != 'RGBA':
                # RGB画像をRGBAに変換（透明チャンネル追加）
                png_image = png_image.convert('RGBA')
            elif not preserve_transparency and png_image.mode == 'RGBA':
                # RGBA画像をRGBに変換（透明チャンネル削除）
                png_image = png_image.convert('RGB')
            
            png_image.save(output_ico_path, format="ICO", sizes=ICON_SIZES)
            
            if auto_transparent_bg and not preserve_transparency:
                transparency_status = "自動背景透明化"
            else:
                transparency_status = "透明化保持" if preserve_transparency else "透明化無効"
            
            messagebox.showinfo("完了", f"PNG画像を複数サイズのICOファイルに変換しました。\n{transparency_status}")
            self.logger.info(f"変換成功: {input_png_path} -> {output_ico_path} ({transparency_status})")
        except Exception as e:
            messagebox.showerror("エラー", f"変換に失敗しました:\n{e}")
            self.logger.error(f"変換失敗: {input_png_path} -> {output_ico_path} | {e}")
