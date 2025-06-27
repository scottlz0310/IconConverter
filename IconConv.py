import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import os

# プレビュー画像用のグローバル変数
preview_img = None

# PNG→ICO変換
def convert_png_to_ico(input_png_path, output_ico_path):
    try:
        png_image = Image.open(input_png_path)
        icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        png_image.save(output_ico_path, format="ICO", sizes=icon_sizes)
        messagebox.showinfo("完了", "PNG画像を複数サイズのICOファイルに変換しました。")
    except Exception as e:
        messagebox.showerror("エラー", f"変換に失敗しました:\n{e}")

def select_file():
    file_path = filedialog.askopenfilename(filetypes=[("PNG files", "*.png")])
    if file_path:
        show_preview(file_path)
        # 入力ファイル名から拡張子をicoに変換してデフォルト名にする
        base = os.path.splitext(os.path.basename(file_path))[0]
        default_name = base + ".ico"
        save_path = filedialog.asksaveasfilename(
            defaultextension=".ico",
            filetypes=[("ICO files", "*.ico")],
            initialfile=default_name
        )
        if save_path:
            convert_png_to_ico(file_path, save_path)

def show_preview(img_path):
    global preview_img
    try:
        img = Image.open(img_path)
        img.thumbnail((200, 200))  # プレビュー用にリサイズ
        preview_img = ImageTk.PhotoImage(img)
        lbl_preview.config(image=preview_img, text="")
        lbl_preview.image = preview_img  # 参照保持
    except Exception as e:
        messagebox.showerror("エラー", f"プレビューの表示に失敗しました:\n{e}")

root = tk.Tk()
root.title("PNG to ICO Converter")
root.geometry("220x260") # プレビューとボタンに合わせたサイズ

btn_select_file = tk.Button(root, text="Select PNG File", command=select_file)
btn_select_file.pack(pady=20)

lbl_preview = tk.Label(root, text="画像プレビュー", bg="#eee")
lbl_preview.pack(pady=10, fill="both", expand=True)

root.mainloop()
