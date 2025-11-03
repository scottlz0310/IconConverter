# テストディレクトリ

このディレクトリは、将来的な統合テストやE2Eテスト用に予約されています。

## テスト構成

- **バックエンドテスト**: `backend/tests/`
  - ユニットテスト（ValidationService, ImageConversionService）
  - APIエンドポイントテスト

- **フロントエンドテスト**: `frontend/tests/`
  - コンポーネントテスト（React Testing Library）
  - E2Eテスト（Playwright）

- **レガシーテスト**: `tests-legacy/`
  - 旧Tkinter実装用のテスト

## 実行方法

```bash
# バックエンドテスト
cd backend
uv run pytest

# フロントエンドテスト
cd frontend
pnpm test

# E2Eテスト
cd frontend
pnpm test:e2e
```
