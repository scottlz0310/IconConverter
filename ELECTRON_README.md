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

### コード署名付きビルド

配布用のビルドには、コード署名が必要です。詳細は以下のドキュメントを参照してください：

- **クイックスタート**: [build/SIGNING_QUICKSTART.md](build/SIGNING_QUICKSTART.md)
- **詳細ガイド**: [build/CODE_SIGNING.md](build/CODE_SIGNING.md)
- **実装サマリー**: [build/SIGNING_IMPLEMENTATION_SUMMARY.md](build/SIGNING_IMPLEMENTATION_SUMMARY.md)

#### 署名設定のテスト

```bash
npm run test:signing-setup
```

#### 署名の検証

```bash
npm run verify:signing
```

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

## コード署名

アプリケーションの配布には、コード署名が推奨されます。詳細は [build/CODE_SIGNING.md](build/CODE_SIGNING.md) を参照してください。

### 署名設定のテスト

```bash
# 署名設定をテスト
npm run test:signing-setup

# ビルド後に署名を検証
npm run verify:signing
```

### 環境変数の設定

**Windows:**

```bash
export WIN_CSC_LINK="/path/to/certificate.pfx"
export WIN_CSC_KEY_PASSWORD="your-password"  # pragma: allowlist secret
```

**macOS:**

```bash
export CSC_LINK="/path/to/certificate.p12"
export CSC_KEY_PASSWORD="your-password"  # pragma: allowlist secret
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="app-specific-password"  # pragma: allowlist secret
export APPLE_TEAM_ID="YOUR_TEAM_ID"
```

詳細な設定方法は [build/CODE_SIGNING.md](build/CODE_SIGNING.md) を参照してください。

## CI/CD

GitHub Actionsを使用した自動ビルドとリリースが設定されています：

- `.github/workflows/build-and-sign.yml` - ビルドと署名の自動化
- `.github/workflows/verify-signing.yml` - 署名設定の検証

タグをプッシュすると、自動的にビルド、署名、リリースが実行されます：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## 次のステップ

現在、基本的なElectron環境が構築されました。次のフェーズで以下の機能を実装します：

- [x] 画像処理ロジック（sharp統合）
- [x] ファイルシステム統合（ダイアログ、ドラッグ&ドロップ）
- [x] システムトレイ機能
- [x] ファイル関連付け
- [x] 自動更新機能
- [x] コード署名とCI/CD統合

## ライセンス

MIT License

## リリース

### リリースプロセス

詳細なリリースプロセスについては、[build/RELEASE_PROCESS.md](build/RELEASE_PROCESS.md)を参照してください。

### クイックリリース

対話的なリリース準備ツールを使用:

```bash
npm run release:prepare
```

このスクリプトは以下を実行します:

1. バージョン番号の更新
2. CHANGELOGの更新
3. リリースノートのプレビュー
4. 変更のコミットとタグ作成
5. プッシュ（オプション）

### 手動リリース

```bash
# 1. バージョンを更新
npm version patch  # または minor, major

# 2. CHANGELOGを更新
# CHANGELOG.mdを編集

# 3. リリースノートをプレビュー
npm run release:notes 1.0.0

# 4. 変更をコミット
git add .
git commit -m "chore: bump version to 1.0.0"

# 5. タグを作成してプッシュ
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

タグをプッシュすると、GitHub Actionsが自動的に:

- マルチプラットフォームビルド（Windows, macOS, Linux）
- マルチアーキテクチャビルド（x64, arm64）
- コード署名
- GitHub Releasesへの公開

を実行します。

## 開発者向けドキュメント

- [リリースプロセスガイド](build/RELEASE_PROCESS.md) - 詳細なリリース手順
- [要件定義書](.kiro/specs/electron-migration/requirements.md) - プロジェクト要件
- [設計書](.kiro/specs/electron-migration/design.md) - システム設計
- [タスクリスト](.kiro/specs/electron-migration/tasks.md) - 実装タスク
