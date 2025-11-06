# コード署名クイックスタートガイド

要件6.1: すべての配布パッケージへのコード署名

このガイドでは、IconConverterアプリケーションのコード署名を最短で設定する方法を説明します。

## 前提条件

### Windows

- Windows 10/11
- Code Signing Certificate (.pfx形式)
- Windows SDK（signtool.exe用）

### macOS

- macOS 12以降
- Apple Developer Program登録
- Developer ID Application証明書
- Xcode Command Line Tools

### Linux

- コード署名は不要

## クイックセットアップ（5分）

### ステップ1: 証明書の準備

#### Windows

```bash
# 証明書ファイル（.pfx）を準備
# 例: certificate.pfx
```

#### macOS

```bash
# Keychainから証明書をエクスポート
# 1. Keychain Accessを開く
# 2. "Developer ID Application" 証明書を選択
# 3. 右クリック > "Export"
# 4. .p12形式で保存
```

### ステップ2: 環境変数の設定

#### Windows（PowerShell）

```powershell
# 証明書のパス
$env:WIN_CSC_LINK = "C:\path\to\certificate.pfx"

# 証明書のパスワード
$env:WIN_CSC_KEY_PASSWORD = "your-password"
```

#### Windows（Command Prompt）

```cmd
set WIN_CSC_LINK=C:\path\to\certificate.pfx
set WIN_CSC_KEY_PASSWORD=your-password
```

#### macOS/Linux（Bash）

```bash
# コード署名
export CSC_LINK="/path/to/certificate.p12"
export CSC_KEY_PASSWORD="your-password"

# 公証（オプション）
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
```

### ステップ3: 設定の確認

```bash
# 設定をテスト
npm run test:signing-setup
```

このコマンドで以下を確認します：

- ✓ 環境変数が正しく設定されているか
- ✓ 証明書ファイルが存在するか
- ✓ 署名スクリプトが正しく配置されているか
- ✓ 必要なツールがインストールされているか

### ステップ4: ビルドの実行

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### ステップ5: 署名の検証

```bash
# ビルド後に署名を検証
npm run verify:signing
```

## 環境変数ファイルの使用（推奨）

### 1. テンプレートをコピー

```bash
cp build/.env.signing.template build/.env.signing
```

### 2. 証明書情報を設定

`build/.env.signing` ファイルを編集：

```bash
# Windows
WIN_CSC_LINK=/path/to/certificate.pfx
WIN_CSC_KEY_PASSWORD=your-password

# macOS
CSC_LINK=/path/to/certificate.p12
CSC_KEY_PASSWORD=your-password
APPLE_ID=your-apple-id@example.com
APPLE_ID_PASSWORD=app-specific-password
APPLE_TEAM_ID=YOUR_TEAM_ID
```

### 3. 環境変数を読み込んでビルド

```bash
# Bash/Zsh
source build/.env.signing && npm run build:mac

# PowerShell
Get-Content build\.env.signing | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}
npm run build:win
```

## Base64エンコード（CI/CD向け）

証明書ファイルをBase64エンコードして環境変数に設定できます：

### Windows

```powershell
# PowerShell
$bytes = [System.IO.File]::ReadAllBytes("certificate.pfx")
$base64 = [System.Convert]::ToBase64String($bytes)
$env:WIN_CSC_LINK = $base64
```

### macOS/Linux

```bash
# Bash
base64 -i certificate.p12 | tr -d '\n' > certificate.txt
export CSC_LINK=$(cat certificate.txt)
```

## macOS公証の設定

### 1. アプリ固有パスワードの生成

1. <https://appleid.apple.com> にアクセス
2. "セキュリティ" セクション
3. "App用パスワード" を生成
4. 生成されたパスワードをコピー

### 2. 環境変数に設定

```bash
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # アプリ固有パスワード
export APPLE_TEAM_ID="ABCDE12345"  # チームID
```

### 3. チームIDの確認

```bash
# Apple Developer アカウントページで確認
# https://developer.apple.com/account/

# または、証明書から確認
security find-identity -v -p codesigning
```

## トラブルシューティング

### Windows: signtool.exe が見つからない

```bash
# Windows SDKをインストール
# https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/

# または Chocolatey
choco install windows-sdk-10.0
```

### macOS: 証明書が見つからない

```bash
# インストールされている証明書を確認
security find-identity -v -p codesigning

# Keychainのロック解除
security unlock-keychain -p "your-password" ~/Library/Keychains/login.keychain-db
```

### 公証がタイムアウトする

```bash
# タイムアウト時間を延長（60分）
export NOTARIZE_TIMEOUT=3600000
npm run build:mac
```

### 開発時に署名をスキップ

```bash
# 環境変数を設定しない、または
export SKIP_NOTARIZATION=true
npm run build
```

## セキュリティのベストプラクティス

### ✓ すべきこと

- 証明書ファイルを安全な場所に保管
- パスワードを環境変数で管理
- `.env.signing` を `.gitignore` に追加
- CI/CDではシークレット管理機能を使用
- 証明書の有効期限を追跡

### ✗ してはいけないこと

- 証明書をバージョン管理に含める
- パスワードをコードに直接書く
- 証明書を公開リポジトリにアップロード
- 証明書を複数人で共有（最小限に）

## 次のステップ

1. **詳細な設定**: [CODE_SIGNING.md](./CODE_SIGNING.md) を参照
2. **CI/CD統合**: [GitHub Actions設定](#cicd統合)
3. **署名の検証**: `npm run verify:signing`

## よくある質問

### Q: 証明書はどこで取得できますか？

**Windows:**

- DigiCert: <https://www.digicert.com/code-signing/>
- Sectigo: <https://sectigo.com/ssl-certificates-tls/code-signing>
- GlobalSign: <https://www.globalsign.com/en/code-signing-certificate>

**macOS:**

- Apple Developer Program: <https://developer.apple.com/programs/>

### Q: 証明書の有効期限は？

- Windows: 通常1-3年
- macOS: 通常1年（自動更新可能）

### Q: 開発環境で署名は必須ですか？

いいえ。開発環境では署名なしでビルドできます。環境変数を設定しなければ、署名はスキップされます。

### Q: CI/CDで署名するには？

GitHub Actionsの例：

```yaml
- name: Build with signing
  env:
    WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
    WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
  run: npm run build:win
```

詳細は [CODE_SIGNING.md](./CODE_SIGNING.md) の「CI/CD統合」セクションを参照してください。

## サポート

問題が解決しない場合：

1. `npm run test:signing-setup` で設定を確認
2. [CODE_SIGNING.md](./CODE_SIGNING.md) のトラブルシューティングを参照
3. [electron-builder ドキュメント](https://www.electron.build/code-signing)を確認

---

最終更新: 2024年11月
