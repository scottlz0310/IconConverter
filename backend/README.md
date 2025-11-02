# Image to ICO Converter - Backend

FastAPIベースのバックエンドサービス。画像をICOファイルに変換します。

## 機能

- 複数画像形式対応: PNG, JPEG, BMP, GIF, TIFF, WebP → ICO
- 6つのアイコンサイズを同時生成: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- 透明化オプション:
  - 既存の透明度を保持
  - 自動背景除去
- RESTful API
- 構造化ログ

## セットアップ

```bash
# 依存関係のインストール
uv sync

# 開発サーバー起動
uv run uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## API エンドポイント

- `POST /api/convert` - 画像をICOファイルに変換
- `GET /api/health` - ヘルスチェック
- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc

## 技術スタック

- FastAPI 0.115+
- Python 3.11+
- Pillow 11.3+
- numpy 2.3+
- loguru 0.7+
