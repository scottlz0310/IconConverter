# Image to ICO Converter

このプロジェクトは、様々な画像形式を複数サイズのICOファイルに変換するアプリケーションです。

## 🚀 WebUI版（開発中）

モダンなWebアプリケーション版を開発中です。ブラウザからアクセス可能で、より洗練されたUIとUXを提供します。

- **バックエンド**: FastAPI + Python 3.13
- **フロントエンド**: React 18 + TypeScript + Vite
- **詳細**: [WebUI移行仕様書](.kiro/specs/webui-migration/)

## デスクトップGUI版（既存）

Tkinterベースのデスクトップアプリケーション版も引き続き利用可能です。

## 特徴
- **複数画像形式対応**: PNG, JPEG, BMP, GIF, TIFF, WebP形式からICOファイルに変換
- 16x16, 32x32, 48x48, 64x64, 128x128, 256x256 の複数サイズを同時に出力
- 画像プレビュー機能付き
- シンプルなGUI（Tkinter使用）
- コード全体をクラスベース・モジュール分割でリファクタリング
- ログ出力機能（logs/）
- ユニットテスト・統合テスト付き
- **自動背景透明化機能**
  - 単色背景の画像ファイルを自動で透明化
  - 画像の四隅の色を検出して背景色を推定
  - 類似色を透明化してICOファイルに変換
- **画像形式別の透明化サポート**
  - PNG、GIF、WebP: 透明化完全サポート
  - JPEG、BMP、TIFF: 自動背景透明化で対応

## 対応画像形式
- **PNG** (.png) - 透明化完全サポート
- **JPEG** (.jpg, .jpeg) - 自動背景透明化対応
- **BMP** (.bmp) - 自動背景透明化対応
- **GIF** (.gif) - 透明化完全サポート
- **TIFF** (.tiff) - 自動背景透明化対応
- **WebP** (.webp) - 透明化完全サポート

## 必要条件
- Python 3.7以降
- Pillow ライブラリ
- numpy（高速な画像処理のため）
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

2. 「Select Image File」ボタンを押して画像ファイルを選択
3. 透明化オプションを選択
   - **透明化保持**: 既に透明チャンネルがある画像の透明部分を保持（PNG、GIF、WebP）
   - **自動背景透明化**: 単色背景を自動検出して透明化（全形式対応）
4. プレビューを確認し、保存先とファイル名を指定してICOファイルを保存

## テスト
ユニットテスト・統合テストは以下で実行できます。

```bash
PYTHONPATH=. pytest tests/
```

詳細は[tests/README.md](./tests/README.md)を参照してください。

## ファイル構成

### WebUI版（開発中）
```
backend/              # FastAPIバックエンド
├── core/            # 既存の画像処理ロジック（iconconverterから移行）
├── services/        # ビジネスロジック層
├── routers/         # APIエンドポイント
└── tests/           # バックエンドテスト

frontend/            # React + TypeScriptフロントエンド
├── src/
│   ├── components/  # UIコンポーネント
│   ├── hooks/       # カスタムフック
│   ├── stores/      # 状態管理（Zustand）
│   ├── services/    # APIクライアント
│   └── types/       # TypeScript型定義
└── tests/           # フロントエンドテスト
```

### デスクトップGUI版（既存）
- `main.py` : エントリーポイント
- `iconconverter/` : アプリ本体（gui, logic, utils, config）
- `tests/` : テストコード・テストガイド
- `debug/` : デバッグ用
- `logs/` : ログ出力（.gitignore管理外）
- `docs/` : ドキュメント（詳細なコードレビュー等）
- `CHANGELOG.md` : 変更履歴

## ドキュメント
- 詳細なコードレビューや技術的な解説は`docs/`ディレクトリ内にまとめています。
- バージョンごとの変更履歴は[CHANGELOG.md](./CHANGELOG.md)をご覧ください。

## ライセンス
このプロジェクトはMITライセンスです。
