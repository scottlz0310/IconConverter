#!/usr/bin/env node

/**
 * リリースノート自動生成スクリプト
 * 
 * CHANGELOGから該当バージョンの変更内容を抽出し、
 * GitHub Releases用のマークダウンを生成します。
 * 
 * 使用方法:
 *   node build/generate-release-notes.js <version>
 * 
 * 例:
 *   node build/generate-release-notes.js 1.0.0
 */

const fs = require('fs');
const path = require('path');

/**
 * CHANGELOGから特定バージョンの変更内容を抽出
 * @param {string} version - バージョン番号（例: "1.0.0"）
 * @returns {string} 変更内容のマークダウン
 */
function extractChangelogSection(version) {
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');

    if (!fs.existsSync(changelogPath)) {
        console.warn('⚠️  CHANGELOG.md が見つかりません');
        return '';
    }

    const changelog = fs.readFileSync(changelogPath, 'utf8');
    const lines = changelog.split('\n');

    // バージョンセクションの開始行を見つける
    const versionPattern = new RegExp(`^##\\s+\\[?${version.replace(/\./g, '\\.')}\\]?`);
    const startIndex = lines.findIndex(line => versionPattern.test(line));

    if (startIndex === -1) {
        console.warn(`⚠️  バージョン ${version} のセクションが見つかりません`);
        return '';
    }

    // 次のバージョンセクションまたはファイル末尾までを抽出
    let endIndex = lines.length;
    for (let i = startIndex + 1; i < lines.length; i++) {
        if (/^##\s+\[?\d+\.\d+\.\d+/.test(lines[i])) {
            endIndex = i;
            break;
        }
    }

    // セクションの内容を抽出（見出し行は除く）
    const sectionLines = lines.slice(startIndex + 1, endIndex);

    // 空行を削除してトリム
    const content = sectionLines
        .join('\n')
        .trim();

    return content;
}

/**
 * ダウンロードセクションを生成
 * @param {string} version - バージョン番号
 * @returns {string} ダウンロードセクションのマークダウン
 */
function generateDownloadSection(version) {
    return `### 📦 ダウンロード

#### Windows (x64)
- **インストーラー版**: \`IconConverter-${version}-Setup.exe\`
  - 推奨: 通常のインストール方法
  - デスクトップショートカット、スタートメニュー登録
  - 自動更新機能対応
- **ポータブル版**: \`IconConverter-${version}-portable.exe\`
  - インストール不要
  - USBメモリなどで持ち運び可能

#### macOS
- **x64 (Intel Mac)**: 
  - \`IconConverter-${version}-x64.dmg\` - DMGインストーラー
  - \`IconConverter-${version}-x64-mac.zip\` - ZIP版
- **arm64 (Apple Silicon M1/M2/M3)**: 
  - \`IconConverter-${version}-arm64.dmg\` - DMGインストーラー
  - \`IconConverter-${version}-arm64-mac.zip\` - ZIP版

#### Linux
- **x64 (64ビット Intel/AMD)**: 
  - \`IconConverter-${version}-x64.AppImage\` - AppImage版（推奨）
  - \`iconconverter_${version}_amd64.deb\` - Debian/Ubuntu用
  - \`iconconverter-${version}.x86_64.rpm\` - RedHat/Fedora用
- **arm64 (ARM 64ビット)**: 
  - \`IconConverter-${version}-arm64.AppImage\` - AppImage版（推奨）
  - \`iconconverter_${version}_arm64.deb\` - Debian/Ubuntu用
  - \`iconconverter-${version}.aarch64.rpm\` - RedHat/Fedora用`;
}

/**
 * システム要件セクションを生成
 * @returns {string} システム要件セクションのマークダウン
 */
function generateSystemRequirements() {
    return `### 📋 システム要件

| プラットフォーム | 最小要件 | 推奨環境 |
|------------------|----------|----------|
| **Windows** | Windows 10 (x64) | Windows 11 (x64) |
| **macOS** | macOS 12 Monterey | macOS 14 Sonoma以降 |
| **Linux** | Ubuntu 20.04 LTS | Ubuntu 22.04 LTS以降 |

**アーキテクチャ対応**:
- x64 (Intel/AMD 64ビット)
- arm64 (Apple Silicon, ARM 64ビット)`;
}

/**
 * インストール方法セクションを生成
 * @returns {string} インストール方法セクションのマークダウン
 */
function generateInstallationInstructions() {
    return `### 🔧 インストール方法

#### Windows
1. \`IconConverter-Setup.exe\` をダウンロード
2. インストーラーを実行
3. インストールウィザードに従って進める
4. デスクトップまたはスタートメニューから起動

**ポータブル版**:
1. \`IconConverter-portable.exe\` をダウンロード
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
\`\`\`bash
# ダウンロード後、実行権限を付与
chmod +x IconConverter-*.AppImage

# 実行
./IconConverter-*.AppImage
\`\`\`

**DEB版（Debian/Ubuntu）**:
\`\`\`bash
sudo dpkg -i iconconverter_*_amd64.deb
# または
sudo dpkg -i iconconverter_*_arm64.deb

# 依存関係の解決
sudo apt-get install -f
\`\`\`

**RPM版（RedHat/Fedora）**:
\`\`\`bash
sudo rpm -i iconconverter-*.x86_64.rpm
# または
sudo rpm -i iconconverter-*.aarch64.rpm
\`\`\``;
}

