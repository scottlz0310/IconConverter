/**
 * アイコン生成スクリプト
 * 
 * 1つのソース画像（1024x1024 PNG推奨）から、
 * 各プラットフォーム用のアイコンファイルを生成します。
 * 
 * 使用方法:
 *   node build/generate-icons.js <source-image.png>
 * 
 * 必要な依存関係:
 *   npm install --save-dev sharp png-to-ico
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// アイコンサイズ定義
const ICON_SIZES = {
    windows: [16, 32, 48, 64, 128, 256],
    mac: [16, 32, 64, 128, 256, 512, 1024],
    linux: [16, 32, 48, 64, 128, 256, 512, 1024]
};

async function generateIcons(sourcePath) {
    console.log('アイコン生成を開始します...');
    console.log(`ソース画像: ${sourcePath}`);

    // ソース画像の検証
    try {
        const metadata = await sharp(sourcePath).metadata();
        console.log(`画像サイズ: ${metadata.width}x${metadata.height}`);

        if (metadata.width < 1024 || metadata.height < 1024) {
            console.warn('警告: ソース画像は1024x1024以上を推奨します');
        }
    } catch (error) {
        console.error('エラー: ソース画像を読み込めません:', error.message);
        process.exit(1);
    }

    // 出力ディレクトリの作成
    const buildDir = path.join(__dirname);
    const iconsDir = path.join(buildDir, 'icons');

    try {
        await fs.mkdir(iconsDir, { recursive: true });
    } catch (error) {
        console.error('エラー: iconsディレクトリを作成できません:', error.message);
        process.exit(1);
    }

    // Linux用PNG生成
    console.log('\nLinux用アイコンを生成中...');
    for (const size of ICON_SIZES.linux) {
        const outputPath = path.join(iconsDir, `${size}x${size}.png`);
        await sharp(sourcePath)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toFile(outputPath);
        console.log(`  ✓ ${size}x${size}.png`);
    }

    // Windows用ICO生成（sharpでPNG生成、手動でICO結合）
    console.log('\nWindows用アイコンを生成中...');
    const icoImages = [];
    for (const size of ICON_SIZES.windows) {
        const buffer = await sharp(sourcePath)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toBuffer();
        icoImages.push(buffer);
    }

    // ICOファイルの手動生成
    const icoBuffer = await createICO(icoImages, ICON_SIZES.windows);
    const icoPath = path.join(buildDir, 'icon.ico');
    await fs.writeFile(icoPath, icoBuffer);
    console.log(`  ✓ icon.ico (${ICON_SIZES.windows.join(', ')})`);

    // macOS用ICNS生成の説明
    console.log('\nmacOS用アイコン (icon.icns) について:');
    console.log('  ICNSファイルの生成には以下のツールを使用してください:');
    console.log('  1. macOS標準ツール: iconutil');
    console.log('  2. オンラインツール: https://cloudconvert.com/png-to-icns');
    console.log('  3. npmパッケージ: png2icons');
    console.log('\n  または、以下のコマンドでpng2iconsを使用:');
    console.log(`  npx png2icons "${sourcePath}" build -icns -bc`);

    console.log('\n✓ アイコン生成が完了しました');
    console.log('\n次のステップ:');
    console.log('  1. build/icon.icns を手動で生成（macOSビルド用）');
    console.log('  2. build/installerHeader.bmp を作成（オプション、Windows NSIS用）');
    console.log('  3. build/installerSidebar.bmp を作成（オプション、Windows NSIS用）');
}

/**
 * ICOファイルを手動で生成
 */
async function createICO(images, sizes) {
    // ICOヘッダー（6バイト）
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);      // Reserved (0)
    header.writeUInt16LE(1, 2);      // Type (1 = ICO)
    header.writeUInt16LE(images.length, 4); // Count

    // 各画像のエントリー（16バイト × 画像数）
    const entries = [];
    let offset = 6 + (images.length * 16);

    for (let i = 0; i < images.length; i++) {
        const entry = Buffer.alloc(16);
        const size = sizes[i];
        const imageSize = images[i].length;

        entry.writeUInt8(size === 256 ? 0 : size, 0);  // Width
        entry.writeUInt8(size === 256 ? 0 : size, 1);  // Height
        entry.writeUInt8(0, 2);                        // Color palette
        entry.writeUInt8(0, 3);                        // Reserved
        entry.writeUInt16LE(1, 4);                     // Color planes
        entry.writeUInt16LE(32, 6);                    // Bits per pixel
        entry.writeUInt32LE(imageSize, 8);             // Image size
        entry.writeUInt32LE(offset, 12);               // Image offset

        entries.push(entry);
        offset += imageSize;
    }

    // すべてを結合
    return Buffer.concat([header, ...entries, ...images]);
}

// スクリプト実行
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error('使用方法: node build/generate-icons.js <source-image.png>');
        console.error('例: node build/generate-icons.js logo.png');
        process.exit(1);
    }

    const sourcePath = path.resolve(args[0]);

    generateIcons(sourcePath)
        .catch(error => {
            console.error('エラー:', error);
            process.exit(1);
        });
}

module.exports = { generateIcons, createICO };
