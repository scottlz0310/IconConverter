# Image to ICO Converter - Frontend

React + TypeScript + Viteを使用したモダンなWebアプリケーションのフロントエンドです。

## 技術スタック

- **React 19** - UIライブラリ
- **TypeScript 5.9** - 型安全性
- **Vite 7** - 高速ビルドツール
- **TanStack Query 5** - サーバー状態管理
- **Zustand 5** - クライアント状態管理
- **Tailwind CSS 4** - ユーティリティファーストCSS
- **shadcn/ui** - 高品質UIコンポーネント
- **Vitest** - ユニット・コンポーネントテスト
- **Playwright** - E2Eテスト

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# ビルド
pnpm build

# プレビュー
pnpm preview
```

## テスト

### ユニット・コンポーネントテスト

```bash
# テストを実行
pnpm test:run

# ウォッチモード
pnpm test

# カバレッジ
pnpm test:coverage
```

### E2Eテスト

```bash
# E2Eテストを実行
pnpm test:e2e

# UIモードで実行
pnpm test:e2e:ui

# デバッグモード
pnpm test:e2e:debug
```

詳細は [e2e/README.md](./e2e/README.md) を参照してください。

## コード品質

```bash
# リント
pnpm lint

# フォーマット
pnpm format
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
