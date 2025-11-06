# ビルド設定

このディレクトリには、electron-builderを使用したアプリケーションのパッケージング設定が含まれています。

## 必要なファイル

### アイコンファイル

各プラットフォーム用のアイコンファイルが必要です：

- **Windows**: `icon.ico` (256x256, 128x128, 64x64, 48x48, 32x32, 16x16を含む)
- **macOS**: `icon.icns` (1024x1024から16x16までの複数サイズを含む)
- **Linux**: `icons/` ディレクトリ内に複数サイズのPNGファイル
  - 16x16.png
  - 32x32.png
  - 48x48.png
  - 64x64.png
  - 128x128.png
  - 256x256.png
  - 512x512.png
  - 1024x1024.png

### インストーラー画像（Windows）

NSISインストーラー用の画像（オプション）：

- `installerHeader.bmp` (150x57ピクセル)
- `installerSidebar.bmp` (164x314ピクセル)

### macOS公証設定

- `entitlements.mac.plist`: macOSアプリケーションの権限設定
- `notarize.js`: 公証スクリプト

### コード署名

- `sign.js`: Windows用コード署名スクリプト

## ビルドコマンド

### 開発ビルド

```bash
npm run build
```

### プラットフォーム別ビルド

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### 全プラットフォームビルド

```bash
npm run package:all
```

## 環境変数

### macOS公証

```bash
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="your-team-id"
```

### Windowsコード署名

```bash
export WIN_CSC_LINK="/path/to/certificate.pfx"
export WIN_CSC_KEY_PASSWORD="certificate-password"
```

### GitHub Releases

```bash
export GH_TOKEN="your-github-token"
```

## パッケージサイズ最適化

以下の設定により、パッケージサイズを200MB未満に抑えています：

1. **ファイル除外**: 不要なファイル（テスト、ドキュメント、Python関連）を除外
2. **圧縮**: `compression: "maximum"` で最大圧縮
3. **ASAR**: アプリケーションファイルをASARアーカイブに圧縮
4. **依存関係の最適化**: 必要最小限の依存関係のみを含める

## Python依存関係の排除確認

以下のファイル/ディレクトリが除外されていることを確認：

- `backend/**/*`
- `iconconverter/**/*`
- `*.py`
- `pyproject.toml`
- `uv.lock`
- `__pycache__`

## トラブルシューティング

### ビルドが失敗する場合

1. Node.jsバージョンを確認（v20以降が必要）
2. 依存関係を再インストール: `npm install`
3. フロントエンドをビルド: `npm run build:frontend`
4. キャッシュをクリア: `rm -rf dist-electron node_modules/.cache`

### パッケージサイズが大きい場合

1. `dist-electron` ディレクトリの内容を確認
2. 不要なファイルが含まれていないか確認
3. `files` 設定を見直し

### macOS公証が失敗する場合

1. Apple IDとアプリ固有パスワードを確認
2. チームIDが正しいか確認
3. 証明書が有効か確認

## 参考資料

- [electron-builder Documentation](https://www.electron.build/)
- [macOS Notarization](https://www.electron.build/configuration/mac#notarization)
- [Windows Code Signing](https://www.electron.build/code-signing)
