# 配布形式設定

このドキュメントでは、各プラットフォーム向けの配布パッケージの設定と生成方法について説明します。

## サポートする配布形式

### Windows

1. **NSIS Installer** (推奨)
   - インストーラー形式
   - スタートメニュー、デスクトップショートカット作成
   - アンインストーラー付属
   - ファイル: `IconConverter-Setup-{version}.exe`

2. **Portable**
   - インストール不要の実行ファイル
   - USBメモリなどで持ち運び可能
   - ファイル: `IconConverter-{version}-portable.exe`

### macOS

1. **DMG** (推奨)
   - macOS標準のディスクイメージ
   - ドラッグ&ドロップでインストール
   - ファイル: `IconConverter-{version}.dmg`
   - アーキテクチャ: x64, arm64（Apple Silicon）

2. **ZIP**
   - 圧縮アーカイブ
   - 解凍して使用
   - ファイル: `IconConverter-{version}-mac.zip`

### Linux

1. **AppImage** (推奨)
   - 配布が最も簡単
   - 依存関係を含む単一ファイル
   - 実行権限を付与するだけで動作
   - ファイル: `IconConverter-{version}.AppImage`

2. **DEB**
   - Debian/Ubuntu系ディストリビューション用
   - `apt`/`dpkg`でインストール
   - ファイル: `iconconverter_{version}_amd64.deb`

3. **RPM**
   - Red Hat/Fedora系ディストリビューション用
   - `yum`/`dnf`/`rpm`でインストール
   - ファイル: `iconconverter-{version}.x86_64.rpm`

## ビルドコマンド

### すべてのプラットフォーム

```bash
# すべてのプラットフォーム用にビルド（現在のOSで可能なもの）
npm run package:all
```

### プラットフォーム別

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### 特定の形式のみ

```bash
# Windows NSIS のみ
electron-builder --win nsis

# Windows Portable のみ
electron-builder --win portable

# macOS DMG のみ
electron-builder --mac dmg

# Linux AppImage のみ
electron-builder --linux AppImage
```

## 配布パッケージの検証

### ビルド後の確認

```bash
# 出力ディレクトリの確認
ls -lh dist-electron/

# パッケージサイズの確認
du -sh dist-electron/*

# チェックサム生成
sha256sum dist-electron/*
```

### 目標サイズ

- Windows NSIS: < 150MB
- Windows Portable: < 150MB
- macOS DMG: < 180MB
- Linux AppImage: < 160MB
- Linux DEB: < 150MB
- Linux RPM: < 150MB

### サイズ最適化

パッケージサイズが大きい場合：

1. **不要なファイルの除外確認**

   ```bash
   # ASARアーカイブの内容確認
   npx asar list dist-electron/mac/IconConverter.app/Contents/Resources/app.asar
   ```

2. **依存関係の見直し**

   ```bash
   # 大きな依存関係を特定
   npx cost-of-modules
   ```

3. **圧縮設定の調整**
   - `package.json` の `build.compression` を確認
   - 現在: `"maximum"`

## プラットフォーム別設定詳細

### Windows NSIS

**設定項目** (`package.json` の `build.nsis`):

```json
{
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "IconConverter",
  "perMachine": false,
  "installerIcon": "build/icon.ico",
  "uninstallerIcon": "build/icon.ico",
  "license": "LICENSE"
}
```

**カスタマイズ**:

- インストーラー画像: `build/installerHeader.bmp`, `build/installerSidebar.bmp`
- ライセンス: `LICENSE` ファイル
- 言語: 日本語対応（`language: "2052"`）

**テスト**:

```bash
# Windows上で
IconConverter-Setup-1.0.0.exe /S  # サイレントインストール
```

### macOS DMG

**設定項目** (`package.json` の `build.dmg`):

```json
{
  "contents": [
    { "x": 130, "y": 220 },
    { "x": 410, "y": 220, "type": "link", "path": "/Applications" }
  ],
  "title": "IconConverter ${version}",
  "window": { "width": 540, "height": 380 }
}
```

**アーキテクチャ**:

- x64: Intel Mac用
- arm64: Apple Silicon (M1/M2/M3) Mac用
- Universal: 両方を含む（サイズが大きくなる）

