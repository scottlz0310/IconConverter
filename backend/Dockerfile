# バックエンドDockerfile - FastAPI + uv
FROM python:3.14-slim

# 作業ディレクトリの設定
WORKDIR /app

# システムパッケージの更新と必要なツールのインストール
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# uvのインストール
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# 依存関係ファイルのコピー（README.mdも必要）
COPY pyproject.toml uv.lock* README.md ./

# 依存関係のインストール（本番環境用、開発依存関係は除外）
RUN uv sync --frozen --no-dev

# アプリケーションコードをコピー
COPY . .

# ポート8000を公開
EXPOSE 8000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# uvicornでアプリケーションを起動（/appがカレントディレクトリ）
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
