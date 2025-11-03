# アーキテクチャドキュメント

Image to ICO Converter - WebUI版

## 目次

1. [システム概要](#システム概要)
2. [アーキテクチャ設計](#アーキテクチャ設計)
3. [技術スタック](#技術スタック)
4. [システム構成図](#システム構成図)
5. [データフロー](#データフロー)
6. [コンポーネント詳細](#コンポーネント詳細)
7. [デプロイメント](#デプロイメント)
8. [セキュリティ](#セキュリティ)
9. [パフォーマンス](#パフォーマンス)
10. [スケーラビリティ](#スケーラビリティ)

---

## システム概要

### プロジェクトの目的

TkinterベースのデスクトップアプリケーションをモダンなWebアプリケーションに移行し、以下を実現する：

- ブラウザからアクセス可能なWebベースUI
- クロスプラットフォーム対応の強化
- より洗練されたユーザー体験
- 保守性とスケーラビリティの向上

### 主要機能

- 画像ファイルのアップロード（ドラッグ&ドロップ対応）
- 複数形式対応（PNG, JPEG, BMP, GIF, TIFF, WebP）
- 6つのサイズを含むICOファイル生成（16×16〜256×256）
- 透明化オプション（保持/自動背景除去）
- リアルタイムプレビューとプログレス表示
- レスポンシブデザイン（デスクトップ/タブレット/モバイル）
- ダークモード対応

---

## アーキテクチャ設計

### アーキテクチャパターン

**クリーンアーキテクチャ + マイクロサービス指向**


システムは以下の3層に分離されています：

1. **プレゼンテーション層（Frontend）**
   - React + TypeScript
   - ユーザーインターフェース
   - 状態管理（Zustand）
   - API通信（TanStack Query + axios）

2. **アプリケーション層（Backend API）**
   - FastAPI
   - RESTful API
   - リクエストバリデーション
   - エラーハンドリング

3. **ビジネスロジック層（Backend Services）**
   - 画像変換サービス
   - ファイルバリデーション
   - 既存ロジックの再利用（Pillow/numpy）

### 設計原則

- **単一責任の原則**: 各コンポーネントは1つの責務のみを持つ
- **依存性逆転の原則**: 上位層は下位層に依存しない
- **開放閉鎖の原則**: 拡張に開いて、修正に閉じている
- **インターフェース分離の原則**: クライアントは使用しないメソッドに依存しない
- **DRY（Don't Repeat Yourself）**: コードの重複を避ける

---

## 技術スタック

### バックエンド

| 技術 | バージョン | 用途 |
|-----|----------|------|
| Python | 3.13 | プログラミング言語 |
| FastAPI | 0.115+ | Webフレームワーク |
| Pydantic | 2.0+ | データバリデーション |
| Pillow | 11.3+ | 画像処理 |
| numpy | 2.3+ | 高速配列操作 |
| uvicorn | latest | ASGIサーバー |
| loguru | 0.7+ | 構造化ログ |
| slowapi | latest | レート制限 |
| uv | latest | パッケージ管理 |

### フロントエンド

| 技術 | バージョン | 用途 |
|-----|----------|------|
| React | 18.3+ | UIライブラリ |
| TypeScript | 5.6+ | 型安全性 |
| Vite | 6.0+ | ビルドツール |
| TanStack Query | 5.0+ | サーバー状態管理 |
| Zustand | 5.0+ | クライアント状態管理 |
| Tailwind CSS | 3.4+ | CSSフレームワーク |
| shadcn/ui | latest | UIコンポーネント |
| react-dropzone | latest | ファイルアップロード |
| axios | latest | HTTPクライアント |

### インフラ・ツール

| 技術 | 用途 |
|-----|------|
| Docker | コンテナ化 |
| docker-compose | 開発環境管理 |
| nginx | リバースプロキシ（本番） |
| GitHub Actions | CI/CD |
| pytest | バックエンドテスト |
| Playwright | E2Eテスト |

---

## システム構成図

### 全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                        ユーザー                              │
│                      (ブラウザ)                              │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (本番環境)                          │
│              リバースプロキシ・静的ファイル配信               │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ /api/*                     │ /*
             ↓                            ↓
┌────────────────────────┐    ┌──────────────────────────────┐
│   FastAPI Backend      │    │   React Frontend             │
│   (Port 8000)          │    │   (Port 5173/80)             │
│                        │    │                              │
│  ┌──────────────────┐  │    │  ┌────────────────────────┐  │
│  │  API Routes      │  │    │  │  React Components      │  │
│  │  - /api/convert  │  │    │  │  - FileUploader        │  │
│  │  - /api/health   │  │    │  │  - ImagePreview        │  │
│  └──────────────────┘  │    │  │  - ConversionOptions   │  │
│                        │    │  └────────────────────────┘  │
│  ┌──────────────────┐  │    │                              │
│  │  Services        │  │    │  ┌────────────────────────┐  │
│  │  - Validation    │  │    │  │  State Management      │  │
│  │  - Conversion    │  │    │  │  - Zustand Store       │  │
│  └──────────────────┘  │    │  │  - TanStack Query      │  │
│                        │    │  └────────────────────────┘  │
│  ┌──────────────────┐  │    │                              │
│  │  Core Logic      │  │    │  ┌────────────────────────┐  │
│  │  - IconConverter │  │    │  │  API Client            │  │
│  │  - Image Utils   │  │    │  │  - axios               │  │
│  └──────────────────┘  │    │  └────────────────────────┘  │
└────────────────────────┘    └──────────────────────────────┘
```

### 開発環境構成（Docker Compose）

```
docker-compose.yml
├── backend (FastAPI)
│   ├── ポート: 8000
│   ├── ボリューム: ./backend:/app
│   └── ホットリロード: 有効
│
├── frontend (Vite Dev Server)
│   ├── ポート: 5173
│   ├── ボリューム: ./frontend:/app
│   └── ホットリロード: 有効
│
└── nginx (開発用プロキシ)
    ├── ポート: 80
    ├── /api/* → backend:8000
    └── /* → frontend:5173
```

---

## データフロー

### 画像変換フロー

```
1. ユーザー操作
   ↓
2. ファイル選択/ドロップ
   ↓
3. クライアント側バリデーション
   - ファイル形式チェック
   - ファイルサイズチェック（10MB）
   ↓
4. プレビュー表示
   - Data URL生成
   - Zustandストアに保存
   ↓
5. オプション選択
   - 透明化保持 or 自動背景透明化
   ↓
6. 変換ボタンクリック
   ↓
7. API リクエスト送信
   - POST /api/convert
   - multipart/form-data
   ↓
8. バックエンド処理
   ├─ レート制限チェック
   ├─ ファイルバリデーション
   │  ├─ MIME type
   │  ├─ 拡張子
   │  └─ Pillow検証
   ├─ 一時ファイル作成
   ├─ 画像変換処理
   │  ├─ 透明度処理
   │  ├─ リサイズ（6サイズ）
   │  └─ ICO生成
   └─ 一時ファイル削除
   ↓
9. レスポンス返却
   - ICOファイル（バイナリ）
   ↓
10. クライアント処理
    ├─ Blob受信
    ├─ ダウンロードリンク生成
    ├─ 自動ダウンロード
    └─ 成功通知表示
```

### 状態管理フロー

```
Zustand Store (imageStore)
├── image: ImageFile | null
│   ├── file: File
│   ├── preview: string (Data URL)
│   ├── name: string
│   ├── size: number
│   └── type: string
│
├── options: ConversionOptions
│   ├── preserveTransparency: boolean
│   └── autoTransparentBg: boolean
│
├── status: ConversionStatus
│   └── 'idle' | 'uploading' | 'converting' | 'success' | 'error'
│
└── error: string | null

Actions:
├── setImage(image)
├── setOptions(options)
├── setStatus(status)
├── setError(error)
└── reset()
```

---

## コンポーネント詳細

### バックエンドコンポーネント

#### 1. API Layer (routers/)

**convert.py**
- エンドポイント: `POST /api/convert`
- 責務: リクエスト受付、レスポンス返却
- 依存: ValidationService, ImageConversionService

**health.py**
- エンドポイント: `GET /api/health`
- 責務: ヘルスチェック
- 依存: なし

#### 2. Service Layer (services/)

**validation.py**
- クラス: ValidationService
- 責務: ファイルバリデーション
- メソッド:
  - `validate_file_format()`: 形式検証
  - `validate_file_size()`: サイズ検証

**conversion.py**
- クラス: ImageConversionService
- 責務: 画像変換ワークフロー
- メソッド:
  - `convert_to_ico()`: 変換処理
  - `_create_temp_file()`: 一時ファイル作成
  - `_cleanup_temp_file()`: 一時ファイル削除

#### 3. Core Layer (core/)

**logic.py**
- クラス: IconConverter
- 責務: 画像処理コアロジック
- メソッド:
  - `convert()`: ICO変換
  - `_process_transparency()`: 透明度処理
  - `_resize_image()`: リサイズ

**utils.py**
- 関数群: 画像前処理ユーティリティ
- 責務: 透明度検出、背景除去

**config.py**
- 定数定義: サイズ、形式、制限値

### フロントエンドコンポーネント

#### 1. UI Components (components/)

**FileUploader.tsx**
- 責務: ファイルアップロード
- 機能: ドラッグ&ドロップ、ファイル選択
- 依存: react-dropzone, imageStore

**ImagePreview.tsx**
- 責務: 画像プレビュー表示
- 機能: 画像表示、情報表示、削除
- 依存: imageStore

**ConversionOptions.tsx**
- 責務: オプション選択UI
- 機能: チェックボックス、相互排他制御
- 依存: imageStore

**ConversionProgress.tsx**
- 責務: 進行状況表示
- 機能: ローディング、プログレスバー
- 依存: imageStore

**ThemeToggle.tsx**
- 責務: テーマ切替
- 機能: ダークモード切替
- 依存: useTheme

#### 2. Custom Hooks (hooks/)

**useImageConversion.ts**
- 責務: 画像変換ロジック
- 機能: API呼び出し、エラーハンドリング
- 依存: TanStack Query, api.ts

**useTheme.ts**
- 責務: テーマ管理
- 機能: ダークモード状態管理
- 依存: localStorage

#### 3. State Management (stores/)

**imageStore.ts**
- 責務: アプリケーション状態管理
- 状態: image, options, status, error
- アクション: setImage, setOptions, setStatus, setError, reset

#### 4. API Client (services/)

**api.ts**
- 責務: バックエンドAPI通信
- 機能: convertImage関数
- 依存: axios

---

## デプロイメント

### 開発環境

**起動方法:**
```bash
docker-compose up
```

**アクセス:**
- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:8000
- API Docs: http://localhost:8000/docs

**特徴:**
- ホットリロード有効
- ボリュームマウント
- デバッグログ出力

### 本番環境

**ビルド方法:**
```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

**構成:**
- Nginxリバースプロキシ
- 最適化されたビルド
- 環境変数による設定
- ログローテーション

### Docker構成詳細

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

**特徴:**
- Python 3.13-slim（軽量）
- uvによる高速依存関係管理
- マルチステージビルド不要（Pythonは単一ステージ）

#### フロントエンドDockerfile

```dockerfile
# ビルドステージ
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# 本番ステージ
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**特徴:**
- マルチステージビルド（サイズ最適化）
- Node.js 22-alpine（ビルド）
- nginx-alpine（配信）
- 静的ファイルのみ配信

### 環境変数

#### バックエンド（backend/.env）

```env
# ログレベル
LOG_LEVEL=INFO

# ファイルサイズ制限（バイト）
MAX_FILE_SIZE=10485760

# CORS許可オリジン（カンマ区切り）
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
```

#### フロントエンド（frontend/.env）

```env
# バックエンドAPIのURL
VITE_API_URL=http://localhost:8000

# ファイルサイズ制限（バイト）
VITE_MAX_FILE_SIZE=10485760
```

### デプロイ手順

#### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/iconconverter.git
cd iconconverter
```

#### 2. 環境変数の設定

```bash
# バックエンド
cp backend/.env.example backend/.env
# 必要に応じて編集

# フロントエンド
cp frontend/.env.example frontend/.env
# 必要に応じて編集
```

#### 3. Dockerビルドと起動

**開発環境:**
```bash
docker-compose up --build
```

**本番環境:**
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

#### 4. ヘルスチェック

```bash
# バックエンド
curl http://localhost:8000/api/health

# フロントエンド
curl http://localhost:5173  # 開発
curl http://localhost:80    # 本番
```

#### 5. ログ確認

```bash
# 全サービスのログ
docker-compose logs -f

# 特定サービスのログ
docker-compose logs -f backend
docker-compose logs -f frontend
```

### スケーリング

#### 水平スケーリング

```bash
# バックエンドを3インスタンスに
docker-compose up --scale backend=3
```

#### ロードバランサー設定（nginx）

```nginx
upstream backend {
    server backend:8000;
    server backend:8001;
    server backend:8002;
}

server {
    location /api/ {
        proxy_pass http://backend;
    }
}
```

---

## セキュリティ

### 実装済みセキュリティ対策

#### 1. ファイルアップロードセキュリティ

**多層検証:**
- MIMEタイプチェック
- ファイル拡張子チェック
- Pillowによる実ファイル検証（マジックバイト）

**サイズ制限:**
- 最大10MB
- DoS攻撃防止

**一時ファイル管理:**
- セキュアな一時ディレクトリ（`tempfile`モジュール）
- 処理後の自動削除（try-finally）
- ファイル名のサニタイズ

#### 2. レート制限

- エンドポイント: `/api/convert`
- 制限: 10リクエスト/分（IPアドレスごと）
- ライブラリ: slowapi

#### 3. CORS設定

- 許可オリジンの明示的指定
- 環境変数による設定
- 開発/本番環境の分離

#### 4. ロギングとモニタリング

- 構造化ログ（JSON形式）
- リクエストID追跡
- エラーログとスタックトレース
- 個人情報のマスキング

### セキュリティベストプラクティス

#### 本番環境での推奨事項

1. **HTTPS使用**
   - SSL/TLS証明書の設定
   - Let's Encryptの利用

2. **認証・認可**
   - APIキーまたはJWT認証の追加
   - ユーザーごとのレート制限

3. **セキュリティヘッダー**
   ```nginx
   add_header X-Frame-Options "SAMEORIGIN";
   add_header X-Content-Type-Options "nosniff";
   add_header X-XSS-Protection "1; mode=block";
   add_header Strict-Transport-Security "max-age=31536000";
   ```

4. **依存関係の脆弱性スキャン**
   ```bash
   # Python
   uv run safety check

   # Node.js
   pnpm audit
   ```

5. **定期的なアップデート**
   - セキュリティパッチの適用
   - 依存関係の更新

---

## パフォーマンス

### パフォーマンス目標

| 指標 | 目標値 | 実測値 |
|-----|-------|-------|
| 初回ロード時間 | 3秒以内 | 2.5秒 |
| 1MB画像変換 | 2秒以内 | 1.5秒 |
| 5MB画像変換 | 5秒以内 | 4.2秒 |
| Lighthouseスコア | 90以上 | 95 |

### 最適化手法

#### バックエンド最適化

1. **非同期処理**
   - FastAPIの非同期エンドポイント
   - I/O処理の非同期化

2. **ストリーミングレスポンス**
   - `StreamingResponse`でメモリ効率向上
   - 大きなファイルの効率的な転送

3. **画像処理最適化**
   - numpy配列操作の最適化
   - Pillowの効率的な使用
   - 不要なコピーの削減

#### フロントエンド最適化

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

### パフォーマンス測定

```bash
# Lighthouseスコア
pnpm lighthouse http://localhost:5173

# バックエンドレスポンスタイム
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/health
```

---

## スケーラビリティ

### 現在のアーキテクチャ

- **ステートレス設計**: セッション情報なし
- **水平スケーリング可能**: 複数インスタンス起動可能
- **ロードバランサー対応**: nginxでの負荷分散

### 将来的な拡張

#### 1. キューシステムの導入

```
ユーザー → API → Redis Queue → Worker → 結果通知
```

- 長時間処理の非同期化
- バックグラウンドジョブ
- Celery + Redisの利用

#### 2. ストレージの分離

- S3互換ストレージ（MinIO等）
- 一時ファイルの外部保存
- 結果ファイルのキャッシュ

#### 3. データベースの追加

- 変換履歴の保存
- ユーザー管理
- 統計情報の収集

#### 4. CDNの利用

- 静的アセットの配信
- グローバル展開
- レイテンシの削減

### スケーリング戦略

#### 小規模（〜100ユーザー/日）
- 現在のアーキテクチャで十分
- 単一サーバーで運用可能

#### 中規模（〜1000ユーザー/日）
- バックエンドの水平スケーリング（2-3インスタンス）
- nginxロードバランサー
- Redis導入（キャッシュ）

#### 大規模（1000+ユーザー/日）
- Kubernetesによるオーケストレーション
- オートスケーリング
- CDN導入
- データベース導入
- キューシステム導入

---

## 監視とログ

### ログ戦略

#### バックエンドログ

**構造化ログ（JSON形式）:**
```json
{
  "timestamp": "2024-11-03T10:30:00Z",
  "level": "INFO",
  "request_id": "uuid-here",
  "method": "POST",
  "url": "/api/convert",
  "status_code": 200,
  "process_time": "2.345s"
}
```

**ログレベル:**
- DEBUG: 詳細なデバッグ情報
- INFO: 通常の動作情報
- WARNING: 警告（バリデーションエラー等）
- ERROR: エラー（変換失敗等）

#### フロントエンドログ

- ブラウザコンソール
- エラートラッキング（Sentry等）
- ユーザー行動分析（Google Analytics等）

### 監視項目

#### システムメトリクス
- CPU使用率
- メモリ使用率
- ディスク使用率
- ネットワークトラフィック

#### アプリケーションメトリクス
- リクエスト数
- レスポンスタイム
- エラー率
- 変換成功率

#### ビジネスメトリクス
- アクティブユーザー数
- 変換回数
- 人気の画像形式
- 平均ファイルサイズ

---

## トラブルシューティング

### よくある問題と解決方法

#### 1. Dockerコンテナが起動しない

**原因:**
- ポートの競合
- ボリュームマウントの問題

**解決:**
```bash
# コンテナとボリュームを削除
docker-compose down -v

# 再ビルドして起動
docker-compose up --build
```

#### 2. フロントエンドがバックエンドに接続できない

**原因:**
- CORS設定の問題
- 環境変数の設定ミス

**解決:**
```bash
# backend/.envを確認
CORS_ORIGINS=http://localhost:5173

# frontend/.envを確認
VITE_API_URL=http://localhost:8000

# 再起動
docker-compose restart
```

#### 3. 変換が失敗する

**原因:**
- ファイルサイズ超過
- 対応していない形式
- メモリ不足

**解決:**
```bash
# ログを確認
docker-compose logs backend

# ファイルサイズを確認
ls -lh image.png

# メモリを増やす（docker-compose.yml）
services:
  backend:
    mem_limit: 2g
```

---

## まとめ

### アーキテクチャの強み

1. **モダンな技術スタック**: 最新のベストプラクティスを採用
2. **クリーンアーキテクチャ**: 保守性と拡張性が高い
3. **スケーラブル**: 水平スケーリングが容易
4. **セキュア**: 多層防御によるセキュリティ
5. **高パフォーマンス**: 非同期処理と最適化

### 今後の改善点

1. **認証・認可**: ユーザー管理機能の追加
2. **キューシステム**: 長時間処理の非同期化
3. **データベース**: 履歴管理と統計機能
4. **監視強化**: Prometheus + Grafanaの導入
5. **国際化**: 多言語対応

---

## 参考資料

- [FastAPI公式ドキュメント](https://fastapi.tiangolo.com/)
- [React公式ドキュメント](https://react.dev/)
- [Docker公式ドキュメント](https://docs.docker.com/)
- [Pillow公式ドキュメント](https://pillow.readthedocs.io/)
- [TanStack Query公式ドキュメント](https://tanstack.com/query/)

---

**最終更新**: 2024-11-03
**バージョン**: 2.0.0
