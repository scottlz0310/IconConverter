# Docker環境セットアップガイド

このドキュメントでは、IconConverterアプリケーションのDocker環境のセットアップと使用方法について説明します。

## 前提条件

- Docker Engine 20.10以上
- Docker Compose 2.0以上

## クイックスタート

### 開発環境の起動

```bash
# リポジトリのルートディレクトリで実行
docker-compose up
```

これにより、以下のサービスが起動します：
- **バックエンド**: http://localhost:8000
- **フロントエンド**: http://localhost:5173

### 本番環境の起動

```bash
docker-compose -f docker-compose.prod.yml up -d
```

これにより、以下のサービスが起動します：
- **バックエンド**: http://localhost:8000
- **フロントエンド**: http://localhost:80

## サービス構成

### 開発環境（docker-compose.yml）

#### backend
- **ポート**: 8000
- **ホットリロード**: 有効
- **ボリュームマウント**: `./backend:/app`
- **コマンド**: `uv run uvicorn backend.main:app --reload`

#### frontend-dev
- **ポート**: 5173
- **ホットリロード**: 有効
- **ボリュームマウント**: `./frontend:/app`
- **コマンド**: `pnpm dev --host 0.0.0.0`

### 本番環境（docker-compose.prod.yml）

#### backend
- **ポート**: 8000
- **最適化**: 本番モード
- **再起動ポリシー**: unless-stopped

#### frontend
- **ポート**: 80
- **Webサーバー**: nginx
- **最適化**: マルチステージビルド

## よく使うコマンド

### コンテナの起動

```bash
# フォアグラウンドで起動
docker-compose up

# バックグラウンドで起動
docker-compose up -d

# 特定のサービスのみ起動
docker-compose up backend
```

### コンテナの停止

```bash
# 停止
docker-compose stop

# 停止して削除
docker-compose down

# ボリュームも削除
docker-compose down -v
```

### ログの確認

```bash
# 全サービスのログ
docker-compose logs

# 特定のサービスのログ
docker-compose logs backend

# リアルタイムでログを追跡
docker-compose logs -f
```

### コンテナ内でコマンド実行

```bash
# バックエンドでシェルを起動
docker-compose exec backend sh

# フロントエンドでシェルを起動
docker-compose exec frontend-dev sh

# バックエンドでテスト実行
docker-compose exec backend uv run pytest

# フロントエンドでリント実行
docker-compose exec frontend-dev pnpm lint
```

### イメージの再ビルド

```bash
# 全サービスを再ビルド
docker-compose build

# キャッシュを使わずに再ビルド
docker-compose build --no-cache

# 特定のサービスのみ再ビルド
docker-compose build backend
```

## 環境変数の設定

### バックエンド

`.env`ファイルを`backend/`ディレクトリに作成：

```bash
cp backend/.env.example backend/.env
```

編集可能な環境変数：
- `LOG_LEVEL`: ログレベル（DEBUG, INFO, WARNING, ERROR）
- `MAX_FILE_SIZE`: 最大ファイルサイズ（バイト）
- `CORS_ORIGINS`: CORS許可オリジン

### フロントエンド

`.env`ファイルを`frontend/`ディレクトリに作成：

```bash
cp frontend/.env.example frontend/.env
```

編集可能な環境変数：
- `VITE_API_URL`: バックエンドAPIのURL
- `VITE_MAX_FILE_SIZE`: 最大ファイルサイズ（バイト）

## トラブルシューティング

### ポートが既に使用されている

```bash
# 使用中のポートを確認
sudo lsof -i :8000
sudo lsof -i :5173

# docker-compose.ymlのポートマッピングを変更
ports:
  - "8001:8000"  # 8000の代わりに8001を使用
```

### ボリュームマウントの問題

```bash
# ボリュームを削除して再作成
docker-compose down -v
docker-compose up
```

### イメージのキャッシュ問題

```bash
# キャッシュを使わずに再ビルド
docker-compose build --no-cache
docker-compose up
```

### 依存関係の更新

```bash
# バックエンド
docker-compose exec backend uv sync

# フロントエンド
docker-compose exec frontend-dev pnpm install
```

## パフォーマンス最適化

### 開発環境

- ボリュームマウントを使用してホットリロードを有効化
- node_modulesと.venvはコンテナ内のものを使用（除外マウント）

### 本番環境

- マルチステージビルドで最小限のイメージサイズ
- nginxで静的ファイルを効率的に配信
- gzip圧縮とキャッシュヘッダーの設定

## セキュリティ

- 本番環境では`.env`ファイルを適切に管理
- CORS設定を本番環境に合わせて調整
- ヘルスチェックを有効化してコンテナの状態を監視

## 参考リンク

- [Docker公式ドキュメント](https://docs.docker.com/)
- [Docker Compose公式ドキュメント](https://docs.docker.com/compose/)
- [FastAPI Dockerデプロイ](https://fastapi.tiangolo.com/deployment/docker/)
- [Vite本番環境ビルド](https://vitejs.dev/guide/build.html)
