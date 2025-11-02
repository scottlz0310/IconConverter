# 設計書: WebUI移行

## 概要

TkinterベースのデスクトップアプリケーションをモダンなWebアプリケーションに移行する。バックエンドにFastAPI、フロントエンドにReact + TypeScriptを採用し、既存の画像処理ロジック（Pillow/numpy）を再利用する。

### 設計目標

- **モダン性**: 最新の技術スタックとベストプラクティスを採用
- **保守性**: クリーンアーキテクチャと明確な責務分離
- **パフォーマンス**: 非同期処理と最適化による高速レスポンス
- **ユーザビリティ**: 直感的で洗練されたUI/UX
- **スケーラビリティ**: 将来の機能拡張に対応可能な設計

## アーキテクチャ

### システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        ブラウザ                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         React + TypeScript フロントエンド              │  │
│  │  - Vite (ビルドツール)                                 │  │
│  │  - TanStack Query (データフェッチング)                 │  │
│  │  - Zustand (状態管理)                                  │  │
│  │  - Tailwind CSS + shadcn/ui (UIコンポーネント)        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI バックエンド                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  API Layer (FastAPI Routes)                          │  │
│  │  - /api/convert (POST) - 画像変換                     │  │
│  │  - /api/health (GET) - ヘルスチェック                 │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Service Layer                                        │  │
│  │  - ImageConversionService (変換ロジック)              │  │
│  │  - ValidationService (バリデーション)                 │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Core Layer (既存ロジック再利用)                      │  │
│  │  - IconConverter (logic.py)                          │  │
│  │  - Image utilities (utils.py)                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 技術スタック

#### バックエンド
- **FastAPI** (0.115+): 高速で現代的なWebフレームワーク
- **Pydantic** (2.0+): データバリデーションとシリアライゼーション
- **python-multipart**: ファイルアップロード処理
- **Pillow** (11.3+): 画像処理（既存）
- **numpy** (2.3+): 高速配列操作（既存）
- **loguru** (0.7+): 構造化ログ（既存）
- **uvicorn**: ASGIサーバー

#### フロントエンド
- **React** (18.3+): UIライブラリ
- **TypeScript** (5.6+): 型安全性
- **Vite** (6.0+): 高速ビルドツール
- **TanStack Query** (5.0+): サーバー状態管理とキャッシング
- **Zustand** (5.0+): クライアント状態管理
- **Tailwind CSS** (3.4+): ユーティリティファーストCSS
- **shadcn/ui**: 高品質UIコンポーネント
- **react-dropzone**: ドラッグ&ドロップファイルアップロード
- **axios**: HTTP クライアント

#### 開発・デプロイ
- **Docker** + **docker-compose**: コンテナ化
- **uv**: Pythonパッケージ管理
- **npm/pnpm**: Node.jsパッケージ管理
- **ruff**: Pythonリント・フォーマット
- **ESLint** + **Prettier**: TypeScriptリント・フォーマット

## コンポーネントとインターフェース

### バックエンドAPI仕様

#### POST /api/convert

画像をICOファイルに変換する

**リクエスト**:
```typescript
Content-Type: multipart/form-data

{
  file: File,                      // 画像ファイル
  preserve_transparency: boolean,  // 透明化保持
  auto_transparent_bg: boolean     // 自動背景透明化
}
```

**レスポンス（成功）**:
```typescript
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="output.ico"

<ICOファイルバイナリ>
```

**レスポンス（エラー）**:
```typescript
{
  detail: string  // エラーメッセージ
}
```

**ステータスコード**:
- 200: 成功
- 400: バリデーションエラー
- 413: ファイルサイズ超過
- 415: サポートされていないファイル形式
- 500: サーバーエラー

#### GET /api/health

ヘルスチェック

**レスポンス**:
```typescript
{
  status: "healthy",
  version: "2.0.0"
}
```

### フロントエンドコンポーネント構造

```
src/
├── components/
│   ├── ui/                      # shadcn/ui基本コンポーネント
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── progress.tsx
│   │   └── toast.tsx
│   ├── FileUploader.tsx         # ファイルアップロードエリア
│   ├── ImagePreview.tsx         # 画像プレビュー
│   ├── ConversionOptions.tsx    # 透明化オプション
│   ├── ConversionProgress.tsx   # 変換進行状況
│   └── ThemeToggle.tsx          # ダークモード切替
├── hooks/
│   ├── useImageConversion.ts    # 画像変換ロジック
│   └── useTheme.ts              # テーマ管理
├── stores/
│   └── imageStore.ts            # 画像状態管理（Zustand）
├── services/
│   └── api.ts                   # APIクライアント
├── types/
│   └── index.ts                 # TypeScript型定義
├── App.tsx                      # メインアプリケーション
└── main.tsx                     # エントリーポイント
```

