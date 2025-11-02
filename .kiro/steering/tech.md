---
inclusion: always
---

# 技術スタック

## アーキテクチャ概要

- **バックエンド**: FastAPI + Python 3.13
- **フロントエンド**: React 18 + TypeScript 5.6 + Vite 6
- **通信**: RESTful API
- **デプロイ**: Docker + docker-compose

## バックエンド技術スタック

### パッケージ管理

**必須ツール**: `uv`
- `pip install`や直接の`python3`実行は禁止
- 全てのコマンドは`uv run <command>`経由で実行
- 依存関係は`pyproject.toml`で管理

### Pythonバージョン

- **最小**: Python 3.11
- **サポート**: 3.11, 3.12, 3.13
- **開発ターゲット**: 3.13

### コア依存関係

- **fastapi** (>=0.115.0) - 高速で現代的なWebフレームワーク
- **uvicorn** - ASGIサーバー
- **pydantic** (>=2.0) - データバリデーションとシリアライゼーション
- **python-multipart** - ファイルアップロード処理
- **pillow** (>=11.3.0) - 画像処理とICO生成
- **numpy** (>=2.3.2) - 透明度検出のための高速配列操作
- **loguru** (>=0.7.3) - 構造化ログ
- **slowapi** - レート制限

### 開発依存関係

- **pytest** (>=8.4.1) - テストフレームワーク
- **pytest-asyncio** - 非同期テスト
- **httpx** - APIクライアント（テスト用）
- **pytest-cov** (>=6.0.0) - カバレッジレポート
- **ruff** (>=0.8.0) - リントとフォーマット
- **mypy** (>=1.13.0) - 型チェック

## フロントエンド技術スタック

### パッケージ管理

**推奨ツール**: `pnpm`（または`npm`）
- Node.js 22以上推奨
- 依存関係は`package.json`で管理

### コア依存関係

- **react** (>=18.3) - UIライブラリ
- **typescript** (>=5.6) - 型安全性
- **vite** (>=6.0) - 高速ビルドツール
- **@tanstack/react-query** (>=5.0) - サーバー状態管理とキャッシング
- **zustand** (>=5.0) - クライアント状態管理
- **axios** - HTTP クライアント
- **react-dropzone** - ドラッグ&ドロップファイルアップロード

### UIライブラリ

- **tailwindcss** (>=3.4) - ユーティリティファーストCSS
- **shadcn/ui** - 高品質UIコンポーネント
  - Button, Card, Checkbox, Progress, Toast等

### 開発依存関係

- **eslint** - JavaScriptリンター
- **prettier** - コードフォーマッター
- **@testing-library/react** - コンポーネントテスト
- **playwright** - E2Eテスト

## よく使うコマンド

### バックエンド開発

```bash
# セットアップ
cd backend
uv venv --python 3.13
uv sync

# 開発サーバー起動
uv run uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# テスト実行
uv run pytest
uv run pytest --cov=backend

# リント・フォーマット
uv run ruff check .
uv run ruff format .
uv run mypy .
```

### フロントエンド開発

```bash
# セットアップ
cd frontend
pnpm install

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# プレビュー
pnpm preview

# リント・フォーマット
pnpm lint
pnpm format

# テスト
pnpm test
pnpm test:e2e
```

### Docker開発

```bash
# 開発環境起動
docker-compose up

# 本番ビルド
docker-compose -f docker-compose.prod.yml build

# コンテナ停止・削除
docker-compose down
```

### Makefileコマンド

```bash
make dev           # 開発環境起動（docker-compose）
make build         # 本番ビルド
make test          # 全テスト実行
make lint          # 全リント実行
make format        # 全フォーマット実行
make clean         # クリーンアップ
```

## コード品質ツール

### バックエンド（Python）

**Ruff設定**
- 行長: 120
- ターゲット: py311
- 有効ルール: E, W, F, I, UP, B, C90, T20
- print文禁止（テストを除く）

**Mypy設定**
- Strictモード有効
- 暗黙的なoptional禁止
- 未使用ignoreと冗長キャストに警告

**Pytest設定**
- テストパス: `backend/tests/`
- パターン: `test_*.py`
- カバレッジ目標: 80%

### フロントエンド（TypeScript）

**ESLint設定**
- React推奨ルール
- TypeScript推奨ルール
- アクセシビリティルール（jsx-a11y）

**Prettier設定**
- セミコロン: あり
- シングルクォート: あり
- 行長: 100

## API仕様

### エンドポイント

- `POST /api/convert` - 画像をICOファイルに変換
- `GET /api/health` - ヘルスチェック
- `GET /docs` - 自動生成APIドキュメント（Swagger UI）
- `GET /redoc` - 自動生成APIドキュメント（ReDoc）

### セキュリティ

- CORS設定（開発: localhost:5173、本番: 環境変数で設定）
- ファイルサイズ制限: 10MB
- レート制限: 10リクエスト/分
- ファイル形式検証（MIME type + 拡張子 + Pillow検証）

## デプロイメント

### Docker構成

- **backend**: Python 3.13-slim + uv
- **frontend**: Node 22-alpine（ビルド） + nginx-alpine（配信）
- **開発環境**: docker-compose（ホットリロード対応）
- **本番環境**: 最適化されたマルチステージビルド

### 環境変数

**バックエンド（.env）**
```
LOG_LEVEL=INFO
MAX_FILE_SIZE=10485760
CORS_ORIGINS=http://localhost:5173
```

**フロントエンド（.env）**
```
VITE_API_URL=http://localhost:8000
VITE_MAX_FILE_SIZE=10485760
```

## パフォーマンス目標

- バックエンド: 5MB画像の変換を5秒以内
- フロントエンド: 初回ロード時間3秒以内
- 非同期処理による高スループット
- コード分割とレイジーローディング

## CI/CD

- クロスプラットフォームテスト: Linux, macOS, Windows
- Pythonマトリクス: 3.11, 3.12, 3.13
- Node.jsバージョン: 22
- Conventional Commits準拠
- SemVerバージョニング
- 自動テスト・リント・ビルド
