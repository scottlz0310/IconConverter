/**
 * コード署名検証スクリプト
 * 要件6.1: 署名検証テスト
 * 
 * ビルドされたアプリケーションのコード署名を検証します。
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * プラットフォームの検出
 */
function detectPlatform() {
    const platform = process.platform;
    if (platform === 'darwin') return 'mac';
    if (platform === 'win32') return 'win';
    if (platform === 'linux') return 'linux';
    throw new Error(`Unsupported platform: ${platform}`);
}

/**
 * ビルド出力ディレクトリからアプリケーションを検索
 */
function findBuiltApp(platform) {
    const distDir = path.join(__dirname, '..', 'dist-electron');

    if (!fs.existsSync(distDir)) {
        throw new Error(`Build directory not found: ${distDir}`);
    }

    if (platform === 'mac') {
        // macOS: .app バンドルを検索
        const macDir = path.join(distDir, 'mac');
        if (fs.existsSync(macDir)) {
            const files = fs.readdirSync(macDir);
            const appFile = files.find(f => f.endsWith('.app'));
            if (appFile) {
                return path.join(macDir, appFile);
            }
        }

        // arm64ビルドも確認
        const macArm64Dir = path.join(distDir, 'mac-arm64');
        if (fs.existsSync(macArm64Dir)) {
            const files = fs.readdirSync(macArm64Dir);
            const appFile = files.find(f => f.endsWith('.app'));
            if (appFile) {
                return path.join(macArm64Dir, appFile);
            }
        }
    } else if (platform === 'win') {
        // Windows: .exe ファイルを検索
        const winDir = path.join(distDir, 'win-unpacked');
        if (fs.existsSync(winDir)) {
            const files = fs.readdirSync(winDir);
            const exeFile = files.find(f => f.endsWith('.exe') && !f.includes('Uninstall'));
            if (exeFile) {
                return path.join(winDir, exeFile);
            }
        }
    }

    throw new Error(`Built application not found in ${distDir}`);
}

/**
 * macOS: コード署名の検証
 */
function verifyMacOSSignature(appPath) {
    console.log('\n=== macOS Code Signature Verification ===\n');
    console.log(`App Path: ${appPath}\n`);

    try {
        // codesign --verify で署名を検証
        console.log('1. Verifying code signature...');
        execSync(`codesign --verify --deep --strict --verbose=2 "${appPath}"`, { stdio: 'inherit' });
        console.log('✓ Code signature is valid\n');

        // codesign --display で署名情報を表示
        console.log('2. Displaying signature information...');
        execSync(`codesign --display --verbose=4 "${appPath}"`, { stdio: 'inherit' });
        console.log('');

        // spctl で Gatekeeper の評価
        console.log('3. Checking Gatekeeper assessment...');
        try {
            execSync(`spctl --assess --verbose=4 --type execute "${appPath}"`, { stdio: 'inherit' });
            console.log('✓ Gatekeeper assessment passed\n');
        } catch (error) {
            console.warn('⚠ Gatekeeper assessment failed (app may not be notarized)\n');
        }

        // 公証チケットの確認
        console.log('4. Checking notarization ticket...');
        try {
            execSync(`xcrun stapler validate "${appPath}"`, { stdio: 'inherit' });
            console.log('✓ Notarization ticket is valid\n');
        } catch (error) {
            console.warn('⚠ Notarization ticket not found or invalid\n');
        }

        // エンタイトルメントの確認
        console.log('5. Checking entitlements...');
        execSync(`codesign --display --entitlements - "${appPath}"`, { stdio: 'inherit' });
        console.log('');

        return true;
    } catch (error) {
        console.error('✗ Code signature verification failed:', error.message);
        return false;
    }
}

/**
 * Windows: コード署名の検証
 */
function verifyWindowsSignature(exePath) {
    console.log('\n=== Windows Code Signature Verification ===\n');
    console.log(`Executable Path: ${exePath}\n`);

    try {
        // signtool verify で署名を検証
        console.log('1. Verifying code signature...');

        // signtoolのパスを検索
        const signtoolPaths = [
            'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x64\\signtool.exe',
            'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe',
            'signtool.exe' // PATH環境変数から検索
        ];

        let signtoolPath = null;
        for (const p of signtoolPaths) {
            if (fs.existsSync(p) || p === 'signtool.exe') {
                signtoolPath = p;
                break;
            }
        }

        if (!signtoolPath) {
            console.warn('⚠ signtool.exe not found, skipping signature verification');
            console.warn('  Install Windows SDK to enable signature verification');
            return false;
        }

        // 署名の検証
        execSync(`"${signtoolPath}" verify /pa /v "${exePath}"`, { stdio: 'inherit' });
        console.log('✓ Code signature is valid\n');

        // タイムスタンプの確認
        console.log('2. Checking timestamp...');
        execSync(`"${signtoolPath}" verify /pa /v /t "${exePath}"`, { stdio: 'inherit' });
        console.log('✓ Timestamp is valid\n');

        return true;
    } catch (error) {
        console.error('✗ Code signature verification failed:', error.message);
        return false;
    }
}

/**
 * Linux: コード署名の検証（サポートなし）
 */
function verifyLinuxSignature() {
    console.log('\n=== Linux Code Signature Verification ===\n');
    console.log('Linux does not support code signing');
    console.log('Verification skipped\n');
    return true;
}

/**
 * メイン関数
 */
async function main() {
    console.log('IconConverter - Code Signature Verification Tool');
    console.log('================================================\n');

    try {
        const platform = detectPlatform();
        console.log(`Platform: ${platform}`);

        if (platform === 'linux') {
            verifyLinuxSignature();
            return;
        }

        const appPath = findBuiltApp(platform);

        let success = false;
        if (platform === 'mac') {
            success = verifyMacOSSignature(appPath);
        } else if (platform === 'win') {
            success = verifyWindowsSignature(appPath);
        }

        console.log('\n================================================');
        if (success) {
            console.log('✓ All signature verifications passed');
            process.exit(0);
        } else {
            console.log('✗ Some signature verifications failed');
            process.exit(1);
        }

    } catch (error) {
        console.error('\nError:', error.message);
        console.error('\nMake sure to build the application first:');
        console.error('  npm run build');
        process.exit(1);
    }
}

// スクリプトとして実行された場合
if (require.main === module) {
    main();
}

module.exports = { verifyMacOSSignature, verifyWindowsSignature };
