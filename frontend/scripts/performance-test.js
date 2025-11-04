#!/usr/bin/env node
/**
 * フロントエンドパフォーマンステスト
 *
 * 要件10.2, 10.3: フロントエンドのパフォーマンス測定
 * - 初回ロード時間を3秒以内に抑える
 * - バンドルサイズの測定
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// distディレクトリのパス
const distDir = path.join(__dirname, '..', 'dist');

/**
 * ファイルサイズを人間が読みやすい形式にフォーマット
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * ディレクトリ内のファイルサイズを再帰的に計算
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      totalSize += getDirectorySize(filePath);
    } else {
      totalSize += stats.size;
    }
  }

  return totalSize;
}

/**
 * JavaScriptファイルのサイズを集計
 */
function getJavaScriptSize(dirPath) {
  let totalSize = 0;
  const jsFiles = [];

  function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        traverse(filePath);
      } else if (file.endsWith('.js')) {
        totalSize += stats.size;
        jsFiles.push({
          name: path.relative(distDir, filePath),
          size: stats.size,
        });
      }
    }
  }

  traverse(dirPath);
  return { totalSize, jsFiles };
}

/**
 * CSSファイルのサイズを集計
 */
function getCSSSize(dirPath) {
  let totalSize = 0;
  const cssFiles = [];

  function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        traverse(filePath);
      } else if (file.endsWith('.css')) {
        totalSize += stats.size;
        cssFiles.push({
          name: path.relative(distDir, filePath),
          size: stats.size,
        });
      }
    }
  }

  traverse(dirPath);
  return { totalSize, cssFiles };
}

/**
 * メインテスト実行
 */
function runPerformanceTest() {
  console.log('🚀 フロントエンドパフォーマンステスト\n');

  // distディレクトリの存在確認
  if (!fs.existsSync(distDir)) {
    console.error('❌ distディレクトリが見つかりません。先にビルドを実行してください: pnpm build');
    process.exit(1);
  }

  // 総サイズ
  const totalSize = getDirectorySize(distDir);
  console.log(`📦 総バンドルサイズ: ${formatSize(totalSize)}`);

  // JavaScriptサイズ
  const { totalSize: jsSize, jsFiles } = getJavaScriptSize(distDir);
  console.log(`\n📜 JavaScriptサイズ: ${formatSize(jsSize)}`);
  console.log('   主要ファイル:');
  jsFiles
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .forEach((file) => {
      console.log(`   - ${file.name}: ${formatSize(file.size)}`);
    });

  // CSSサイズ
  const { totalSize: cssSize, cssFiles } = getCSSSize(distDir);
  console.log(`\n🎨 CSSサイズ: ${formatSize(cssSize)}`);
  cssFiles.forEach((file) => {
    console.log(`   - ${file.name}: ${formatSize(file.size)}`);
  });

  // パフォーマンス評価
  console.log('\n📊 パフォーマンス評価:');

  // 初回ロード時間の推定（JS + CSS）
  const initialLoadSize = jsSize + cssSize;
  // 推定: 1Mbps = 125KB/s、3G接続を想定（約1.5Mbps = 187.5KB/s）
  const estimatedLoadTime3G = initialLoadSize / (187.5 * 1024);
  // 推定: 4G接続を想定（約10Mbps = 1.25MB/s）
  const estimatedLoadTime4G = initialLoadSize / (1.25 * 1024 * 1024);

  console.log(`   初回ロードサイズ: ${formatSize(initialLoadSize)}`);
  console.log(`   推定ロード時間 (3G): ${estimatedLoadTime3G.toFixed(2)}秒`);
  console.log(`   推定ロード時間 (4G): ${estimatedLoadTime4G.toFixed(2)}秒`);

  // 要件10.2: 初回ロード時間を3秒以内に抑える
  const TARGET_LOAD_TIME = 3.0;
  if (estimatedLoadTime3G <= TARGET_LOAD_TIME) {
    console.log(`   ✅ 目標達成: 3G接続でも${TARGET_LOAD_TIME}秒以内`);
  } else {
    console.log(`   ⚠️  警告: 3G接続で${TARGET_LOAD_TIME}秒を超える可能性があります`);
  }

  // バンドルサイズの評価
  const TARGET_BUNDLE_SIZE = 500 * 1024; // 500KB
  if (initialLoadSize <= TARGET_BUNDLE_SIZE) {
    console.log(`   ✅ バンドルサイズ良好: ${formatSize(TARGET_BUNDLE_SIZE)}以下`);
  } else {
    console.log(`   ⚠️  バンドルサイズ: ${formatSize(TARGET_BUNDLE_SIZE)}を超えています`);
  }

  // コード分割の確認
  const vendorChunks = jsFiles.filter((f) => f.name.includes('vendor'));
  if (vendorChunks.length > 0) {
    console.log(`\n✅ コード分割が有効: ${vendorChunks.length}個のvendorチャンク`);
  } else {
    console.log('\n⚠️  コード分割が検出されませんでした');
  }

  console.log('\n✨ パフォーマンステスト完了\n');
}

// テスト実行
runPerformanceTest();