### 主要コンポーネント設計

#### FileUploader
- ドラッグ&ドロップエリア
- ファイル選択ボタン
- ファイル形式・サイズバリデーション
- プレビュー表示トリガー

#### ImagePreview
- アップロードされた画像の表示
- 画像情報（サイズ、形式）の表示
- 削除ボタン

#### ConversionOptions
- 透明化保持チェックボックス
- 自動背景透明化チェックボックス
- 相互排他制御

#### ConversionProgress
- ローディングスピナー
- プログレスバー
- ステータスメッセージ

## データモデル

### バックエンドモデル（Pydantic）

```python
from pydantic import BaseModel, Field
from typing import Literal

class ConversionRequest(BaseModel):
    """変換リクエスト"""
    preserve_transparency: bool = Field(default=True)
    auto_transparent_bg: bool = Field(default=False)

class ConversionResponse(BaseModel):
    """変換レスポンス（メタデータ）"""
    filename: str
    size_bytes: int
    transparency_mode: Literal["preserve", "auto", "none"]

class HealthResponse(BaseModel):
    """ヘルスチェックレスポンス"""
    status: Literal["healthy", "unhealthy"]
    version: str

class ErrorResponse(BaseModel):
    """エラーレスポンス"""
    detail: str
    error_code: str | None = None
```

### フロントエンドモデル（TypeScript）

```typescript
// 画像ファイル情報
interface ImageFile {
  file: File;
  preview: string;  // Data URL
  name: string;
  size: number;
  type: string;
}

// 変換オプション
interface ConversionOptions {
  preserveTransparency: boolean;
  autoTransparentBg: boolean;
}

// 変換状態
type ConversionStatus = 'idle' | 'uploading' | 'converting' | 'success' | 'error';

// アプリケーション状態
interface AppState {
  image: ImageFile | null;
  options: ConversionOptions;
  status: ConversionStatus;
  error: string | null;
  setImage: (image: ImageFile | null) => void;
  setOptions: (options: ConversionOptions) => void;
  setStatus: (status: ConversionStatus) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}
```

## エラーハンドリング

### バックエンドエラー処理

```python
class ImageConversionError(Exception):
    """画像変換エラー基底クラス"""
    pass

class InvalidFileFormatError(ImageConversionError):
    """無効なファイル形式"""
    pass

class FileSizeExceededError(ImageConversionError):
    """ファイルサイズ超過"""
    pass

class ConversionFailedError(ImageConversionError):
    """変換処理失敗"""
    pass

# FastAPIエラーハンドラー
@app.exception_handler(InvalidFileFormatError)
async def invalid_format_handler(request, exc):
    return JSONResponse(
        status_code=415,
        content={"detail": str(exc), "error_code": "INVALID_FORMAT"}
    )

@app.exception_handler(FileSizeExceededError)
async def file_size_handler(request, exc):
    return JSONResponse(
        status_code=413,
        content={"detail": str(exc), "error_code": "FILE_TOO_LARGE"}
    )
```

### フロントエンドエラー処理

```typescript
// エラーメッセージマッピング
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_FORMAT: '対応していないファイル形式です',
  FILE_TOO_LARGE: 'ファイルサイズが大きすぎます（最大10MB）',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  SERVER_ERROR: 'サーバーエラーが発生しました',
};

// エラーハンドリング関数
function handleConversionError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const errorCode = error.response?.data?.error_code;
    return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.SERVER_ERROR;
  }
  return ERROR_MESSAGES.NETWORK_ERROR;
}
```

## テスト戦略

### バックエンドテスト

#### ユニットテスト
- `IconConverter`クラスのロジックテスト（既存）
- `ValidationService`のバリデーションテスト
- `ImageConversionService`の変換ロジックテスト

#### 統合テスト
- FastAPI エンドポイントテスト（TestClient使用）
- ファイルアップロード〜変換〜ダウンロードの完全フロー
- エラーケースのテスト

#### テストツール
- pytest
- pytest-asyncio（非同期テスト）
- httpx（APIクライアント）

### フロントエンドテスト

#### ユニットテスト
- カスタムフックのテスト
- ユーティリティ関数のテスト

#### コンポーネントテスト
- React Testing Library
- ユーザーインタラクションのテスト
- 状態変更のテスト

#### E2Eテスト
- Playwright
- ファイルアップロード〜変換〜ダウンロードの完全フロー
- クロスブラウザテスト

## セキュリティ設計

### ファイルアップロードセキュリティ

