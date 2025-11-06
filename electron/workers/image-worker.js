/**
 * 画像処理ワーカープロセス
 * 要件4.2, 8.5: 5MB画像を5秒以内で処理、画像処理をワーカープロセスに分離
 *
 * Worker Threadsを使用して画像処理をメインプロセスから分離し、
 * UIのブロッキングを防止し、パフォーマンスを最適化します。
 */

const { parentPort, workerData } = require("worker_threads");
const ImageConverterService = require("../services/image-converter");

// ワーカーの初期化
console.log("[ImageWorker] Worker thread initialized");

// メモリ使用量の監視
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
    rss: Math.round(usage.rss / 1024 / 1024), // MB
  };
}

// CPU使用量の監視
let lastCpuUsage = process.cpuUsage();
function getCpuUsage() {
  const currentUsage = process.cpuUsage(lastCpuUsage);
  lastCpuUsage = process.cpuUsage();

  // マイクロ秒を秒に変換
  const userSeconds = currentUsage.user / 1000000;
  const systemSeconds = currentUsage.system / 1000000;

  return {
    user: Math.round(userSeconds * 1000) / 1000,
    system: Math.round(systemSeconds * 1000) / 1000,
    total: Math.round((userSeconds + systemSeconds) * 1000) / 1000,
  };
}

