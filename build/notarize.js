/**
 * macOS公証（Notarization）スクリプト
 * 要件6.1, 10.5: macOS公証、CI/CDでの自動署名統合
 * 
 * 環境変数が設定されている場合のみ実行されます：
 * - APPLE_ID: Apple ID
 * - APPLE_ID_PASSWORD: アプリ固有パスワード
 * - APPLE_TEAM_ID: チームID
 * 
 * オプション環境変数：
 * - NOTARIZE_TIMEOUT: タイムアウト時間（ミリ秒、デフォルト: 1800000 = 30分）
 * - SKIP_NOTARIZATION: 'true'の場合、公証をスキップ
 */

const { notarize } = require('@electron/notarize');
const fs = require('fs');
const path = require('path');

/**
 * 環境変数の検証
 */
function validateNotarizationCredentials() {
    const missing = [];

    if (!process.env.APPLE_ID) missing.push('APPLE_ID');
    if (!process.env.APPLE_ID_PASSWORD) missing.push('APPLE_ID_PASSWORD');
    if (!process.env.APPLE_TEAM_ID) missing.push('APPLE_TEAM_ID');

    return missing;
}

/**
 * アプリケーションバンドルの検証
 */
function verifyAppBundle(appPath) {
    if (!fs.existsSync(appPath)) {
        throw new Error(`App bundle not found: ${appPath}`);
    }

    // Info.plistの存在確認
    const infoPlistPath = path.join(appPath, 'Contents', 'Info.plist');
    if (!fs.existsSync(infoPlistPath)) {
        throw new Error(`Info.plist not found: ${infoPlistPath}`);
    }

    // コード署名の確認（_CodeSignatureディレクトリの存在）
    const codeSignaturePath = path.join(appPath, 'Contents', '_CodeSignature');
    if (!fs.existsSync(codeSignaturePath)) {
        console.warn(`Warning: _CodeSignature directory not found, app may not be signed`);
    }

    console.log(`App bundle verified: ${appPath}`);
    return true;
}

/**
 * 公証プロセスのログ出力
 */
function logNotarizationProgress(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [Notarization] ${message}`);
}

/**
 * 公証設定のサマリーを出力
 */
function printNotarizationSummary(appPath, config) {
    console.log('\n=== Notarization Summary ===');
    console.log(`App Path: ${appPath}`);
    console.log(`Apple ID: ${config.appleId}`);
    console.log(`Team ID: ${config.teamId}`);
    console.log(`Timeout: ${config.timeout || 1800000}ms (${Math.round((config.timeout || 1800000) / 60000)} minutes)`);
    console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`CI: ${process.env.CI ? 'Yes' : 'No'}`);
    console.log('============================\n');
}

/**
 * メインの公証関数
 */
exports.default = async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context;

    logNotarizationProgress('Starting notarization process');

    // macOS以外はスキップ
    if (electronPlatformName !== 'darwin') {
        logNotarizationProgress('Skipping: Not a macOS build');
        return;
    }

    // 明示的にスキップが指定されている場合
    if (process.env.SKIP_NOTARIZATION === 'true') {
        logNotarizationProgress('Skipping: SKIP_NOTARIZATION is set to true');
        return;
    }

    // 環境変数の検証
    const missingVars = validateNotarizationCredentials();

    if (missingVars.length > 0) {
        console.warn('[Notarization] Skipping: Missing environment variables:');
        missingVars.forEach(varName => console.warn(`  - ${varName}`));
        console.warn('[Notarization] Set these variables to enable notarization');
        return;
    }

    const appName = context.packager.appInfo.productFilename;
    const appPath = `${appOutDir}/${appName}.app`;

    try {
        // アプリケーションバンドルの検証
        verifyAppBundle(appPath);

        // 公証設定
        const notarizationConfig = {
            appPath,
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_ID_PASSWORD,
            teamId: process.env.APPLE_TEAM_ID,
        };

        // タイムアウト設定（デフォルト: 30分）
        const timeout = process.env.NOTARIZE_TIMEOUT
            ? parseInt(process.env.NOTARIZE_TIMEOUT, 10)
            : 1800000;

        printNotarizationSummary(appPath, notarizationConfig);

        logNotarizationProgress('Uploading app to Apple for notarization...');
        logNotarizationProgress('This may take several minutes, please wait...');

        const startTime = Date.now();

        // 公証の実行
        await notarize(notarizationConfig);

        const duration = Math.round((Date.now() - startTime) / 1000);
        logNotarizationProgress(`Notarization successful! (took ${duration} seconds)`);

        // 公証完了後の検証
        logNotarizationProgress('Verifying notarization...');

        // staple コマンドで公証チケットを確認（オプション）
        const { execSync } = require('child_process');
        try {
            execSync(`xcrun stapler validate "${appPath}"`, { stdio: 'inherit' });
            logNotarizationProgress('Notarization ticket validated successfully');
        } catch (error) {
            console.warn('[Notarization] Warning: Could not validate notarization ticket');
        }

    } catch (error) {
        console.error('[Notarization] Failed:', error.message);

        // 詳細なエラー情報を出力
        if (error.message.includes('timeout')) {
            console.error('[Notarization] Timeout: Notarization took too long');
            console.error('[Notarization] Try increasing NOTARIZE_TIMEOUT environment variable');
        } else if (error.message.includes('credentials')) {
            console.error('[Notarization] Credentials error: Check APPLE_ID and APPLE_ID_PASSWORD');
        } else if (error.message.includes('invalid')) {
            console.error('[Notarization] Invalid app: Check code signing and entitlements');
        }

        // CI環境では公証エラーで失敗させる
        if (process.env.CI === 'true') {
            throw error;
        } else {
            console.warn('[Notarization] Continuing without notarization (development mode)');
            console.warn('[Notarization] The app will not be notarized and may show warnings on macOS');
        }
    }
};
