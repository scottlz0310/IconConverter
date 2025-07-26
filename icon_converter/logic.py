from PIL import Image
from tkinter import messagebox
from .config import ICON_SIZES
from .utils import setup_logger

class IconConverter:
    def __init__(self):
        self.logger = setup_logger(self.__class__.__name__)

    def convert_png_to_ico(self, input_png_path: str, output_ico_path: str) -> None:
        try:
            png_image = Image.open(input_png_path)
            png_image.save(output_ico_path, format="ICO", sizes=ICON_SIZES)
            messagebox.showinfo("完了", "PNG画像を複数サイズのICOファイルに変換しました。")
            self.logger.info(f"変換成功: {input_png_path} -> {output_ico_path}")
        except Exception as e:
            messagebox.showerror("エラー", f"変換に失敗しました:\n{e}")
            self.logger.error(f"変換失敗: {input_png_path} -> {output_ico_path} | {e}")
