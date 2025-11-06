/**
 * ビルド検証スクリプト
 * 
 * ビルドされたパッケージが要件を満たしているか検証します。
 * 
 * 使用方法:
 *   node build/verify-build.js
 */

const fs = require('fs').promises;
const path = require('path');

// 検証設定
const VERIFICATION_CONFIG = {
    maxPackageSize: 200 * 1024 * 1024, // 200MB
    requiredFiles: {
        windows: ['icon.ico'],
        mac: ['icon.icns'],
        linux: ['icons/16x16.png', 'icons/32x32.png', 'icons/48x48.png',
            'icons/64x64.png', 'icons/128x128.png', 'icons/256x256.png']
    },
    distDir: 'dist-electron'
};

class BuildVerifier {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    /**
     * すべての検証を実行
     */
    async verify() {
        console.log('='.repeat(60));
        console.log('ビルド検証を開始します...');
        console.log('='.repeat(60));
        console.log();

        await this.verifyBuildDirectory();
        await this.verifyIcons();
        await this.verifyPackageJson();
        await this.verifyDistPackages();
        await this.verifyPythonExclusion();

        this.printResults();

        return this.errors.length === 0;
    }

    /**
     * buildディレクトリの検証
     */
    async verifyBuildDirectory() {
        console.log('📁 buildディレクトリを検証中...');

        const buildDir = path.join(__dirname);

        try {
            // 必須ファイルの確認
            const requiredFiles = [
                'entitlements.mac.plist',
                'notarize.js',
                'sign.js',
                'README.md'
            ];

            for (const file of requiredFiles) {
                const filePath = path.join(buildDir, file);
                try {
                    await fs.access(filePath);
                    this.info.push(`✓ ${file} が存在します`);
                } catch {
                    this.errors.push(`✗ ${file} が見つかりません`);
                }
            }

        } catch (error) {
            this.errors.push(`buildディレクトリの検証エラー: ${error.message}`);
        }

        console.log();
    }

    /**
     * アイコンファイルの検証
     */
    async verifyIcons() {
        console.log('🎨 アイコンファイルを検証中...');

        const buildDir = path.join(__dirname);

        // Windows
        try {
            const icoPath = path.join(buildDir, 'icon.ico');
            const stats = await fs.stat(icoPath);

            if (stats.size > 0) {
                this.info.push(`✓ Windows icon.ico (${this.formatSize(stats.size)})`);
            } else {
                this.errors.push('✗ icon.ico が空です');
            }
        } catch {
            this.warnings.push('⚠ icon.ico が見つかりません（Windows ビルドに必要）');
        }

        // macOS
        try {
            const icnsPath = path.join(buildDir, 'icon.icns');
            const stats = await fs.stat(icnsPath);

            if (stats.size > 0) {
                this.info.push(`✓ macOS icon.icns (${this.formatSize(stats.size)})`);
            } else {
                this.errors.push('✗ icon.icns が空です');
            }
        } catch {
            this.warnings.push('⚠ icon.icns が見つかりません（macOS ビルドに必要）');
        }

        // Linux
        const iconsDir = path.join(buildDir, 'icons');
        try {
            const files = await fs.readdir(iconsDir);
            const pngFiles = files.filter(f => f.endsWith('.png'));

            if (pngFiles.length >= 6) {
                this.info.push(`✓ Linux icons (${pngFiles.length}個のPNGファイル)`);
            } else {
                this.warnings.push(`⚠ Linux icons が不足しています（${pngFiles.length}/6+）`);
            }
        } catch {
            this.warnings.push('⚠ icons/ ディレクトリが見つかりません（Linux ビルドに必要）');
        }

        console.log();
    }