1. **ファイル形式検証**
   - MIMEタイプチェック
   - ファイル拡張子チェック
   - マジックバイト検証（Pillowによる実ファイル検証）

2. **ファイルサイズ制限**
   - FastAPIの`File`パラメータで10MB制限
   - フロントエンドでも事前チェック

3. **一時ファイル管理**
   - `tempfile`モジュールで安全な一時ファイル作成
   - 処理完了後の自動削除（try-finally）
   - ファイル名のサニタイズ

### CORS設定

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 開発環境
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
```

### レート制限

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/convert")
@limiter.limit("10/minute")  # 1分間に10リクエストまで
async def convert_image(...):
    ...
```

## パフォーマンス最適化

### バックエンド最適化

1. **非同期処理**
   - FastAPIの非同期エンドポイント
   - I/O処理の非同期化

2. **ストリーミングレスポンス**
   - `StreamingResponse`でメモリ効率向上
   - 大きなファイルの効率的な転送

3. **画像処理最適化**
   - numpy配列操作の最適化（既存）
   - Pillowの効率的な使用

### フロントエンド最適化

1. **コード分割**
   - React.lazy + Suspense
   - ルートベースの分割

2. **画像最適化**
   - プレビュー用のリサイズ
   - Data URLの効率的な管理

3. **キャッシング**
   - TanStack Queryのキャッシュ戦略
   - Service Workerによる静的アセットキャッシュ

4. **バンドル最適化**
   - Viteの自動最適化
   - Tree shaking
   - 圧縮（gzip/brotli）

## デプロイメント設計

### Docker構成

#### バックエンドDockerfile

```dockerfile
FROM python:3.13-slim

WORKDIR /app

# uvインストール
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# 依存関係インストール
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# アプリケーションコピー
COPY . .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### フロントエンドDockerfile

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - LOG_LEVEL=INFO
    command: uv run uvicorn backend.main:app --host 0.0.0.0 --reload

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: pnpm dev --host

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend
      - frontend
```

### 環境変数管理

#### バックエンド（.env）
```
LOG_LEVEL=INFO
MAX_FILE_SIZE=10485760  # 10MB
CORS_ORIGINS=http://localhost:5173
```

#### フロントエンド（.env）
```
VITE_API_URL=http://localhost:8000
VITE_MAX_FILE_SIZE=10485760
```

## 移行戦略

### フェーズ1: バックエンド基盤構築
1. FastAPIプロジェクトセットアップ
2. 既存ロジック（logic.py, utils.py）の統合
3. API エンドポイント実装
4. バックエンドテスト作成

### フェーズ2: フロントエンド基盤構築
1. Vite + React + TypeScriptプロジェクトセットアップ
2. UIコンポーネントライブラリ統合（shadcn/ui）
3. 基本レイアウトとルーティング
4. 状態管理セットアップ（Zustand）

### フェーズ3: コア機能実装
1. ファイルアップロード機能
2. 画像プレビュー機能
3. 変換オプションUI
4. API統合とデータフェッチング

### フェーズ4: UX向上
1. プログレス表示
2. エラーハンドリングとトースト通知
3. レスポンシブデザイン
4. ダークモード対応

### フェーズ5: 品質向上とデプロイ
1. テスト作成と実行
2. Docker化
3. パフォーマンス最適化
4. ドキュメント整備

## 設計上の決定事項

### なぜFastAPIか？
- 高速で現代的なPython Webフレームワーク
- 自動APIドキュメント生成（OpenAPI/Swagger）
- Pydanticによる型安全なバリデーション
- 非同期処理のネイティブサポート
- 既存のPythonコード（Pillow/numpy）を直接利用可能

### なぜReact + TypeScriptか？
- 業界標準のUIライブラリ
- TypeScriptによる型安全性と開発体験向上
- 豊富なエコシステムとコミュニティ
- コンポーネントベースの再利用可能な設計

### なぜViteか？
- 高速な開発サーバー起動とHMR
- モダンなビルドツール（Rollupベース）
- 優れた開発者体験
- React公式推奨

### なぜTailwind CSS + shadcn/uiか？
- ユーティリティファーストで高速開発
- shadcn/uiは高品質でカスタマイズ可能
- アクセシビリティ対応済み
- ダークモード対応が容易

### なぜTanStack Queryか？
- サーバー状態管理のデファクトスタンダード
- キャッシング、リトライ、バックグラウンド更新
- 優れた開発者体験とDevTools

### なぜZustandか？
- シンプルで軽量な状態管理
- Reduxより少ないボイラープレート
- TypeScript完全サポート
- React Contextより高パフォーマンス
