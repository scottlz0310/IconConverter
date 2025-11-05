# IconConverter Electron アプリケーション

## 概要

IconConverterのElectronデスクトップアプリケーション版です。オフラインで画像をICO形式に変換できます。

## 必要要件

- Node.js v20 LTS以降
- npm v10以降

## セットアップ

### 1. 依存関係のインストール

```bash
# ルートディレクトリの依存関係をインストール
npm install

# フロントエンドの依存関係をインストール
cd frontend
npm install
cd ..
```

### 2. アイコンファイルの準備

`assets/` ディレクトリにアプリケーションアイコンを配置してください：

- `icon.png` - 512x512px以上のPNG画像（推奨）
- `icon.ico` - Windows用アイコン（オプション）
- `icon.icns` - macOS用アイコン（オプション）

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

このコマンドは以下を実行します：
1. フロントエンド開発サーバー（Vite）を起動
2. Electronアプリケーションを起動

開発ツールが自動的に開き、ホットリロードが有効になります。

### 個別に起動する場合

```bash
# ターミナル1: フロントエンド開発サーバー
npm run dev:frontend

# ターミナル2: Electronアプリケーション
npm run dev:electron
```

## ビルド

### フロントエンドのビルド

```bash
npm run build:frontend
```

### プラットフォーム別ビルド

```bash
# Windows用
npm run build:win

# macOS用
npm run build:mac

# Linux用
npm run build:linux

# すべてのプラットフォーム
npm run package:all
```

ビルドされたアプリケーションは `dist-electron/` ディレクトリに出力されます。

## プロジェクト構造

```
.
├── electron/              # Electronメインプロセス
│   ├── main.js           # メインプロセスエントリーポイント
│   └── preload.js        # プリロードスクリプト（セキュアAPI）
├── frontend/             # Reactフロントエンド
│   ├── src/
│   │   ├── adapters/     # API適応層（Electron/Web切り替え）
│   │   └── utils/        # Electron環境検出ユーティリティ
│   └── dist/             # ビルド出力
├── assets/               # アプリケーションアイコン
├── package.json          # Electronプロジェクト設定
└── ELECTRON_README.md    # このファイル
```

## セキュリティ設定

このアプリケーションは以下のセキュリティベストプラクティスに従っています：

- ✅ `nodeIntegration: false` - Node.js統合無効
- ✅ `contextIsolation: true` - コンテキスト分離有効
- ✅ `enableRemoteModule: false` - リモートモジュール無効
- ✅ `webSecurity: true` - Webセキュリティ有効
- ✅ CSP（Content Security Policy）設定
- ✅ 外部ナビゲーション防止
- ✅ 新しいウィンドウ作成防止

## API適応層

フロントエンドコードは環境に応じて自動的に切り替わります：

- **Electron環境**: ネイティブファイルシステムとIPC通信を使用
- **Web環境**: HTTP APIとブラウザAPIを使用

```typescript
import { imageAPI } from '@/adapters/image-api';

// 環境に関係なく同じコードで動作
const blob = await imageAPI.convertImage(file, options);
await imageAPI.saveFile(blob, 'output.ico');
```

## トラブルシューティング

### Electronが起動しない

1. Node.jsのバージョンを確認: `node --version` (v20以降が必要)
2. 依存関係を再インストール: `rm -rf node_modules && npm install`
3. フロントエンドをビルド: `npm run build:frontend`

### ビルドエラー

1. `electron-builder`のキャッシュをクリア: `npm run clean`
2. 依存関係を再インストール
3. プラットフォーム固有の要件を確認（macOSではXcode、Windowsでは.NET Framework等）

### 開発サーバーが起動しない

1. ポート5173が使用中でないか確認
2. `frontend/node_modules`を削除して再インストール
3. Viteの設定を確認: `frontend/vite.config.ts`

## 次のステップ

現在、基本的なElectron環境が構築されました。次のフェーズで以下の機能を実装します：

- [ ] 画像処理ロジック（sharp統合）
- [ ] ファイルシステム統合（ダイアログ、ドラッグ&ドロップ）
- [ ] システムトレイ機能
- [ ] ファイル関連付け
- [ ] 自動更新機能

## ライセンス

MIT License
