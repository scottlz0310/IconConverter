.PHONY: bootstrap lint format typecheck test cov security build clean

bootstrap:
	uv venv --python 3.13
	uv sync
	uv run pre-commit install

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

build:
	uv build

clean:
	rm -rf .venv .cache .pytest_cache .ruff_cache .mypy_cache dist build htmlcov .coverage coverage.xml
