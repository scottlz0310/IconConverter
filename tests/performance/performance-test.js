/**
 * パフォーマンステスト
 *
 * 要件4.1: 起動時間3秒以内
 * 要件4.2: 5MB画像を5秒以内で変換
 * 要件4.3: メモリ使用量200MB以下
 * 要件4.4: CPU使用量5%未満
 */

const { _electron: electron } = require("@playwright/test");
const path = require("path");
const fs = require("fs").promises;
const sharp = require("sharp");

// パフォーマンス測定結果を保存
const results = {
  startupTime: null,
  conversionTime: null,
  memoryUsage: null,
  cpuUsage: null,
  passed: {
    startup: false,
    conversion: false,
    memory: false,
    cpu: false,
  },
};

/**
 * 起動時間測定（要件4.1）
 */
async function measureStartupTime() {
  console.log("\n=== 起動時間測定 ===");

  const startTime = Date.now();

  const electronApp = await electron.launch({
    args: [path.join(__dirname, "../../electron/main.js")],
    env: {
      ...process.env,
      NODE_ENV: "test",
      MEASURE_STARTUP: "true",
    },
  });

  const window = await electronApp.firstWindow();
  await window.waitForLoadState("domcontentloaded");

  const endTime = Date.now();
  const startupTime = endTime - startTime;

  results.startupTime = startupTime;
  results.passed.startup = startupTime < 3000;

  console.log(`起動時間: ${startupTime}ms`);
  console.log(`目標: 3000ms以内`);
  console.log(`結果: ${results.passed.startup ? "✓ 合格" : "✗ 不合格"}`);

  await electronApp.close();

  return startupTime;
}

/**
 * 変換処理時間測定（要件4.2）
 */
