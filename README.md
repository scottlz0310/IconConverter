# PNG to ICO Converter

このプロジェクトは、PNG画像を複数サイズのICOファイルに変換するシンプルなGUIアプリケーションです。

## 特徴
- PNG画像を選択し、Windows用アイコン（ICO形式）に変換
- 16x16, 32x32, 48x48, 64x64, 128x128, 256x256 の複数サイズを同時に出力
- 画像プレビュー機能付き
- シンプルなGUI（Tkinter使用）

## 必要条件
- Python 3.7以降
- Pillow ライブラリ

## セットアップ
1. 仮想環境の作成（推奨）
2. 依存パッケージのインストール

```bash
python3 -m venv venv --system-site-packages
source venv/bin/activate  # Linux/macOSの場合
# source venv/Scripts/activate  # Windowsの場合
pip install -r requirements.txt
```

## 使い方
1. アプリを起動

```bash
source venv/bin/activate  # 仮想環境をアクティベート
python IconConv.py
```

2. 「Select PNG File」ボタンを押してPNG画像を選択
3. プレビューを確認し、保存先とファイル名を指定してICOファイルを保存

## ファイル構成
- `IconConv.py` : メインアプリケーション
- `requirements.txt` : 依存パッケージリスト
- `docs/` : ドキュメント（詳細なコードレビュー等）
- `CHANGELOG.md` : 変更履歴

## ドキュメント
- 詳細なコードレビューや技術的な解説は`docs/`ディレクトリ内にまとめています。
- バージョンごとの変更履歴は[CHANGELOG.md](./CHANGELOG.md)をご覧ください。

## ライセンス
このプロジェクトはMITライセンスです。