    /**
     * package.jsonの検証
     */
    async verifyPackageJson() {
        console.log('📦 package.jsonを検証中...');

        try {
            const packagePath = path.join(__dirname, '..', 'package.json');
            const content = await fs.readFile(packagePath, 'utf-8');
            const pkg = JSON.parse(content);

            // build設定の確認
            if (!pkg.build) {
                this.errors.push('✗ package.json に build 設定がありません');
                return;
            }

            // 必須フィールドの確認
            const requiredFields = ['appId', 'productName', 'directories', 'files'];
            for (const field of requiredFields) {
                if (pkg.build[field]) {
                    this.info.push(`✓ build.${field} が設定されています`);
                } else {
                    this.errors.push(`✗ build.${field} が設定されていません`);
                }
            }

            // プラットフォーム設定の確認
            const platforms = ['mac', 'win', 'linux'];
            for (const platform of platforms) {
                if (pkg.build[platform]) {
                    this.info.push(`✓ ${platform} 設定が存在します`);
                } else {
                    this.warnings.push(`⚠ ${platform} 設定がありません`);
                }
            }

            // Python除外の確認
            const files = pkg.build.files || [];
            const pythonExclusions = files.filter(f =>
                f.includes('*.py') ||
                f.includes('backend') ||
                f.includes('iconconverter') ||
                f.includes('pyproject.toml')
            );

            if (pythonExclusions.length > 0) {
                this.info.push(`✓ Python関連ファイルが除外されています`);
            } else {
                this.warnings.push('⚠ Python関連ファイルの除外設定を確認してください');
            }

        } catch (error) {
            this.errors.push(`package.json の検証エラー: ${error.message}`);
        }

        console.log();
    }

    /**
     * 配布パッケージの検証
     */
    async verifyDistPackages() {
        console.log('📦 配布パッケージを検証中...');

        const distDir = path.join(__dirname, '..', VERIFICATION_CONFIG.distDir);

        try {
            await fs.access(distDir);

            const files = await fs.readdir(distDir, { recursive: true });
            const packages = files.filter(f =>
                f.endsWith('.exe') ||
                f.endsWith('.dmg') ||
                f.endsWith('.AppImage') ||
                f.endsWith('.deb') ||
                f.endsWith('.rpm')
            );

            if (packages.length === 0) {
                this.warnings.push('⚠ 配布パッケージが見つかりません（ビルドを実行してください）');
                return;
            }

            this.info.push(`✓ ${packages.length}個の配布パッケージが見つかりました`);

            // パッケージサイズの確認
            for (const pkg of packages) {
                const pkgPath = path.join(distDir, pkg);
                const stats = await fs.stat(pkgPath);
                const size = stats.size;
                const sizeStr = this.formatSize(size);

                if (size > VERIFICATION_CONFIG.maxPackageSize) {
                    this.warnings.push(`⚠ ${pkg}: ${sizeStr} (目標: 200MB以下)`);
                } else {
                    this.info.push(`✓ ${pkg}: ${sizeStr}`);
                }
            }

        } catch {
            this.warnings.push('⚠ dist-electron ディレクトリが見つかりません');
        }

        console.log();
    }

    /**
     * Python依存関係の除外確認
     */
    async verifyPythonExclusion() {
        console.log('🐍 Python依存関係の除外を確認中...');

        const distDir = path.join(__dirname, '..', VERIFICATION_CONFIG.distDir);

        try {
            await fs.access(distDir);

            // ASARアーカイブ内のPythonファイルをチェック
            // 注: 実際のチェックにはasarモジュールが必要
            this.info.push('✓ Python除外の確認（手動確認が必要）');
            this.info.push('  確認方法: npx asar list dist-electron/.../app.asar | grep -E "\\.py$|backend|iconconverter"');

        } catch {
            this.warnings.push('⚠ 配布パッケージが存在しないため、Python除外を確認できません');
        }

        console.log();
    }

    /**
     * 結果を表示
     */
    printResults() {
        console.log('='.repeat(60));
        console.log('検証結果');
        console.log('='.repeat(60));
        console.log();

        if (this.info.length > 0) {
            console.log('✅ 情報:');
            this.info.forEach(msg => console.log(`  ${msg}`));
            console.log();
        }

        if (this.warnings.length > 0) {
            console.log('⚠️  警告:');
            this.warnings.forEach(msg => console.log(`  ${msg}`));
            console.log();
        }

        if (this.errors.length > 0) {
            console.log('❌ エラー:');
            this.errors.forEach(msg => console.log(`  ${msg}`));
            console.log();
        }

        console.log('='.repeat(60));

        if (this.errors.length === 0) {
            console.log('✅ 検証成功！');
            if (this.warnings.length > 0) {
                console.log(`⚠️  ${this.warnings.length}件の警告があります`);
            }
        } else {
            console.log(`❌ 検証失敗: ${this.errors.length}件のエラー`);
        }

        console.log('='.repeat(60));
    }

    /**
     * ファイルサイズをフォーマット
     */
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}

// スクリプト実行
if (require.main === module) {
    const verifier = new BuildVerifier();

    verifier.verify()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('検証エラー:', error);
            process.exit(1);
        });
}

module.exports = BuildVerifier;
