/**
 * プレースホルダーアイコン生成スクリプト
 * 
 * 開発・テスト用のシンプルなプレースホルダーアイコンを生成します。
 * 本番環境では、デザインされたアイコンに置き換えてください。
 * 
 * 使用方法:
 *   node build/create-placeholder-icons.js
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// アイコンサイズ定義
const SIZES = {
    windows: [16, 32, 48, 64, 128, 256],
    linux: [16, 32, 48, 64, 128, 256, 512, 1024]
};

/**
 * SVGからプレースホルダーアイコンを生成
 */
async function createPlaceholderIcon(size) {
    const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.4}" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="central">
        IC
      </text>
    </svg>
  `;

    return Buffer.from(svg);
}

/**
 * ICOファイルを生成
 */
async function createICO(images, sizes) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(images.length, 4);

    const entries = [];
    let offset = 6 + (images.length * 16);

    for (let i = 0; i < images.length; i++) {
        const entry = Buffer.alloc(16);
        const size = sizes[i];
        const imageSize = images[i].length;

        entry.writeUInt8(size === 256 ? 0 : size, 0);
        entry.writeUInt8(size === 256 ? 0 : size, 1);
        entry.writeUInt8(0, 2);
        entry.writeUInt8(0, 3);
        entry.writeUInt16LE(1, 4);
        entry.writeUInt16LE(32, 6);
        entry.writeUInt32LE(imageSize, 8);
        entry.writeUInt32LE(offset, 12);

        entries.push(entry);
        offset += imageSize;
    }

    return Buffer.concat([header, ...entries, ...images]);
}

async function generatePlaceholderIcons() {
    console.log('プレースホルダーアイコンを生成中...\n');

    const buildDir = path.join(__dirname);
    const iconsDir = path.join(buildDir, 'icons');

    // ディレクトリ作成
    await fs.mkdir(iconsDir, { recursive: true });

    // Linux用PNG生成
    console.log('Linux用アイコン:');
    for (const size of SIZES.linux) {
        const svg = await createPlaceholderIcon(size);
        const outputPath = path.join(iconsDir, `${size}x${size}.png`);

        await sharp(svg)
            .png()
            .toFile(outputPath);

        console.log(`  ✓ ${size}x${size}.png`);
    }

    // Windows用ICO生成
    console.log('\nWindows用アイコン:');
    const icoImages = [];
    for (const size of SIZES.windows) {
        const svg = await createPlaceholderIcon(size);
        const buffer = await sharp(svg).png().toBuffer();
        icoImages.push(buffer);
    }

    const icoBuffer = await createICO(icoImages, SIZES.windows);
    const icoPath = path.join(buildDir, 'icon.ico');
    await fs.writeFile(icoPath, icoBuffer);
    console.log(`  ✓ icon.ico`);

    // 1024x1024のマスター画像を生成（ICNS生成用）
    console.log('\nマスター画像:');
    const masterSvg = await createPlaceholderIcon(1024);
    const masterPath = path.join(buildDir, 'icon-master.png');
    await sharp(masterSvg).png().toFile(masterPath);
    console.log(`  ✓ icon-master.png (1024x1024)`);

    console.log('\n✓ プレースホルダーアイコンの生成が完了しました');
    console.log('\n注意:');
    console.log('  これらは開発・テスト用のプレースホルダーです。');
    console.log('  本番環境では、デザインされたアイコンに置き換えてください。');
    console.log('\nmacOS用ICNS生成:');
    console.log('  以下のコマンドでICNSファイルを生成できます:');
    console.log(`  npx png2icons "${masterPath}" build -icns -bc`);
    console.log('  または:');
    console.log(`  node build/generate-icons.js "${masterPath}"`);
}

// スクリプト実行
if (require.main === module) {
    generatePlaceholderIcons()
        .catch(error => {
            console.error('エラー:', error);
            process.exit(1);
        });
}

module.exports = { generatePlaceholderIcons, createPlaceholderIcon };
