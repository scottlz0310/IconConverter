/**
 * パフォーマンステスト
 * 要件4.2: 5MB画像を5秒以内で処理する最適化
 */

const WorkerPool = require("./worker-pool");
const sharp = require("sharp");

async function performanceTest() {
  console.log("=== パフォーマンステスト開始 ===\n");

  const workerPool = new WorkerPool(2);

  try {
    // テスト用の大きな画像を生成（5MB相当）
    console.log("1. テスト画像の生成");
    const testSizes = [
      { width: 1000, height: 1000, name: "1MB相当" },
      { width: 2000, height: 2000, name: "4MB相当" },
      { width: 2500, height: 2500, name: "6MB相当" },
    ];

    for (const size of testSizes) {
      console.log(`\n--- ${size.name} (${size.width}x${size.height}) ---`);

      // ランダムな画像データを生成
      const imageBuffer = await sharp({
        create: {
          width: size.width,
          height: size.height,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 0.5 },
        },
      })
        .png()
        .toBuffer();

      const imageSizeMB = (imageBuffer.length / 1024 / 1024).toFixed(2);
      console.log(`   画像サイズ: ${imageSizeMB}MB`);

      // 変換テスト
      const startTime = Date.now();
      const arrayBuffer = imageBuffer.buffer.slice(
        imageBuffer.byteOffset,
        imageBuffer.byteOffset + imageBuffer.byteLength,
      );

      const result = await workerPool.convertImage(arrayBuffer, {
        preserveTransparency: true,
        autoTransparent: false,
      });

      const processingTime = Date.now() - startTime;
      const processingSeconds = (processingTime / 1000).toFixed(2);

      console.log(`   変換成功: ${result.success}`);
      console.log(`   処理時間: ${processingTime}ms (${processingSeconds}秒)`);

      if (result.success) {
        const outputSizeKB = (result.data.length / 1024).toFixed(2);
        console.log(`   出力サイズ: ${outputSizeKB}KB`);
        console.log(`   アイコン数: ${result.metadata.iconCount}`);
      }

      // 要件4.2の確認
      if (parseFloat(imageSizeMB) >= 5) {
        const meetsRequirement = processingTime <= 5000;
        console.log(
          `   要件4.2準拠: ${meetsRequirement ? "✓ はい" : "✗ いいえ"} (5秒以内)`,
        );
      }

      // メモリ使用量の確認
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      console.log(`   メモリ使用量: ${heapUsedMB}MB`);

      // ガベージコレクションを実行
      if (global.gc) {
        global.gc();
        const afterGC = process.memoryUsage();
        const afterGCMB = Math.round(afterGC.heapUsed / 1024 / 1024);
        console.log(`   GC後のメモリ: ${afterGCMB}MB`);
      }
    }

    // 並列処理のパフォーマンステスト
    console.log("\n\n2. 並列処理パフォーマンステスト");
    const smallImage = await sharp({
      create: {
        width: 500,
        height: 500,
        channels: 4,
        background: { r: 0, g: 255, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const smallArrayBuffer = smallImage.buffer.slice(
      smallImage.byteOffset,
      smallImage.byteOffset + smallImage.byteLength,
    );

    const parallelStart = Date.now();
    const parallelPromises = Array(10)
      .fill(null)
      .map(() =>
        workerPool.convertImage(smallArrayBuffer, {
          preserveTransparency: true,
        }),
      );

    const parallelResults = await Promise.all(parallelPromises);
    const parallelTime = Date.now() - parallelStart;

    console.log(`   並列ジョブ数: 10`);
    console.log(`   総処理時間: ${parallelTime}ms`);
    console.log(`   平均処理時間: ${Math.round(parallelTime / 10)}ms/ジョブ`);
    console.log(
      `   成功率: ${(parallelResults.filter((r) => r.success).length / 10) * 100}%`,
    );

    // 最終統計
    console.log("\n\n3. 最終統計");
    const stats = workerPool.getStats();
    console.log(`   総ジョブ数: ${stats.totalJobs}`);
    console.log(`   完了ジョブ数: ${stats.completedJobs}`);
    console.log(`   失敗ジョブ数: ${stats.failedJobs}`);
    console.log(
      `   平均処理時間: ${Math.round(stats.averageProcessingTime)}ms`,
    );
    console.log(
      `   成功率: ${((stats.completedJobs / stats.totalJobs) * 100).toFixed(1)}%`,
    );

    console.log("\n=== パフォーマンステスト完了 ===");
  } catch (error) {
    console.error("\n✗ テストエラー:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await workerPool.shutdown();
    console.log("\n✓ ワーカープールをシャットダウンしました");
  }
}

// 実行（タイムアウト付き）
const timeout = setTimeout(() => {
  console.error("\n✗ テストがタイムアウトしました（60秒）");
  process.exit(1);
}, 60000);

performanceTest()
  .then(() => {
    clearTimeout(timeout);
    process.exit(0);
  })
  .catch((error) => {
    clearTimeout(timeout);
    console.error("Fatal error:", error);
    process.exit(1);
  });
