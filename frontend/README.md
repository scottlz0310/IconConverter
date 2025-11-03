# Frontend - Image to ICO Converter

React + TypeScript + Viteで構築されたモダンなWebアプリケーションフロントエンド。

## 技術スタック

- **React 18** - UIライブラリ
- **TypeScript 5.6** - 型安全性
- **Vite 6** - 高速ビルドツール
- **TanStack Query** - サーバー状態管理
- **Zustand** - クライアント状態管理
- **Tailwind CSS** - ユーティリティファーストCSS
- **shadcn/ui** - UIコンポーネント

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# プレビュー
pnpm preview
```

## テスト

### ユニット・コンポーネントテスト

```bash
# テスト実行（watch mode）
pnpm test

# テスト実行（1回のみ）
pnpm test:run

# カバレッジ付きテスト
pnpm test:coverage

# UIモードでテスト
pnpm test:ui
```

### E2Eテスト

E2Eテストは**CI環境でのみ実行**されます。ローカルでの実行は推奨されません。

CI環境では以下のコマンドが使用されます:
```bash
pnpm test:e2e:ci
```

ローカルで実行する場合（非推奨）:
```bash
# バックエンドとフロントエンドを起動してから
pnpm test:e2e

# デバッグモード
pnpm test:e2e:debug

# UIモード
pnpm test:e2e:ui
```

**注意**: E2Eテストはバックエンドが起動している必要があります。

## コード品質

```bash
# リント
pnpm lint

# フォーマット
pnpm format
```

## 環境変数

`.env`ファイルを作成して以下の変数を設定:

```env
VITE_API_URL=http://localhost:8000
VITE_MAX_FILE_SIZE=10485760
```

## プロジェクト構造

```
frontend/
├── src/
│   ├── components/     # Reactコンポーネント
│   │   ├── ui/        # shadcn/ui基本コンポーネント
│   │   └── __tests__/ # コンポーネントテスト
│   ├── hooks/         # カスタムフック
│   ├── stores/        # Zustand状態管理
│   ├── services/      # APIクライアント
│   ├── types/         # TypeScript型定義
│   └── test/          # テスト設定
├── e2e/               # E2Eテスト（CI専用）
└── public/            # 静的ファイル
```

## 開発ガイドライン

- コンポーネントはパスカルケース（`FileUploader.tsx`）
- フックは`use`接頭辞（`useImageConversion.ts`）
- 型定義はパスカルケース（`ImageFile`, `ConversionOptions`）
- 関数はキャメルケース（`convertImage`, `handleUpload`）
- 定数は大文字スネークケース（`MAX_FILE_SIZE`）

## ブラウザサポート

- Chrome（最新2バージョン）
- Firefox（最新2バージョン）
- Safari（最新2バージョン）
- Edge（最新2バージョン）
