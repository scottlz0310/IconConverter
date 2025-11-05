.PHONY: bootstrap bootstrap-backend bootstrap-frontend bootstrap-full lint format typecheck test cov security build clean dev up down logs restart ps prod prod-down backend-test frontend-test test-all backend-lint frontend-lint lint-all backend-format frontend-format format-all help

# Bootstrap コマンド
bootstrap: bootstrap-backend
	@echo "✓ Backend development environment setup complete"

bootstrap-backend:
	uv venv --python 3.13
	uv sync
	uv run pre-commit install

bootstrap-frontend:
	cd frontend && pnpm install

bootstrap-full: bootstrap-backend bootstrap-frontend
	@echo ""
	@echo "✓ Full development environment setup complete (backend + frontend)"

lint:
	uv run ruff check .

format:
	uv run ruff format .

typecheck:
	uv run mypy .

test:
	uv run pytest -q

cov:
	uv run pytest --cov=icon_converter --cov-report=term-missing

security:
	echo "Run security scans in CI"

# WebUI開発コマンド

# 開発環境起動（docker-compose）
dev:
	docker-compose up

# 開発環境起動（バックグラウンド）
up:
	docker-compose up -d

# 開発環境停止・削除
down:
	docker-compose down

# コンテナログ表示
logs:
	docker-compose logs -f

# コンテナ再起動
restart:
	docker-compose restart

# コンテナ状態確認
ps:
	docker-compose ps

# 本番ビルド
build:
	docker-compose -f docker-compose.prod.yml build

# 本番環境起動
prod:
	docker-compose -f docker-compose.prod.yml up

# 本番環境停止・削除
prod-down:
	docker-compose -f docker-compose.prod.yml down

# バックエンドテスト実行
backend-test:
	cd backend && uv run pytest

# フロントエンドテスト実行
frontend-test:
	cd frontend && pnpm test --run

# 全テスト実行
test-all: backend-test frontend-test

# バックエンドリント
backend-lint:
	cd backend && uv run ruff check .

# フロントエンドリント
frontend-lint:
	cd frontend && pnpm lint

# 全リント実行
lint-all: backend-lint frontend-lint

# バックエンドフォーマット
backend-format:
	cd backend && uv run ruff format .

# フロントエンドフォーマット
frontend-format:
	cd frontend && pnpm format

# 全フォーマット実行
format-all: backend-format frontend-format

# クリーンアップ
clean:
	rm -rf .venv .cache .pytest_cache .ruff_cache .mypy_cache dist build htmlcov .coverage coverage.xml
	docker-compose down -v
	cd backend && rm -rf .venv .pytest_cache .ruff_cache .mypy_cache
	cd frontend && rm -rf node_modules dist .vite

# ヘルプ表示
help:
	@echo "Bootstrap コマンド:"
	@echo "  make bootstrap          - バックエンド開発環境セットアップ"
	@echo "  make bootstrap-backend  - バックエンドのみセットアップ"
	@echo "  make bootstrap-frontend - フロントエンドのみセットアップ"
	@echo "  make bootstrap-full     - フロント + バック両方セットアップ"
	@echo ""
	@echo "WebUI開発コマンド:"
	@echo "  make dev           - 開発環境起動（フォアグラウンド）"
	@echo "  make up            - 開発環境起動（バックグラウンド）"
	@echo "  make down          - 開発環境停止・削除"
	@echo "  make logs          - コンテナログ表示"
	@echo "  make restart       - コンテナ再起動"
	@echo "  make ps            - コンテナ状態確認"
	@echo "  make build         - 本番ビルド"
	@echo "  make prod          - 本番環境起動"
	@echo "  make prod-down     - 本番環境停止・削除"
	@echo ""
	@echo "テストコマンド:"
	@echo "  make backend-test  - バックエンドテスト実行"
	@echo "  make frontend-test - フロントエンドテスト実行"
	@echo "  make test-all      - 全テスト実行"
	@echo ""
	@echo "リント・フォーマット:"
	@echo "  make backend-lint  - バックエンドリント"
	@echo "  make frontend-lint - フロントエンドリント"
	@echo "  make lint-all      - 全リント実行"
	@echo "  make backend-format - バックエンドフォーマット"
	@echo "  make frontend-format - フロントエンドフォーマット"
	@echo "  make format-all    - 全フォーマット実行"
	@echo ""
	@echo "その他:"
	@echo "  make clean         - クリーンアップ"
	@echo "  make help          - このヘルプを表示"
