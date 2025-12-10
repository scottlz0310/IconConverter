# コード署名設定ガイド

要件6.1: すべての配布パッケージへのコード署名

このドキュメントでは、IconConverterアプリケーションのコード署名を設定する方法を説明します。

## 目次

1. [概要](#概要)
2. [Windows コード署名](#windows-コード署名)
3. [macOS コード署名](#macos-コード署名)
4. [Linux コード署名](#linux-コード署名)
5. [CI/CD 統合](#cicd-統合)
6. [署名の検証](#署名の検証)
7. [トラブルシューティング](#トラブルシューティング)

## 概要

コード署名は、アプリケーションの信頼性を保証し、ユーザーに安全なソフトウェアであることを示すために重要です。

### 必要な証明書

- **Windows**: Code Signing Certificate (.pfx形式)
- **macOS**: Apple Developer Certificate (.p12形式)
- **Linux**: コード署名は不要

## Windows コード署名

### 1. 証明書の取得

Windows用のコード署名証明書を取得します：

- **DigiCert**: <https://www.digicert.com/code-signing/>
- **Sectigo**: <https://sectigo.com/ssl-certificates-tls/code-signing>
- **GlobalSign**: <https://www.globalsign.com/en/code-signing-certificate>

### 2. 環境変数の設定

以下の環境変数を設定します：

```bash
# 証明書ファイルのパス（.pfx）
export WIN_CSC_LINK="/path/to/certificate.pfx"

# 証明書のパスワード
export WIN_CSC_KEY_PASSWORD="your-password"

# オプション: カスタム署名ツールのパス
export WIN_SIGN_TOOL="C:\Program Files (x86)\Windows Kits\10\bin\x64\signtool.exe"
```

### 3. Base64エンコードされた証明書の使用（CI/CD向け）

証明書ファイルをBase64エンコードして環境変数に設定できます：

```bash
# 証明書をBase64エンコード
base64 -i certificate.pfx -o certificate.txt

# 環境変数に設定
export WIN_CSC_LINK="$(cat certificate.txt)"
export WIN_CSC_KEY_PASSWORD="your-password"
```

### 4. ビルドの実行

```bash
npm run build:win
```

### ローカルテスト（署名をスキップ）

ローカル環境で署名証明書がない場合や、署名なしでビルドを行いたいときは、`build:win:nosign` を使用できます。これは `package.json` のオーバーライド設定を使って `certificateSubjectName` を無効化するだけで、CIでは従来通り署名が行われます。

```bash
# Windows（署名をスキップ）
pnpm run build:win:nosign
```

### 5. 署名の確認

```bash
# signtoolで署名を確認
signtool verify /pa /v "dist-electron/win-unpacked/IconConverter.exe"
```

## macOS コード署名

### 1. Apple Developer Certificateの取得

1. Apple Developer Programに登録: <https://developer.apple.com/programs/>
2. Xcode > Preferences > Accounts でApple IDを追加
3. "Manage Certificates" から "Developer ID Application" 証明書を作成
4. Keychain Accessから証明書を.p12形式でエクスポート

### 2. 環境変数の設定

```bash
# 証明書ファイルのパス（.p12）
export CSC_LINK="/path/to/certificate.p12"

# 証明書のパスワード
export CSC_KEY_PASSWORD="your-password"

# オプション: 証明書の名前
export CSC_NAME="Developer ID Application: Your Name (TEAM_ID)"

# 公証用の認証情報
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
```

### 3. アプリ固有パスワードの作成

公証には、Apple IDのアプリ固有パスワードが必要です：

1. <https://appleid.apple.com> にアクセス
2. "セキュリティ" セクションで "App用パスワード" を生成
3. 生成されたパスワードを `APPLE_ID_PASSWORD` に設定

### 4. ビルドの実行

```bash
npm run build:mac
```

### 5. 署名と公証の確認

```bash
# 署名の確認
codesign --verify --deep --strict --verbose=2 "dist-electron/mac/IconConverter.app"

# 公証チケットの確認
xcrun stapler validate "dist-electron/mac/IconConverter.app"

# Gatekeeperの評価
spctl --assess --verbose=4 --type execute "dist-electron/mac/IconConverter.app"
```

## Linux コード署名

Linuxはコード署名をサポートしていないため、設定は不要です。

```bash
npm run build:linux
```

## CI/CD 統合

### GitHub Actions

`.github/workflows/build.yml` に以下の設定を追加：

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build Windows
        env:
          WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
        run: npm run build:win

      - name: Verify signature
        run: node build/verify-signing.js

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build macOS
        env:
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
        run: npm run build:mac

      - name: Verify signature
        run: node build/verify-signing.js

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build Linux
        run: npm run build:linux
```

### GitHub Secretsの設定

リポジトリの Settings > Secrets and variables > Actions で以下のシークレットを追加：

**Windows:**

- `WIN_CSC_LINK`: Base64エンコードされた証明書
- `WIN_CSC_KEY_PASSWORD`: 証明書のパスワード

**macOS:**

- `CSC_LINK`: Base64エンコードされた証明書
- `CSC_KEY_PASSWORD`: 証明書のパスワード
- `APPLE_ID`: Apple ID
- `APPLE_ID_PASSWORD`: アプリ固有パスワード
- `APPLE_TEAM_ID`: チームID

## 署名の検証

ビルド後に署名を検証するスクリプトを実行：

```bash
node build/verify-signing.js
```

このスクリプトは以下を確認します：

### Windows

- コード署名の有効性
- タイムスタンプの有効性
- 証明書チェーン

### macOS

- コード署名の有効性
- Gatekeeperの評価
- 公証チケット
- エンタイトルメント

## トラブルシューティング

### Windows

**問題**: `signtool.exe not found`

**解決策**: Windows SDKをインストール

```bash
# Chocolateyを使用
choco install windows-sdk-10.0

# または手動でダウンロード
# https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
```

**問題**: `The specified timestamp server either could not be reached`

**解決策**: タイムスタンプサーバーを変更

```bash
export WIN_TIMESTAMP_SERVER="http://timestamp.digicert.com"
```

### macOS

**問題**: `errSecInternalComponent`

**解決策**: Keychainのロック解除

```bash
security unlock-keychain -p "your-password" ~/Library/Keychains/login.keychain-db
```

**問題**: `Notarization failed: Invalid credentials`

**解決策**:

1. Apple IDとアプリ固有パスワードを確認
2. 2ファクタ認証が有効になっているか確認
3. アプリ固有パスワードを再生成

**問題**: `Notarization timeout`

**解決策**: タイムアウト時間を延長

```bash
export NOTARIZE_TIMEOUT=3600000  # 60分
```

### 一般的な問題

**問題**: CI環境で署名が失敗する

**解決策**:

1. 環境変数が正しく設定されているか確認
2. Base64エンコードされた証明書が正しいか確認
3. 証明書の有効期限を確認

**問題**: 開発環境で署名をスキップしたい

**解決策**: 環境変数を設定しない、またはスキップフラグを使用

```bash
export SKIP_NOTARIZATION=true
npm run build
```

## セキュリティのベストプラクティス

1. **証明書の保護**
   - 証明書ファイルをバージョン管理に含めない
   - `.gitignore` に証明書ファイルを追加
   - CI/CDではシークレット管理機能を使用

2. **パスワードの管理**
   - パスワードをコードに直接書かない
   - 環境変数またはシークレット管理ツールを使用
   - 定期的にパスワードを変更

3. **証明書の更新**
   - 証明書の有効期限を追跡
   - 期限切れ前に更新
   - 更新後はCI/CDのシークレットも更新

4. **アクセス制限**
   - 証明書へのアクセスを最小限に制限
   - 必要な人員のみに共有
   - アクセスログを監視

## 参考リンク

### Windows

- [Microsoft: Code Signing Best Practices](https://docs.microsoft.com/en-us/windows-hardware/drivers/dashboard/code-signing-best-practices)
- [electron-builder: Code Signing](https://www.electron.build/code-signing)

### macOS

- [Apple: Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Apple: Code Signing Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/Introduction/Introduction.html)

### Electron

- [Electron: Code Signing](https://www.electronjs.org/docs/latest/tutorial/code-signing)
- [electron-builder: Code Signing](https://www.electron.build/code-signing)

## サポート

問題が解決しない場合は、以下を確認してください：

1. このドキュメントのトラブルシューティングセクション
2. electron-builderのドキュメント
3. GitHubのIssue

---

最終更新: 2024年11月