/**
 * 機能ハイライトセクションを生成
 * @returns {string} 機能ハイライトセクションのマークダウン
 */
function generateFeatureHighlights() {
    return `### ✨ 主な機能

- 🖼️ **多様な画像形式対応**: PNG、JPEG、BMP、GIF、TIFF、WebP
- 🎯 **6サイズ同時生成**: 16x16、32x32、48x48、64x64、128x128、256x256
- 🔍 **透明度保持**: PNG、GIF、WebPの透明度を維持
- 🎨 **自動背景除去**: 単色背景の自動検出と透明化
- 📁 **ドラッグ&ドロップ**: デスクトップからの直接ドロップ対応
- 🔄 **右クリック統合**: 画像ファイルから直接変換
- 📊 **システムトレイ**: バックグラウンド実行とクイック変換
- 🌐 **オフライン動作**: インターネット接続不要
- 🔒 **セキュア**: コード署名済み、最小権限で動作
- 🔄 **自動更新**: 新バージョンの自動チェックと更新`;
}

/**
 * フッターセクションを生成
 * @param {string} repoUrl - GitHubリポジトリURL
 * @returns {string} フッターセクションのマークダウン
 */
function generateFooter(repoUrl) {
    return `---

### 📚 ドキュメント
- [README](${repoUrl}/blob/main/README.md) - プロジェクト概要
- [CHANGELOG](${repoUrl}/blob/main/CHANGELOG.md) - 完全な変更履歴
- [Electronアプリガイド](${repoUrl}/blob/main/ELECTRON_README.md) - 詳細なインストール・使用方法

### 🐛 問題報告・機能要望
問題が発生した場合や機能要望がある場合は、[Issues](${repoUrl}/issues)で報告してください。

### 💬 コミュニティ
- [Discussions](${repoUrl}/discussions) - 質問や議論
- [Contributing](${repoUrl}/blob/main/CONTRIBUTING.md) - 貢献ガイド

### ✅ 品質保証
- ✓ コード署名済み（Windows/macOS）
- ✓ セキュリティスキャン実施
- ✓ マルチプラットフォームテスト済み
- ✓ パフォーマンステスト合格
- ✓ アクセシビリティ準拠（WCAG 2.1 AA）

### 🙏 謝辞
このプロジェクトを使用していただき、ありがとうございます！`;
}

/**
 * 完全なリリースノートを生成
 * @param {string} version - バージョン番号
 * @param {string} repoUrl - GitHubリポジトリURL
 * @returns {string} 完全なリリースノートのマークダウン
 */
function generateReleaseNotes(version, repoUrl = 'https://github.com/iconconverter/iconconverter') {
    const sections = [
        `## IconConverter v${version}`,
        '',
        generateFeatureHighlights(),
        '',
        generateDownloadSection(version),
        '',
        generateSystemRequirements(),
        '',
        generateInstallationInstructions(),
    ];

    // CHANGELOGから変更内容を抽出
    const changelogContent = extractChangelogSection(version);
    if (changelogContent) {
        sections.push('');
        sections.push('### 📝 このバージョンの変更内容');
        sections.push('');
        sections.push(changelogContent);
    }

    sections.push('');
    sections.push(generateFooter(repoUrl));

    return sections.join('\n');
}

/**
 * メイン処理
 */
function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('❌ エラー: バージョン番号を指定してください');
        console.error('使用方法: node build/generate-release-notes.js <version>');
        console.error('例: node build/generate-release-notes.js 1.0.0');
        process.exit(1);
    }

    const version = args[0].replace(/^v/, ''); // "v1.0.0" -> "1.0.0"
    const repoUrl = process.env.GITHUB_REPOSITORY
        ? `https://github.com/${process.env.GITHUB_REPOSITORY}`
        : 'https://github.com/iconconverter/iconconverter';

    console.log(`📝 リリースノートを生成中... (バージョン: ${version})`);

    const releaseNotes = generateReleaseNotes(version, repoUrl);

    // 標準出力に出力（GitHub Actionsで使用）
    console.log('\n' + '='.repeat(80));
    console.log(releaseNotes);
    console.log('='.repeat(80) + '\n');

    // ファイルにも保存
    const outputPath = path.join(__dirname, '..', 'release-notes.md');
    fs.writeFileSync(outputPath, releaseNotes, 'utf8');
    console.log(`✅ リリースノートを保存しました: ${outputPath}`);
}

// スクリプトとして実行された場合のみmainを実行
if (require.main === module) {
    main();
}

module.exports = {
    extractChangelogSection,
    generateDownloadSection,
    generateSystemRequirements,
    generateInstallationInstructions,
    generateFeatureHighlights,
    generateFooter,
    generateReleaseNotes
};