// メッセージハンドラー
parentPort.on("message", async (message) => {
  const { id, type, data } = message;

  try {
    switch (type) {
      case "convert":
        await handleConvert(id, data);
        break;

      case "validate":
        await handleValidate(id, data);
        break;

      case "preview":
        await handlePreview(id, data);
        break;

      case "detect-background":
        await handleDetectBackground(id, data);
        break;

      case "batch-convert":
        await handleBatchConvert(id, data);
        break;

      case "performance-test":
        await handlePerformanceTest(id, data);
        break;

      case "health-check":
        handleHealthCheck(id);
        break;

      default:
        parentPort.postMessage({
          id,
          success: false,
          error: `Unknown message type: ${type}`,
        });
    }
  } catch (error) {
    console.error(`[ImageWorker] Error processing message ${id}:`, error);
    parentPort.postMessage({
      id,
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

/**
 * 画像変換処理
 */
async function handleConvert(id, data) {
  const startTime = Date.now();
  const initialMemory = getMemoryUsage();

  let buffer = null;
  let result = null;

  try {
    const { imageData, options } = data;
    buffer = Buffer.from(imageData);

    console.log(
      `[ImageWorker] Converting image (${Math.round(buffer.length / 1024)}KB)...`,
    );

    // 変換実行
    result = await ImageConverterService.convertToICO(buffer, options);

    const processingTime = Date.now() - startTime;
    const finalMemory = getMemoryUsage();
    const cpuUsage = getCpuUsage();

    console.log(
      `[ImageWorker] Conversion completed in ${processingTime}ms, Memory: ${finalMemory.heapUsed}MB`,
    );

    // 結果を送信
    parentPort.postMessage({
      id,
      success: result.success,
      data: result.success
        ? result.data.buffer.slice(
            result.data.byteOffset,
            result.data.byteOffset + result.data.byteLength,
          )
        : null,
      error: result.error,
      processingTime,
      metadata: result.metadata,
      performance: {
        memoryBefore: initialMemory,
        memoryAfter: finalMemory,
        memoryDelta: finalMemory.heapUsed - initialMemory.heapUsed,
        cpuUsage,
      },
    });
  } catch (error) {
    console.error("[ImageWorker] Conversion error:", error);
    parentPort.postMessage({
      id,
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
  } finally {
    // メモリリーク防止: 大きなバッファを明示的に解放
    buffer = null;
    result = null;

    // GCを促進（大きなデータ処理後）
    if (
      global.gc &&
      data.imageData &&
      data.imageData.byteLength > 1024 * 1024
    ) {
      global.gc();
    }
  }
}

/**
 * 画像検証処理
 */
async function handleValidate(id, data) {
  const startTime = Date.now();

  try {
    const { imageData, filename } = data;
    const buffer = Buffer.from(imageData);

    const result = await ImageConverterService.validateImageFile(
      buffer,
      filename,
    );

    parentPort.postMessage({
      id,
      success: true,
      result,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    parentPort.postMessage({
      id,
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
  }
}

/**
 * プレビュー生成処理
 */
async function handlePreview(id, data) {
  const startTime = Date.now();

  try {
    const { imageData, maxSize } = data;
    const buffer = Buffer.from(imageData);

    const result = await ImageConverterService.generatePreview(buffer, maxSize);

    parentPort.postMessage({
      id,
      success: result.success,
      result,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    parentPort.postMessage({
      id,
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
  }
}

/**
 * 背景色検出処理
 */
async function handleDetectBackground(id, data) {
  const startTime = Date.now();

  try {
    const { imageData } = data;
    const buffer = Buffer.from(imageData);

    const result = await ImageConverterService.detectBackgroundColor(buffer);

    parentPort.postMessage({
      id,
      success: result.success,
      result,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    parentPort.postMessage({
      id,
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
  }
}

/**
 * バッチ変換処理
 */
async function handleBatchConvert(id, data) {
  const startTime = Date.now();
  const initialMemory = getMemoryUsage();

  let fileBuffers = null;
  let results = null;

  try {
    const { files, options } = data;

    // ファイルをBufferに変換
    fileBuffers = files.map((file) => ({
      buffer: Buffer.from(file.imageData),
      filename: file.filename,
    }));

    results = await ImageConverterService.convertBatch(fileBuffers, options);

    const processingTime = Date.now() - startTime;
    const finalMemory = getMemoryUsage();

    parentPort.postMessage({
      id,
      success: true,
      results,
      processingTime,
      performance: {
        memoryBefore: initialMemory,
        memoryAfter: finalMemory,
        memoryDelta: finalMemory.heapUsed - initialMemory.heapUsed,
      },
    });
  } catch (error) {
    parentPort.postMessage({
      id,
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
  } finally {
    // メモリリーク防止: バッファ参照をクリア
    if (fileBuffers) {
      fileBuffers.forEach((fb) => {
        fb.buffer = null;
      });
      fileBuffers = null;
    }
    results = null;

    // GCを促進
    if (global.gc) {
      global.gc();
    }
  }
}

/**
 * パフォーマンステスト
 */
async function handlePerformanceTest(id, data) {
  const startTime = Date.now();

  try {
    const { imageData } = data;
    const buffer = Buffer.from(imageData);

    const stats = await ImageConverterService.getPerformanceStats(buffer);

    parentPort.postMessage({
      id,
      success: true,
      stats,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    parentPort.postMessage({
      id,
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
    });
  }
}

/**
 * ヘルスチェック
 */
function handleHealthCheck(id) {
  const memory = getMemoryUsage();
  const cpu = getCpuUsage();

  parentPort.postMessage({
    id,
    success: true,
    health: {
      status: "healthy",
      memory,
      cpu,
      uptime: process.uptime(),
    },
  });
}

// エラーハンドリング
process.on("uncaughtException", (error) => {
  console.error("[ImageWorker] Uncaught exception:", error);
  try {
    parentPort.postMessage({
      id: null,
      success: false,
      error: "Worker uncaught exception",
      message: error.message,
    });
  } catch (e) {
    // parentPortが利用できない場合は無視
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("[ImageWorker] Unhandled rejection:", reason);
  try {
    parentPort.postMessage({
      id: null,
      success: false,
      error: "Worker unhandled rejection",
      message: String(reason),
    });
  } catch (e) {
    // parentPortが利用できない場合は無視
  }
});

// 終了シグナルのハンドリング
parentPort.on("close", () => {
  console.log("[ImageWorker] Parent port closed, exiting...");
  process.exit(0);
});

console.log("[ImageWorker] Worker ready to process messages");
