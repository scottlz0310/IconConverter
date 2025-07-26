import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import os
from .logic import IconConverter
from .config import WINDOW_SIZE, PREVIEW_SIZE, DEFAULT_PRESERVE_TRANSPARENCY, SUPPORTED_IMAGE_FORMATS

class IconConverterApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Image to ICO Converter")
        self.root.geometry(WINDOW_SIZE)
        self.converter = IconConverter()
        self.preview_img = None
        self._build_widgets()

    def _build_widgets(self):
        self.btn_select_file = tk.Button(self.root, text="Select Image File", command=self.select_file)
        self.btn_select_file.pack(pady=10)

        # 透明化オプションのフレーム
        options_frame = tk.Frame(self.root)
        options_frame.pack(pady=5)

        # 透明化保持オプション
        self.transparency_var = tk.BooleanVar(value=DEFAULT_PRESERVE_TRANSPARENCY)
        self.chk_transparency = tk.Checkbutton(
            options_frame, 
            text="透明化保持", 
            variable=self.transparency_var,
            command=self._on_transparency_change
        )
        self.chk_transparency.pack(anchor='w')

        # 自動背景透明化オプション
        self.auto_transparent_var = tk.BooleanVar(value=False)
        self.chk_auto_transparent = tk.Checkbutton(
            options_frame, 
            text="自動背景透明化", 
            variable=self.auto_transparent_var,
            command=self._on_auto_transparent_change
        )
        self.chk_auto_transparent.pack(anchor='w')

        self.lbl_preview = tk.Label(self.root, text="画像プレビュー", bg="#eee")
        self.lbl_preview.pack(pady=10, fill="both", expand=True)

    def _on_transparency_change(self):
        """透明化保持の変更時の処理"""
        if self.transparency_var.get():
            self.auto_transparent_var.set(False)

    def _on_auto_transparent_change(self):
        """自動背景透明化の変更時の処理"""
        if self.auto_transparent_var.get():
            self.transparency_var.set(False)

    def select_file(self):
        file_path = filedialog.askopenfilename(filetypes=SUPPORTED_IMAGE_FORMATS)
        if file_path:
            self.show_preview(file_path)
            base = os.path.splitext(os.path.basename(file_path))[0]
            default_name = base + ".ico"
            save_path = filedialog.asksaveasfilename(
                defaultextension=".ico",
                filetypes=[("ICO files", "*.ico")],
                initialfile=default_name
            )
            if save_path:
                preserve_transparency = self.transparency_var.get()
                auto_transparent_bg = self.auto_transparent_var.get()
                self.converter.convert_image_to_ico(file_path, save_path, preserve_transparency, auto_transparent_bg)

    def show_preview(self, img_path: str):
        try:
            img = Image.open(img_path)
            img.thumbnail(PREVIEW_SIZE)
            self.preview_img = ImageTk.PhotoImage(img)
            self.lbl_preview.config(image=self.preview_img, text="")
            self.lbl_preview.image = self.preview_img
        except Exception as e:
            messagebox.showerror("エラー", f"プレビューの表示に失敗しました:\n{e}")

def main():
    root = tk.Tk()
    _ = IconConverterApp(root)
    root.mainloop()
