# PNG to ICO Converter

このプロジェクトは、PNG画像を複数サイズのICOファイルに変換するシンプルなGUIアプリケーションです。

## 特徴
- PNG画像を選択し、Windows用アイコン（ICO形式）に変換
- 16x16, 32x32, 48x48, 64x64, 128x128, 256x256 の複数サイズを同時に出力
- 画像プレビュー機能付き
- シンプルなGUI（Tkinter使用）
- コード全体をクラスベース・モジュール分割でリファクタリング
- ログ出力機能（logs/）
- ユニットテスト・統合テスト付き

## 必要条件
- Python 3.7以降
- Pillow ライブラリ
- pytest（テスト実行時）

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
python main.py
```

2. 「Select PNG File」ボタンを押してPNG画像を選択
3. プレビューを確認し、保存先とファイル名を指定してICOファイルを保存

## テスト
ユニットテスト・統合テストは以下で実行できます。

```bash
PYTHONPATH=. pytest tests/
```

詳細は[tests/README.md](./tests/README.md)を参照してください。

## ファイル構成
- `main.py` : エントリーポイント
- `icon_converter/` : アプリ本体（gui, logic, utils, config）
- `tests/` : テストコード・テストガイド
- `debug/` : デバッグ用
- `logs/` : ログ出力（.gitignore管理外）
- `docs/` : ドキュメント（詳細なコードレビュー等）
- `requirements.txt` : 依存パッケージリスト
- `CHANGELOG.md` : 変更履歴

## ドキュメント
- 詳細なコードレビューや技術的な解説は`docs/`ディレクトリ内にまとめています。
- バージョンごとの変更履歴は[CHANGELOG.md](./CHANGELOG.md)をご覧ください。

## ライセンス
このプロジェクトはMITライセンスです。
