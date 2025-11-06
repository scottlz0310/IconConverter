## IconConverter v1.0.0

### ✨ 主な機能

- 🖼️ **多様な画像形式対応**: PNG、JPEG、BMP、GIF、TIFF、WebP
- 🎯 **6サイズ同時生成**: 16x16、32x32、48x48、64x64、128x128、256x256
- 🔍 **透明度保持**: PNG、GIF、WebPの透明度を維持
- 🎨 **自動背景除去**: 単色背景の自動検出と透明化
- 📁 **ドラッグ&ドロップ**: デスクトップからの直接ドロップ対応
- 🔄 **右クリック統合**: 画像ファイルから直接変換
- 📊 **システムトレイ**: バックグラウンド実行とクイック変換
- 🌐 **オフライン動作**: インターネット接続不要
- 🔒 **セキュア**: コード署名済み、最小権限で動作
- 🔄 **自動更新**: 新バージョンの自動チェックと更新

### 📦 ダウンロード

#### Windows (x64)
- **インストーラー版**: `IconConverter-1.0.0-Setup.exe`
  - 推奨: 通常のインストール方法
  - デスクトップショートカット、スタートメニュー登録
  - 自動更新機能対応
- **ポータブル版**: `IconConverter-1.0.0-portable.exe`
  - インストール不要
  - USBメモリなどで持ち運び可能

#### macOS
- **x64 (Intel Mac)**:
  - `IconConverter-1.0.0-x64.dmg` - DMGインストーラー
  - `IconConverter-1.0.0-x64-mac.zip` - ZIP版
- **arm64 (Apple Silicon M1/M2/M3)**:
  - `IconConverter-1.0.0-arm64.dmg` - DMGインストーラー
  - `IconConverter-1.0.0-arm64-mac.zip` - ZIP版

#### Linux
- **x64 (64ビット Intel/AMD)**:
  - `IconConverter-1.0.0-x64.AppImage` - AppImage版（推奨）
  - `iconconverter_1.0.0_amd64.deb` - Debian/Ubuntu用
  - `iconconverter-1.0.0.x86_64.rpm` - RedHat/Fedora用
- **arm64 (ARM 64ビット)**:
  - `IconConverter-1.0.0-arm64.AppImage` - AppImage版（推奨）
  - `iconconverter_1.0.0_arm64.deb` - Debian/Ubuntu用
  - `iconconverter-1.0.0.aarch64.rpm` - RedHat/Fedora用

### 📋 システム要件

| プラットフォーム | 最小要件 | 推奨環境 |
|------------------|----------|----------|
| **Windows** | Windows 10 (x64) | Windows 11 (x64) |
| **macOS** | macOS 12 Monterey | macOS 14 Sonoma以降 |
| **Linux** | Ubuntu 20.04 LTS | Ubuntu 22.04 LTS以降 |

**アーキテクチャ対応**:
- x64 (Intel/AMD 64ビット)
- arm64 (Apple Silicon, ARM 64ビット)

### 🔧 インストール方法

#### Windows
1. `IconConverter-Setup.exe` をダウンロード
2. インストーラーを実行
3. インストールウィザードに従って進める
4. デスクトップまたはスタートメニューから起動

**ポータブル版**:
1. `IconConverter-portable.exe` をダウンロード
2. 任意のフォルダに配置
3. 実行ファイルをダブルクリックして起動

#### macOS
1. お使いのMacに合わせてDMGファイルをダウンロード
   - Intel Mac: x64版
   - Apple Silicon (M1/M2/M3): arm64版
2. DMGファイルをマウント
3. IconConverterアイコンをApplicationsフォルダにドラッグ
4. Launchpadまたは Applicationsフォルダから起動

**初回起動時の注意**:
- 「開発元を確認できないため開けません」と表示された場合:
  1. システム設定 > プライバシーとセキュリティ
  2. 「このまま開く」をクリック

#### Linux
**AppImage版（推奨）**:
```bash
# ダウンロード後、実行権限を付与
chmod +x IconConverter-*.AppImage

# 実行
./IconConverter-*.AppImage
```

**DEB版（Debian/Ubuntu）**:
```bash
sudo dpkg -i iconconverter_*_amd64.deb
# または
sudo dpkg -i iconconverter_*_arm64.deb

# 依存関係の解決
sudo apt-get install -f
```

**RPM版（RedHat/Fedora）**:
```bash
sudo rpm -i iconconverter-*.x86_64.rpm
# または
sudo rpm -i iconconverter-*.aarch64.rpm
```

---

### 📚 ドキュメント
- [README](https://github.com/iconconverter/iconconverter/blob/main/README.md) - プロジェクト概要
- [CHANGELOG](https://github.com/iconconverter/iconconverter/blob/main/CHANGELOG.md) - 完全な変更履歴
- [Electronアプリガイド](https://github.com/iconconverter/iconconverter/blob/main/ELECTRON_README.md) - 詳細なインストール・使用方法

### 🐛 問題報告・機能要望
問題が発生した場合や機能要望がある場合は、[Issues](https://github.com/iconconverter/iconconverter/issues)で報告してください。

### 💬 コミュニティ
- [Discussions](https://github.com/iconconverter/iconconverter/discussions) - 質問や議論
- [Contributing](https://github.com/iconconverter/iconconverter/blob/main/CONTRIBUTING.md) - 貢献ガイド

### ✅ 品質保証
- ✓ コード署名済み（Windows/macOS）
- ✓ セキュリティスキャン実施
- ✓ マルチプラットフォームテスト済み
- ✓ パフォーマンステスト合格
- ✓ アクセシビリティ準拠（WCAG 2.1 AA）

### 🙏 謝辞
このプロジェクトを使用していただき、ありがとうございます！