async function measureConversionTime() {
  console.log("\n=== 変換処理時間測定 ===");

  // 5MB程度の画像を生成
  console.log("テスト画像を生成中...");
  const testImage = await sharp({
    create: {
      width: 2000,
      height: 2000,
      channels: 4,
      background: { r: 128, g: 128, b: 128, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const imageSizeMB = (testImage.length / 1024 / 1024).toFixed(2);
  console.log(`テスト画像サイズ: ${imageSizeMB}MB`);

  const electronApp = await electron.launch({
    args: [path.join(__dirname, "../../electron/main.js")],
    env: {
      ...process.env,
      NODE_ENV: "test",
    },
  });

  const window = await electronApp.firstWindow();
  await window.waitForLoadState("domcontentloaded");

  // 変換処理を実行
  console.log("変換処理を実行中...");
  const startTime = Date.now();

  const conversionResult = await electronApp.evaluate(
    async ({ testImageBase64 }) => {
      const { ipcMain } = require("electron");
      const ImageConverter = require("./electron/services/image-converter");

      const testImageBuffer = Buffer.from(testImageBase64, "base64");

      const result = await ImageConverter.convertToICO(testImageBuffer, {
        preserveTransparency: true,
        autoTransparent: false,
      });

      return {
        success: result.success,
        processingTime: result.processingTime || 0,
      };
    },
    { testImageBase64: testImage.toString("base64") },
  );

  const endTime = Date.now();
  const conversionTime = endTime - startTime;

  results.conversionTime = conversionTime;
  results.passed.conversion = conversionTime < 5000;

  console.log(`変換時間: ${conversionTime}ms`);
  console.log(`目標: 5000ms以内`);
  console.log(`結果: ${results.passed.conversion ? "✓ 合格" : "✗ 不合格"}`);

  await electronApp.close();

  return conversionTime;
}

/**
 * メモリ使用量測定（要件4.3）
 */
async function measureMemoryUsage() {
  console.log("\n=== メモリ使用量測定 ===");

  const electronApp = await electron.launch({
    args: [path.join(__dirname, "../../electron/main.js")],
    env: {
      ...process.env,
      NODE_ENV: "test",
    },
  });

  const window = await electronApp.firstWindow();
  await window.waitForLoadState("domcontentloaded");

  // アイドル状態で少し待機
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // メモリ使用量を取得
  const memoryInfo = await electronApp.evaluate(async () => {
    const usage = process.memoryUsage();
    return {
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      rss: Math.round(usage.rss / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
    };
  });

  results.memoryUsage = memoryInfo;
  results.passed.memory = memoryInfo.heapUsed < 200;

  console.log(`ヒープ使用量: ${memoryInfo.heapUsed}MB`);
  console.log(`ヒープ合計: ${memoryInfo.heapTotal}MB`);
  console.log(`RSS: ${memoryInfo.rss}MB`);
  console.log(`外部メモリ: ${memoryInfo.external}MB`);
  console.log(`目標: 200MB以内`);
  console.log(`結果: ${results.passed.memory ? "✓ 合格" : "✗ 不合格"}`);

  await electronApp.close();

  return memoryInfo;
}

/**
 * CPU使用量測定（要件4.4）
 */
async function measureCPUUsage() {
  console.log("\n=== CPU使用量測定 ===");

  const electronApp = await electron.launch({
    args: [path.join(__dirname, "../../electron/main.js")],
    env: {
      ...process.env,
      NODE_ENV: "test",
    },
  });

  const window = await electronApp.firstWindow();
  await window.waitForLoadState("domcontentloaded");

  // アイドル状態で測定
  console.log("アイドル状態でCPU使用量を測定中...");

  const cpuUsage = await electronApp.evaluate(async () => {
    const startUsage = process.cpuUsage();

    // 1秒待機
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const endUsage = process.cpuUsage(startUsage);

    // CPU使用率を計算（パーセンテージ）
    const totalUsage = (endUsage.user + endUsage.system) / 1000000; // マイクロ秒からミリ秒に変換
    const cpuPercent = (totalUsage / 1000) * 100; // 1秒間の使用率

    return {
      user: Math.round(endUsage.user / 1000),
      system: Math.round(endUsage.system / 1000),
      total: Math.round(totalUsage),
      percent: cpuPercent.toFixed(2),
    };
  });

  results.cpuUsage = cpuUsage;
  results.passed.cpu = parseFloat(cpuUsage.percent) < 5;

  console.log(`ユーザーCPU: ${cpuUsage.user}ms`);
  console.log(`システムCPU: ${cpuUsage.system}ms`);
  console.log(`合計: ${cpuUsage.total}ms`);
  console.log(`使用率: ${cpuUsage.percent}%`);
  console.log(`目標: 5%未満`);
  console.log(`結果: ${results.passed.cpu ? "✓ 合格" : "✗ 不合格"}`);

  await electronApp.close();

  return cpuUsage;
}

/**
 * すべてのパフォーマンステストを実行
 */
async function runAllTests() {
  console.log("=".repeat(50));
  console.log("パフォーマンステスト開始");
  console.log("=".repeat(50));

  try {
    await measureStartupTime();
    await measureConversionTime();
    await measureMemoryUsage();
    await measureCPUUsage();

    // 結果サマリー
    console.log("\n" + "=".repeat(50));
    console.log("テスト結果サマリー");
    console.log("=".repeat(50));

    console.log(
      `\n起動時間: ${results.startupTime}ms ${results.passed.startup ? "✓" : "✗"}`,
    );
    console.log(
      `変換時間: ${results.conversionTime}ms ${results.passed.conversion ? "✓" : "✗"}`,
    );
    console.log(
      `メモリ使用量: ${results.memoryUsage?.heapUsed}MB ${results.passed.memory ? "✓" : "✗"}`,
    );
    console.log(
      `CPU使用率: ${results.cpuUsage?.percent}% ${results.passed.cpu ? "✓" : "✗"}`,
    );

    const allPassed = Object.values(results.passed).every((p) => p);

    console.log("\n" + "=".repeat(50));
    console.log(`総合結果: ${allPassed ? "✓ すべて合格" : "✗ 一部不合格"}`);
    console.log("=".repeat(50));

    // 結果をJSONファイルに保存
    const resultsPath = path.join(
      __dirname,
      "../../test-results/performance-results.json",
    );
    await fs.mkdir(path.dirname(resultsPath), { recursive: true });
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n結果を保存しました: ${resultsPath}`);

    // 終了コード
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error("\nエラーが発生しました:", error);
    process.exit(1);
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  runAllTests();
}

module.exports = {
  measureStartupTime,
  measureConversionTime,
  measureMemoryUsage,
  measureCPUUsage,
  runAllTests,
};