**公証（Notarization）**:

```bash
# 環境変数設定
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="your-team-id"

# ビルド（自動的に公証される）
npm run build:mac
```

**テスト**:

```bash
# macOS上で
open dist-electron/IconConverter-1.0.0.dmg
# または
hdiutil attach dist-electron/IconConverter-1.0.0.dmg
```

### Linux AppImage

**利点**:

- 依存関係を含む単一ファイル
- どのディストリビューションでも動作
- インストール不要

**使用方法**:

```bash
# 実行権限を付与
chmod +x IconConverter-1.0.0.AppImage

# 実行
./IconConverter-1.0.0.AppImage
```

**統合**:

```bash
# デスクトップ統合（オプション）
./IconConverter-1.0.0.AppImage --appimage-extract
# または AppImageLauncher を使用
```

### Linux DEB

**対象ディストリビューション**:

- Ubuntu 20.04+
- Debian 11+
- Linux Mint 20+

**インストール**:

```bash
# GUIから
sudo dpkg -i iconconverter_1.0.0_amd64.deb
sudo apt-get install -f  # 依存関係を解決

# または
sudo apt install ./iconconverter_1.0.0_amd64.deb
```

**アンインストール**:

```bash
sudo apt remove iconconverter
```

### Linux RPM

**対象ディストリビューション**:

- Fedora 35+
- Red Hat Enterprise Linux 8+
- CentOS Stream 8+
- openSUSE Leap 15+

**インストール**:

```bash
# Fedora/RHEL
sudo dnf install iconconverter-1.0.0.x86_64.rpm

# または
sudo rpm -i iconconverter-1.0.0.x86_64.rpm
```

**アンインストール**:

```bash
sudo dnf remove iconconverter
# または
sudo rpm -e iconconverter
```

## 配布チェックリスト

### ビルド前

- [ ] バージョン番号を更新（`package.json`）
- [ ] CHANGELOGを更新
- [ ] アイコンファイルを確認
- [ ] ライセンスファイルを確認
- [ ] 環境変数を設定（コード署名用）

### ビルド

- [ ] フロントエンドをビルド: `npm run build:frontend`
- [ ] 各プラットフォーム用にビルド
- [ ] ビルドエラーがないか確認
- [ ] パッケージサイズを確認

### ビルド後

- [ ] 各パッケージを実際にインストール/実行してテスト
- [ ] 基本機能が動作するか確認
- [ ] ファイル関連付けが動作するか確認
- [ ] 自動更新が動作するか確認
- [ ] チェックサムを生成

### リリース

- [ ] GitHubでタグを作成
- [ ] GitHub Releasesにアップロード
- [ ] リリースノートを記載
- [ ] ダウンロードリンクを確認

## トラブルシューティング

### ビルドが失敗する

**エラー: "Cannot find module 'sharp'"**

```bash
npm install
npm run postinstall
```

**エラー: "ENOENT: no such file or directory, open 'build/icon.ico'"**

```bash
node build/create-placeholder-icons.js
```

**エラー: macOS公証失敗**

- Apple IDとパスワードを確認
- チームIDを確認
- 証明書が有効か確認

### パッケージが起動しない

**Windows**:

- Windows Defenderが実行をブロックしていないか確認
- コード署名を確認

**macOS**:

- Gatekeeperが実行をブロックしていないか確認
- 公証を確認
- `xattr -cr IconConverter.app` で属性をクリア

**Linux**:

- 実行権限を確認: `chmod +x`
- 依存関係を確認: `ldd`

### サイズが大きすぎる

1. 不要なファイルを除外
2. `node_modules` を最適化
3. ASARアーカイブの内容を確認
4. 開発用依存関係が含まれていないか確認

## CI/CD統合

GitHub Actionsでの自動ビルド例:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm install
      - run: npm run build
      
      - name: Build packages
        run: npm run package
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 参考資料

- [electron-builder Documentation](https://www.electron.build/)
- [NSIS Documentation](https://nsis.sourceforge.io/Docs/)
- [AppImage Documentation](https://docs.appimage.org/)
- [macOS Distribution Guide](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases)
