#!/usr/bin/env node

/**
 * テスト用画像ファイル作成スクリプト
 *
 * sharpを使用してテスト用の画像ファイルを生成します
 */

const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "../mocks/images");

// 画像サイズ
const WIDTH = 256;
const HEIGHT = 256;

async function createTestImages() {
  console.log("テスト用画像ファイルを作成中...");

  // 出力ディレクトリを作成
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // 青色の画像を作成（PNG）
  console.log("  - test.png を作成中...");
  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 255, alpha: 1 },
    },
  })
    .png()
    .toFile(path.join(OUTPUT_DIR, "test.png"));

  // 赤色の画像を作成（JPEG）
  console.log("  - test.jpg を作成中...");
  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .jpeg()
    .toFile(path.join(OUTPUT_DIR, "test.jpg"));

  // 緑色の画像を作成（PNG - BMPの代わり）
  console.log("  - test-green.png を作成中（BMP代替）...");
  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: { r: 0, g: 255, b: 0 },
    },
  })
    .png()
    .toFile(path.join(OUTPUT_DIR, "test-green.png"));

  // 黄色の画像を作成（GIF）
  console.log("  - test.gif を作成中...");
  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: { r: 255, g: 255, b: 0 },
    },
  })
    .gif()
    .toFile(path.join(OUTPUT_DIR, "test.gif"));

  // シアン色の画像を作成（TIFF）
  console.log("  - test.tiff を作成中...");
  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: { r: 0, g: 255, b: 255 },
    },
  })
    .tiff()
    .toFile(path.join(OUTPUT_DIR, "test.tiff"));

  // マゼンタ色の画像を作成（WebP）
  console.log("  - test.webp を作成中...");
  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 255, g: 0, b: 255, alpha: 1 },
    },
  })
    .webp()
    .toFile(path.join(OUTPUT_DIR, "test.webp"));

  // 透明度付きPNG画像を作成
  console.log("  - test-transparent.png を作成中...");
  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0.5 },
    },
  })
    .png()
    .toFile(path.join(OUTPUT_DIR, "test-transparent.png"));

  // 中サイズの画像を作成（約500KB）
  console.log("  - test-medium.png を作成中...");
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 128, g: 128, b: 128, alpha: 1 },
    },
  })
    .png({ compressionLevel: 6 })
    .toFile(path.join(OUTPUT_DIR, "test-medium.png"));

  console.log("✓ テスト用画像ファイルの作成が完了しました");
  console.log(`  出力先: ${OUTPUT_DIR}`);

  // 作成されたファイルのリストを表示
  const files = await fs.readdir(OUTPUT_DIR);
  console.log("\n作成されたファイル:");
  for (const file of files) {
    const stats = await fs.stat(path.join(OUTPUT_DIR, file));
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`  - ${file} (${sizeKB} KB)`);
  }
}

// スクリプトを実行
createTestImages()
  .then(() => {
    console.log("\n完了しました！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("エラーが発生しました:", error);
    process.exit(1);
  });
