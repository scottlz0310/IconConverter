/**
 * コード署名スクリプト
 * 
 * Windows用のコード署名を実行します。
 * 環境変数が設定されている場合のみ実行されます：
 * - WIN_CSC_LINK: 証明書ファイルのパス（.pfx）
 * - WIN_CSC_KEY_PASSWORD: 証明書のパスワード
 */

exports.default = async function signing(configuration) {
    // Windows以外はスキップ
    if (configuration.platformName !== 'win') {
        return;
    }

    // 環境変数が設定されていない場合はスキップ
    if (!process.env.WIN_CSC_LINK || !process.env.WIN_CSC_KEY_PASSWORD) {
        console.log('Skipping code signing: WIN_CSC_LINK or WIN_CSC_KEY_PASSWORD not set');
        return;
    }

    console.log('Code signing configuration detected');

    // electron-builderが自動的に環境変数を使用して署名を実行
    // CSC_LINK と CSC_KEY_PASSWORD を設定
    process.env.CSC_LINK = process.env.WIN_CSC_LINK;
    process.env.CSC_KEY_PASSWORD = process.env.WIN_CSC_KEY_PASSWORD;

    console.log('Code signing will be performed by electron-builder');
};
