/**
 * コード署名スクリプト
 * 要件6.1: すべての配布パッケージへのコード署名
 * 
 * プラットフォーム別のコード署名を実行します。
 * 
 * Windows環境変数：
 * - WIN_CSC_LINK: 証明書ファイルのパス（.pfx）またはBase64エンコードされた証明書
 * - WIN_CSC_KEY_PASSWORD: 証明書のパスワード
 * - WIN_SIGN_TOOL: 署名ツール（signtool.exeのパス、オプション）
 * 
 * macOS環境変数：
 * - CSC_LINK: 証明書ファイルのパス（.p12）またはBase64エンコードされた証明書
 * - CSC_KEY_PASSWORD: 証明書のパスワード
 * - CSC_NAME: 証明書の名前（オプション）
 * - APPLE_ID: Apple ID（公証用）
 * - APPLE_ID_PASSWORD: アプリ固有パスワード（公証用）
 * - APPLE_TEAM_ID: チームID（公証用）
 * 
 * Linux環境変数：
 * - Linuxはコード署名をサポートしていないため、スキップ
 */

const fs = require('fs');
const path = require('path');

/**
 * 環境変数の検証
 */
function validateEnvironmentVariables(platform) {
    const missing = [];

    if (platform === 'win') {
        if (!process.env.WIN_CSC_LINK) missing.push('WIN_CSC_LINK');
        if (!process.env.WIN_CSC_KEY_PASSWORD) missing.push('WIN_CSC_KEY_PASSWORD');
    } else if (platform === 'darwin') {
        if (!process.env.CSC_LINK) missing.push('CSC_LINK');
        if (!process.env.CSC_KEY_PASSWORD) missing.push('CSC_KEY_PASSWORD');
    }

    return missing;
}

/**
 * 証明書ファイルの存在確認
 */
function verifyCertificateFile(certPath) {
    if (!certPath) return false;

    // Base64エンコードされた証明書の場合はスキップ
    if (certPath.startsWith('data:') || certPath.length > 1000) {
        console.log('Using Base64-encoded certificate');
        return true;
    }

    // ファイルパスの場合は存在確認
    if (fs.existsSync(certPath)) {
        console.log(`Certificate file found: ${certPath}`);
        return true;
    }

    console.error(`Certificate file not found: ${certPath}`);
    return false;
}

/**
 * Windows用コード署名設定
 */
function setupWindowsSigning() {
    const certPath = process.env.WIN_CSC_LINK;
    const certPassword = process.env.WIN_CSC_KEY_PASSWORD;

    // 証明書ファイルの検証
    if (!verifyCertificateFile(certPath)) {
        throw new Error('Windows certificate file not found or invalid');
    }

    // electron-builder用の環境変数を設定
    process.env.CSC_LINK = certPath;
    process.env.CSC_KEY_PASSWORD = certPassword;

    // カスタム署名ツールが指定されている場合
    if (process.env.WIN_SIGN_TOOL) {
        console.log(`Using custom sign tool: ${process.env.WIN_SIGN_TOOL}`);
    }

    console.log('Windows code signing configured');
    console.log('- Certificate: ' + (certPath.length > 100 ? 'Base64-encoded' : certPath));
    console.log('- Password: ***');
}

/**
 * macOS用コード署名設定
 */
function setupMacOSSigning() {
    const certPath = process.env.CSC_LINK;
    const certPassword = process.env.CSC_KEY_PASSWORD;
    const certName = process.env.CSC_NAME;

    // 証明書ファイルの検証
    if (!verifyCertificateFile(certPath)) {
        throw new Error('macOS certificate file not found or invalid');
    }

    console.log('macOS code signing configured');
    console.log('- Certificate: ' + (certPath.length > 100 ? 'Base64-encoded' : certPath));
    console.log('- Password: ***');

    if (certName) {
        console.log('- Certificate Name: ' + certName);
    }

    // 公証設定の確認
    if (process.env.APPLE_ID && process.env.APPLE_ID_PASSWORD && process.env.APPLE_TEAM_ID) {
        console.log('- Notarization: Enabled');
        console.log('  - Apple ID: ' + process.env.APPLE_ID);
        console.log('  - Team ID: ' + process.env.APPLE_TEAM_ID);
    } else {
        console.warn('- Notarization: Disabled (missing credentials)');
    }
}

/**
 * 署名設定のサマリーを出力
 */
function printSigningSummary(platform) {
    console.log('\n=== Code Signing Summary ===');
    console.log(`Platform: ${platform}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`CI: ${process.env.CI ? 'Yes' : 'No'}`);
    console.log('============================\n');
}

/**
 * メインの署名関数
 */
exports.default = async function signing(configuration) {
    const platform = configuration.platformName;

    console.log(`\n[Code Signing] Starting for platform: ${platform}`);

    // Linux はコード署名をサポートしていない
    if (platform === 'linux') {
        console.log('[Code Signing] Linux does not require code signing, skipping');
        return;
    }

    // 環境変数の検証
    const missingVars = validateEnvironmentVariables(platform);

    if (missingVars.length > 0) {
        console.warn('[Code Signing] Skipping: Missing environment variables:');
        missingVars.forEach(varName => console.warn(`  - ${varName}`));
        console.warn('[Code Signing] Set these variables to enable code signing');
        return;
    }

    try {
        // プラットフォーム別の署名設定
        if (platform === 'win') {
            setupWindowsSigning();
        } else if (platform === 'darwin') {
            setupMacOSSigning();
        }

        printSigningSummary(platform);

        console.log('[Code Signing] Configuration complete, electron-builder will perform signing');

    } catch (error) {
        console.error('[Code Signing] Configuration failed:', error.message);

        // CI環境では署名エラーで失敗させる
        if (process.env.CI === 'true') {
            throw error;
        } else {
            console.warn('[Code Signing] Continuing without code signing (development mode)');
        }
    }
};
