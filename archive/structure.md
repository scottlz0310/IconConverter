---
inclusion: always
---

# プロジェクト構造

## ディレクトリレイアウト

```
iconconverter/
├── .amazonq/rules/          # Amazon Q AI開発ルール
├── .github/                 # GitHubワークフローとCI設定
├── .kiro/
│   ├── specs/              # 機能仕様書
│   │   └── webui-migration/ # WebUI移行spec
│   └── steering/           # Kiro AIステアリングルール
├── backend/                 # FastAPIバックエンド
│   ├── core/               # 既存ロジック（iconconverter）
│   │   ├── __init__.py
│   │   ├── config.py      # 定数と設定
│   │   ├── logic.py       # IconConverterクラス
│   │   └── utils.py       # 画像前処理ユーティリティ
│   ├── services/           # ビジネスロジック層
│   │   ├── validation.py  # ファイルバリデーション
│   │   └── conversion.py  # 画像変換サービス
│   ├── routers/            # APIエンドポイント
│   │   ├── convert.py     # /api/convert
│   │   └── health.py      # /api/health
│   ├── models.py           # Pydanticモデル
│   ├── exceptions.py       # カスタム例外
│   ├── main.py             # FastAPIアプリケーション
│   ├── pyproject.toml      # バックエンド依存関係
│   ├── uv.lock             # ロックファイル
│   ├── Dockerfile          # バックエンドDockerfile
│   └── tests/              # バックエンドテスト
├── frontend/                # React + TypeScriptフロントエンド
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   │   ├── ui/        # shadcn/ui基本コンポーネント
│   │   │   ├── FileUploader.tsx
│   │   │   ├── ImagePreview.tsx
│   │   │   ├── ConversionOptions.tsx
│   │   │   ├── ConversionProgress.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── Layout.tsx
│   │   ├── hooks/          # カスタムフック
│   │   │   ├── useImageConversion.ts
│   │   │   └── useTheme.ts
│   │   ├── stores/         # Zustand状態管理
│   │   │   └── imageStore.ts
│   │   ├── services/       # APIクライアント
│   │   │   └── api.ts
│   │   ├── types/          # TypeScript型定義
│   │   │   └── index.ts
│   │   ├── App.tsx         # メインアプリケーション
│   │   └── main.tsx        # エントリーポイント
│   ├── package.json        # フロントエンド依存関係
│   ├── pnpm-lock.yaml      # ロックファイル
│   ├── vite.config.ts      # Vite設定
│   ├── tailwind.config.js  # Tailwind CSS設定
│   ├── tsconfig.json       # TypeScript設定
│   ├── Dockerfile          # フロントエンドDockerfile
│   └── tests/              # フロントエンドテスト
├── docs/                    # 追加ドキュメント
├── docker-compose.yml       # 開発環境Docker設定
├── Makefile                 # 開発コマンド
└── README.md                # ユーザードキュメント（日本語）
```

## モジュール構成

### バックエンド構造

#### core/ - 既存ロジック再利用
- **config.py**: 定数と設定（アイコンサイズ、サポート形式等）
- **logic.py**: `IconConverter`クラス（画像変換コアロジック）
- **utils.py**: 画像前処理、透明度サポート検出、ロガーセットアップ

#### services/ - ビジネスロジック層
- **validation.py**: ファイル形式・サイズバリデーション
- **conversion.py**: `ImageConversionService`（変換ワークフロー、一時ファイル管理）

#### routers/ - API層
- **convert.py**: POST /api/convert（画像変換エンドポイント）
- **health.py**: GET /api/health（ヘルスチェック）

#### その他
- **models.py**: Pydanticモデル（リクエスト/レスポンス）
- **exceptions.py**: カスタム例外クラス
- **main.py**: FastAPIアプリケーション、CORS、ミドルウェア設定

### フロントエンド構造

