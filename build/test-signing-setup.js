/**
 * コード署名設定テストスクリプト
 * 要件6.1: 署名検証テスト
 * 
 * ローカル環境でコード署名の設定をテストします。
 */

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
 * 環境変数のチェック
 */
function checkEnvironmentVariables(platform) {
    console.log('\n=== Environment Variables Check ===\n');

    const results = {
        platform,
        variables: {},
        warnings: [],
        errors: []
    };

    if (platform === 'win') {
        // Windows環境変数
        const winVars = {
            'WIN_CSC_LINK': process.env.WIN_CSC_LINK,
            'WIN_CSC_KEY_PASSWORD': process.env.WIN_CSC_KEY_PASSWORD,
            'WIN_SIGN_TOOL': process.env.WIN_SIGN_TOOL
        };

        results.variables = winVars;

        if (!winVars.WIN_CSC_LINK) {
            results.warnings.push('WIN_CSC_LINK not set - code signing will be skipped');
        } else {
            console.log('✓ WIN_CSC_LINK is set');

            // 証明書ファイルの存在確認
            if (!winVars.WIN_CSC_LINK.startsWith('data:') && winVars.WIN_CSC_LINK.length < 1000) {
                if (fs.existsSync(winVars.WIN_CSC_LINK)) {
                    console.log(`✓ Certificate file found: ${winVars.WIN_CSC_LINK}`);
                } else {
                    results.errors.push(`Certificate file not found: ${winVars.WIN_CSC_LINK}`);
                }
            } else {
                console.log('✓ Using Base64-encoded certificate');
            }
        }

        if (!winVars.WIN_CSC_KEY_PASSWORD) {
            results.warnings.push('WIN_CSC_KEY_PASSWORD not set - code signing will be skipped');
        } else {
            console.log('✓ WIN_CSC_KEY_PASSWORD is set');
        }

        if (winVars.WIN_SIGN_TOOL) {
            console.log(`✓ WIN_SIGN_TOOL is set: ${winVars.WIN_SIGN_TOOL}`);
        }

    } else if (platform === 'mac') {
        // macOS環境変数
        const macVars = {
            'CSC_LINK': process.env.CSC_LINK,
            'CSC_KEY_PASSWORD': process.env.CSC_KEY_PASSWORD,
            'CSC_NAME': process.env.CSC_NAME,
            'APPLE_ID': process.env.APPLE_ID,
            'APPLE_ID_PASSWORD': process.env.APPLE_ID_PASSWORD,
            'APPLE_TEAM_ID': process.env.APPLE_TEAM_ID
        };

        results.variables = macVars;

        // コード署名
        if (!macVars.CSC_LINK) {
            results.warnings.push('CSC_LINK not set - code signing will be skipped');
        } else {
            console.log('✓ CSC_LINK is set');

            // 証明書ファイルの存在確認
            if (!macVars.CSC_LINK.startsWith('data:') && macVars.CSC_LINK.length < 1000) {
                if (fs.existsSync(macVars.CSC_LINK)) {
                    console.log(`✓ Certificate file found: ${macVars.CSC_LINK}`);
                } else {
                    results.errors.push(`Certificate file not found: ${macVars.CSC_LINK}`);
                }
            } else {
                console.log('✓ Using Base64-encoded certificate');
            }
        }

        if (!macVars.CSC_KEY_PASSWORD) {
            results.warnings.push('CSC_KEY_PASSWORD not set - code signing will be skipped');
        } else {
            console.log('✓ CSC_KEY_PASSWORD is set');
        }

        if (macVars.CSC_NAME) {
            console.log(`✓ CSC_NAME is set: ${macVars.CSC_NAME}`);
        }

        // 公証
        if (!macVars.APPLE_ID) {
            results.warnings.push('APPLE_ID not set - notarization will be skipped');
        } else {
            console.log(`✓ APPLE_ID is set: ${macVars.APPLE_ID}`);
        }

        if (!macVars.APPLE_ID_PASSWORD) {
            results.warnings.push('APPLE_ID_PASSWORD not set - notarization will be skipped');
        } else {
            console.log('✓ APPLE_ID_PASSWORD is set');
        }

        if (!macVars.APPLE_TEAM_ID) {
            results.warnings.push('APPLE_TEAM_ID not set - notarization will be skipped');
        } else {
            console.log(`✓ APPLE_TEAM_ID is set: ${macVars.APPLE_TEAM_ID}`);
        }

    } else if (platform === 'linux') {
        console.log('Linux does not require code signing');
    }

    return results;
}

/**
 * 署名スクリプトの存在確認
 */
function checkSigningScripts() {
    console.log('\n=== Signing Scripts Check ===\n');

    const scripts = [
        'build/sign.js',
        'build/notarize.js',
        'build/verify-signing.js',
        'build/entitlements.mac.plist'
    ];

    const results = {
        scripts: {},
        errors: [],
        warnings: []
    };

    for (const script of scripts) {
        const scriptPath = path.join(__dirname, '..', script);
        if (fs.existsSync(scriptPath)) {
            console.log(`✓ ${script} exists`);
            results.scripts[script] = true;

            // JavaScriptファイルの構文チェック
            if (script.endsWith('.js')) {
                try {
                    require(scriptPath);
                    console.log(`  ✓ Syntax is valid`);
                } catch (error) {
                    results.errors.push(`${script}: Syntax error - ${error.message}`);
                    console.log(`  ✗ Syntax error: ${error.message}`);
                }
            }
        } else {
            results.scripts[script] = false;
            results.errors.push(`${script} not found`);
            console.log(`✗ ${script} not found`);
        }
    }

    return results;
}

