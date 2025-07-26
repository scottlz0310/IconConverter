import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import os
from .logic import IconConverter
from .config import WINDOW_SIZE, PREVIEW_SIZE

class IconConverterApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("PNG to ICO Converter")
        self.root.geometry(WINDOW_SIZE)
        self.converter = IconConverter()
        self.preview_img = None
        self._build_widgets()

    def _build_widgets(self):
        self.btn_select_file = tk.Button(self.root, text="Select PNG File", command=self.select_file)
        self.btn_select_file.pack(pady=20)

        self.lbl_preview = tk.Label(self.root, text="画像プレビュー", bg="#eee")
        self.lbl_preview.pack(pady=10, fill="both", expand=True)

    def select_file(self):
        file_path = filedialog.askopenfilename(filetypes=[("PNG files", "*.png")])
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
                self.converter.convert_png_to_ico(file_path, save_path)

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
