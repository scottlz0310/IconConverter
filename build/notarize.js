/**
 * macOS公証（Notarization）スクリプト
 * 
 * 環境変数が設定されている場合のみ実行されます：
 * - APPLE_ID: Apple ID
 * - APPLE_ID_PASSWORD: アプリ固有パスワード
 * - APPLE_TEAM_ID: チームID
 */

const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
    const { electronPlatformName, appOutDir } = context;

    // macOS以外はスキップ
    if (electronPlatformName !== 'darwin') {
        return;
    }

    // 環境変数が設定されていない場合はスキップ
    if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD || !process.env.APPLE_TEAM_ID) {
        console.log('Skipping notarization: APPLE_ID, APPLE_ID_PASSWORD, or APPLE_TEAM_ID not set');
        return;
    }

    const appName = context.packager.appInfo.productFilename;
    const appPath = `${appOutDir}/${appName}.app`;

    console.log(`Notarizing ${appPath}...`);

    try {
        await notarize({
            appPath,
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_ID_PASSWORD,
            teamId: process.env.APPLE_TEAM_ID,
        });

        console.log('Notarization successful');
    } catch (error) {
        console.error('Notarization failed:', error);
        throw error;
    }
};