#### components/ - UIコンポーネント
- **ui/**: shadcn/ui基本コンポーネント（Button, Card, Checkbox等）
- **FileUploader**: ドラッグ&ドロップ、ファイル選択
- **ImagePreview**: 画像プレビュー表示
- **ConversionOptions**: 透明化オプション選択
- **ConversionProgress**: ローディング、プログレスバー
- **ThemeToggle**: ダークモード切替
- **Layout**: 全体レイアウト

#### hooks/ - カスタムフック
- **useImageConversion**: 画像変換ロジック（TanStack Query使用）
- **useTheme**: テーマ管理

#### stores/ - 状態管理
- **imageStore**: Zustandストア（画像、オプション、ステータス、エラー）

#### services/ - API通信
- **api.ts**: axiosクライアント、convertImage関数

#### types/ - 型定義
- **index.ts**: TypeScript型定義（ImageFile, ConversionOptions等）

## アーキテクチャパターン

### クリーンアーキテクチャ
- **API層**: FastAPIルーター（HTTPリクエスト/レスポンス）
- **サービス層**: ビジネスロジック（バリデーション、変換）
- **コア層**: 既存の画像処理ロジック（Pillow/numpy）

### 責務分離
- バックエンド: API、バリデーション、変換処理、ログ
- フロントエンド: UI、状態管理、API通信、ユーザー体験

### 非同期処理
- FastAPIの非同期エンドポイント
- TanStack Queryによる非同期データフェッチング
- ノンブロッキングUI

### エラーハンドリング
- バックエンド: カスタム例外 → HTTPエラーレスポンス
- フロントエンド: axiosエラー → トースト通知

## ファイル命名規則

### バックエンド（Python）
- **モジュール**: アンダースコア付き小文字（`validation.py`, `conversion.py`）
- **クラス**: パスカルケース（`ImageConversionService`, `ConversionRequest`）
- **関数/メソッド**: スネークケース（`validate_file_format`, `convert_image`）
- **プライベート**: 先頭アンダースコア（`_cleanup_temp_files`）
- **定数**: 大文字スネークケース（`MAX_FILE_SIZE`, `ALLOWED_FORMATS`）

### フロントエンド（TypeScript/React）
- **コンポーネント**: パスカルケース（`FileUploader.tsx`, `ImagePreview.tsx`）
- **フック**: キャメルケース、use接頭辞（`useImageConversion.ts`）
- **ストア**: キャメルケース（`imageStore.ts`）
- **型**: パスカルケース（`ImageFile`, `ConversionOptions`）
- **関数**: キャメルケース（`convertImage`, `handleUpload`）
- **定数**: 大文字スネークケース（`MAX_FILE_SIZE`, `API_BASE_URL`）

## テスト構造

### バックエンドテスト
- **ユニットテスト**: `tests/test_validation.py`, `tests/test_conversion.py`
- **統合テスト**: `tests/test_api.py`（FastAPI TestClient使用）
- **既存テスト**: `tests/test_logic.py`（IconConverterクラス）

### フロントエンドテスト
- **コンポーネントテスト**: `tests/components/`（React Testing Library）
- **フックテスト**: `tests/hooks/`
- **E2Eテスト**: `tests/e2e/`（Playwright）

## ドキュメント

- **README.md**: ユーザー向けドキュメント（日本語）
- **docs/**: 技術ドキュメント、アーキテクチャ図
- **.kiro/specs/webui-migration/**: WebUI移行仕様書
  - requirements.md: 要件定義
  - design.md: 設計書
  - tasks.md: 実装タスクリスト
- **backend/docs/**: バックエンドAPI仕様（FastAPI自動生成）
- **frontend/README.md**: フロントエンド開発ガイド

## 設定ファイル

### バックエンド
- **pyproject.toml**: Python依存関係、ツール設定
- **uv.lock**: 依存関係ロック
- **.env**: 環境変数（LOG_LEVEL, MAX_FILE_SIZE, CORS_ORIGINS）

### フロントエンド
- **package.json**: Node.js依存関係、スクリプト
- **pnpm-lock.yaml**: 依存関係ロック
- **vite.config.ts**: Viteビルド設定
- **tailwind.config.js**: Tailwind CSS設定
- **tsconfig.json**: TypeScript設定
- **.env**: 環境変数（VITE_API_URL, VITE_MAX_FILE_SIZE）

### Docker
- **docker-compose.yml**: 開発環境設定
- **backend/Dockerfile**: バックエンドコンテナ
- **frontend/Dockerfile**: フロントエンドコンテナ（マルチステージビルド）

### 共通
- **Makefile**: 開発者向け便利コマンド
- **.gitignore**: Git除外設定

## インポート規約

### バックエンド（Python）
- 標準ライブラリ → サードパーティ → ローカルの順
- パッケージ内は相対インポート: `from .services import ValidationService`
- 明示的インポートを優先: `from typing import Optional`

### フロントエンド（TypeScript）
- React → サードパーティ → ローカルの順
- 絶対パス推奨: `import { ImageStore } from '@/stores/imageStore'`
- 型インポート: `import type { ImageFile } from '@/types'`
- デフォルトエクスポートよりnamed exportを優先