/**
 * package.json設定の確認
 */
function checkPackageJsonConfig() {
    console.log('\n=== package.json Configuration Check ===\n');

    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const results = {
        config: {},
        warnings: [],
        errors: []
    };

    // build設定の確認
    if (!packageJson.build) {
        results.errors.push('build configuration not found in package.json');
        return results;
    }

    const build = packageJson.build;

    // afterSign設定
    if (build.afterSign === 'build/notarize.js') {
        console.log('✓ afterSign is configured');
        results.config.afterSign = true;
    } else {
        results.warnings.push('afterSign not configured or incorrect');
        console.log('⚠ afterSign not configured');
    }

    // beforeBuild設定
    if (build.beforeBuild === 'build/sign.js') {
        console.log('✓ beforeBuild is configured');
        results.config.beforeBuild = true;
    } else {
        results.warnings.push('beforeBuild not configured or incorrect');
        console.log('⚠ beforeBuild not configured');
    }

    // macOS設定
    if (build.mac) {
        console.log('✓ macOS build configuration found');

        if (build.mac.hardenedRuntime) {
            console.log('  ✓ hardenedRuntime is enabled');
        } else {
            results.warnings.push('hardenedRuntime not enabled for macOS');
        }

        if (build.mac.entitlements) {
            console.log(`  ✓ entitlements configured: ${build.mac.entitlements}`);
        } else {
            results.warnings.push('entitlements not configured for macOS');
        }
    }

    // Windows設定
    if (build.win) {
        console.log('✓ Windows build configuration found');

        if (build.win.signingHashAlgorithms) {
            console.log(`  ✓ signingHashAlgorithms: ${build.win.signingHashAlgorithms.join(', ')}`);
        }

        if (build.win.rfc3161TimeStampServer) {
            console.log(`  ✓ rfc3161TimeStampServer: ${build.win.rfc3161TimeStampServer}`);
        }
    }

    return results;
}

/**
 * ツールの存在確認
 */
function checkSigningTools(platform) {
    console.log('\n=== Signing Tools Check ===\n');

    const results = {
        tools: {},
        warnings: []
    };

    if (platform === 'win') {
        // signtoolの確認
        const signtoolPaths = [
            'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x64\\signtool.exe',
            'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe'
        ];

        let signtoolFound = false;
        for (const p of signtoolPaths) {
            if (fs.existsSync(p)) {
                console.log(`✓ signtool.exe found: ${p}`);
                results.tools.signtool = p;
                signtoolFound = true;
                break;
            }
        }

        if (!signtoolFound) {
            results.warnings.push('signtool.exe not found - install Windows SDK');
            console.log('⚠ signtool.exe not found');
            console.log('  Install Windows SDK: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/');
        }

    } else if (platform === 'mac') {
        // codesignの確認
        try {
            const { execSync } = require('child_process');
            execSync('which codesign', { stdio: 'pipe' });
            console.log('✓ codesign is available');
            results.tools.codesign = true;
        } catch (error) {
            results.warnings.push('codesign not found');
            console.log('✗ codesign not found');
        }

        // xcrunの確認
        try {
            const { execSync } = require('child_process');
            execSync('which xcrun', { stdio: 'pipe' });
            console.log('✓ xcrun is available');
            results.tools.xcrun = true;
        } catch (error) {
            results.warnings.push('xcrun not found');
            console.log('✗ xcrun not found');
        }
    }

    return results;
}

/**
 * サマリーの出力
 */
function printSummary(envResults, scriptsResults, configResults, toolsResults) {
    console.log('\n=== Summary ===\n');

    const allErrors = [
        ...envResults.errors,
        ...scriptsResults.errors,
        ...configResults.errors
    ];

    const allWarnings = [
        ...envResults.warnings,
        ...scriptsResults.warnings,
        ...configResults.warnings,
        ...toolsResults.warnings
    ];

    if (allErrors.length > 0) {
        console.log('Errors:');
        allErrors.forEach(error => console.log(`  ✗ ${error}`));
        console.log('');
    }

    if (allWarnings.length > 0) {
        console.log('Warnings:');
        allWarnings.forEach(warning => console.log(`  ⚠ ${warning}`));
        console.log('');
    }

    if (allErrors.length === 0 && allWarnings.length === 0) {
        console.log('✓ All checks passed!');
        console.log('✓ Code signing is properly configured');
    } else if (allErrors.length === 0) {
        console.log('⚠ Configuration has warnings but should work');
        console.log('⚠ Code signing may be skipped in some cases');
    } else {
        console.log('✗ Configuration has errors');
        console.log('✗ Please fix the errors before building');
    }

    console.log('\nFor more information, see: build/CODE_SIGNING.md');

    return allErrors.length === 0;
}

/**
 * メイン関数
 */
async function main() {
    console.log('IconConverter - Code Signing Setup Test');
    console.log('========================================\n');

    try {
        const platform = detectPlatform();
        console.log(`Platform: ${platform}\n`);

        // 各種チェックを実行
        const envResults = checkEnvironmentVariables(platform);
        const scriptsResults = checkSigningScripts();
        const configResults = checkPackageJsonConfig();
        const toolsResults = checkSigningTools(platform);

        // サマリーを出力
        const success = printSummary(envResults, scriptsResults, configResults, toolsResults);

        process.exit(success ? 0 : 1);

    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

// スクリプトとして実行された場合
if (require.main === module) {
    main();
}

module.exports = {
    checkEnvironmentVariables,
    checkSigningScripts,
    checkPackageJsonConfig,
    checkSigningTools
};
