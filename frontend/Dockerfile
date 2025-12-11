# フロントエンドDockerfile - マルチステージビルド（React + Vite + nginx）

# ステージ1: ビルダー
FROM node:24.12.0-alpine AS builder

# 作業ディレクトリの設定
WORKDIR /app

# pnpmの有効化
RUN corepack enable && corepack prepare pnpm@latest --activate

# 依存関係ファイルのコピー
COPY package.json pnpm-lock.yaml ./

# 依存関係のインストール
RUN pnpm install --frozen-lockfile

# アプリケーションコードのコピー
COPY . .

# 本番ビルドの実行
RUN pnpm build

# ステージ2: 本番環境（nginx）
FROM nginx:alpine

# ビルド成果物をnginxの公開ディレクトリにコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# カスタムnginx設定ファイルのコピー（存在する場合）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ポート80を公開
EXPOSE 80

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# nginxをフォアグラウンドで起動
CMD ["nginx", "-g", "daemon off;"]
