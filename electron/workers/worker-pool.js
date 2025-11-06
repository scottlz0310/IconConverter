/**
 * ワーカープールマネージャー
 * 要件4.2, 8.5: 画像処理をワーカープロセスに分離、パフォーマンス最適化
 *
 * Worker Threadsのプールを管理し、効率的な並列処理を実現します。
 */

const { Worker } = require("worker_threads");
const path = require("path");
const os = require("os");
const { getMemoryManager } = require("../services/memory-manager");

/**
 * ワーカープールクラス
 */
class WorkerPool {
  /**
   * コンストラクタ
   * @param {number} size - プールサイズ（デフォルト: CPU数の半分、最小2）
   * @param {number} maxQueueSize - 最大キューサイズ（デフォルト: 100）
   */
  constructor(size = null, maxQueueSize = 100) {
    // プールサイズの決定
    if (size === null) {
      const cpuCount = os.cpus().length;
      this.size = Math.max(2, Math.floor(cpuCount / 2));
    } else {
      this.size = Math.max(1, size);
    }

    this.maxQueueSize = maxQueueSize;
    this.workers = [];
    this.queue = [];
    this.activeJobs = new Map();
    this.nextId = 0;
    this.stats = {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
    };

    // メモリマネージャーを取得
    this.memoryManager = getMemoryManager();

    console.log(`[WorkerPool] Initializing pool with ${this.size} workers`);
    this.initialize();
  }

  /**
   * ワーカープールを初期化
   */
  initialize() {
    for (let i = 0; i < this.size; i++) {
      this.createWorker(i);
    }
  }

  /**
   * ワーカーを作成
   * @param {number} index - ワーカーインデックス
   */
  createWorker(index) {
    const workerPath = path.join(__dirname, "image-worker.js");

    try {
      const worker = new Worker(workerPath);

      const workerInfo = {
        id: index,
        worker,
        busy: false,
        jobCount: 0,
        lastJobTime: null,
        createdAt: Date.now(),
      };

      // メッセージハンドラー
      worker.on("message", (message) => {
        this.handleWorkerMessage(workerInfo, message);
      });

      // エラーハンドラー
      worker.on("error", (error) => {
        this.handleWorkerError(workerInfo, error);
      });

      // 終了ハンドラー
      worker.on("exit", (code) => {
        this.handleWorkerExit(workerInfo, code);
      });

      this.workers.push(workerInfo);
      console.log(`[WorkerPool] Worker ${index} created`);
    } catch (error) {
      console.error(`[WorkerPool] Failed to create worker ${index}:`, error);
    }
  }

  /**
   * ワーカーからのメッセージを処理
   */
  handleWorkerMessage(workerInfo, message) {
    const { id } = message;

    if (id === null) {
      // ワーカーからのエラー通知
      console.error("[WorkerPool] Worker error notification:", message);
      return;
    }

    const job = this.activeJobs.get(id);
    if (!job) {
      console.warn(`[WorkerPool] Received message for unknown job ${id}`);
      return;
    }

    // ジョブを完了
    this.activeJobs.delete(id);
    workerInfo.busy = false;
    workerInfo.jobCount++;
    workerInfo.lastJobTime = Date.now();

    // 統計を更新
    if (message.success) {
      this.stats.completedJobs++;
      if (message.processingTime) {
        this.stats.totalProcessingTime += message.processingTime;
        this.stats.averageProcessingTime =
          this.stats.totalProcessingTime / this.stats.completedJobs;
      }
    } else {
      this.stats.failedJobs++;
    }

    // メモリクリーンアップ（大きなデータ処理後）
    if (message.data && message.data.byteLength > 5 * 1024 * 1024) {
      // 5MB以上の場合
      this.memoryManager.cleanup();
    }

    // ジョブの結果を返す
    if (message.success) {
      job.resolve(message);
    } else {
      job.reject(new Error(message.error || "Worker processing failed"));
    }

    // 次のジョブを処理
    this.processQueue();
  }

  /**
   * ワーカーエラーを処理
   */
  handleWorkerError(workerInfo, error) {
    console.error(`[WorkerPool] Worker ${workerInfo.id} error:`, error);

    // 現在のジョブを失敗させる
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.workerId === workerInfo.id) {
        this.activeJobs.delete(jobId);
        this.stats.failedJobs++;
        job.reject(new Error(`Worker error: ${error.message}`));
      }
    }

    workerInfo.busy = false;

    // ワーカーを再作成
    this.recreateWorker(workerInfo);
  }

  /**
   * ワーカー終了を処理
   */
  handleWorkerExit(workerInfo, code) {
    console.log(
      `[WorkerPool] Worker ${workerInfo.id} exited with code ${code}`,
    );

    if (code !== 0) {
      // 異常終了の場合は再作成
      this.recreateWorker(workerInfo);
    }
  }

  /**
   * ワーカーを再作成
   */
  recreateWorker(oldWorkerInfo) {
    const index = this.workers.indexOf(oldWorkerInfo);
    if (index !== -1) {
      this.workers.splice(index, 1);
    }

    // 少し待ってから再作成
    setTimeout(() => {
      this.createWorker(oldWorkerInfo.id);
      this.processQueue();
    }, 1000);
  }

  /**
   * ジョブを実行
   * @param {string} type - ジョブタイプ
   * @param {Object} data - ジョブデータ
   * @param {number} timeout - タイムアウト（ミリ秒、デフォルト: 30秒）
   * @returns {Promise<Object>} ジョブ結果
   */
  async execute(type, data, timeout = 30000) {
    return new Promise((resolve, reject) => {
      // キューサイズチェック
      if (this.queue.length >= this.maxQueueSize) {
        reject(new Error("Worker pool queue is full"));
        return;
      }

      const id = this.nextId++;
      const job = {
        id,
        type,
        data,
        resolve,
        reject,
        createdAt: Date.now(),
        timeout,
      };

      this.activeJobs.set(id, job);
      this.queue.push(job);
      this.stats.totalJobs++;

      // タイムアウト設定
      job.timeoutId = setTimeout(() => {
        if (this.activeJobs.has(id)) {
          this.activeJobs.delete(id);
          this.stats.failedJobs++;

          // ワーカーをビジー状態から解放
          const worker = this.workers.find(
            (w) => w.busy && w.currentJobId === id,
          );
          if (worker) {
            worker.busy = false;
            worker.currentJobId = null;
          }

          reject(new Error(`Job ${id} timed out after ${timeout}ms`));
          this.processQueue();
        }
      }, timeout);

      this.processQueue();
    });
  }

  /**
   * キューを処理
   */
  processQueue() {
    if (this.queue.length === 0) {
      return;
    }

    // 利用可能なワーカーを探す
    const availableWorker = this.workers.find((w) => !w.busy);
    if (!availableWorker) {
      return;
    }

    // 次のジョブを取得
    const job = this.queue.shift();
    if (!job) {
      return;
    }

    // ワーカーにジョブを割り当て
    availableWorker.busy = true;
    availableWorker.currentJobId = job.id;
    job.workerId = availableWorker.id;

    // ワーカーにメッセージを送信
    try {
      availableWorker.worker.postMessage({
        id: job.id,
        type: job.type,
        data: job.data,
      });
    } catch (error) {
      console.error(`[WorkerPool] Failed to send message to worker:`, error);
      this.activeJobs.delete(job.id);
      this.stats.failedJobs++;
      availableWorker.busy = false;
      availableWorker.currentJobId = null;
      job.reject(error);
      this.processQueue();
    }
  }

  /**
   * 画像を変換
   * @param {ArrayBuffer} imageData - 画像データ
   * @param {Object} options - 変換オプション
   * @returns {Promise<Object>} 変換結果
   */
  async convertImage(imageData, options = {}) {
    return this.execute("convert", { imageData, options }, 30000);
  }

  /**
   * 画像を検証
   * @param {ArrayBuffer} imageData - 画像データ
   * @param {string} filename - ファイル名
   * @returns {Promise<Object>} 検証結果
   */
  async validateImage(imageData, filename) {
    return this.execute("validate", { imageData, filename }, 5000);
  }

  /**
   * プレビューを生成
   * @param {ArrayBuffer} imageData - 画像データ
   * @param {number} maxSize - 最大サイズ
   * @returns {Promise<Object>} プレビュー結果
   */
  async generatePreview(imageData, maxSize = 512) {
    return this.execute("preview", { imageData, maxSize }, 10000);
  }

  /**
   * 背景色を検出
   * @param {ArrayBuffer} imageData - 画像データ
   * @returns {Promise<Object>} 背景色情報
   */
  async detectBackground(imageData) {
    return this.execute("detect-background", { imageData }, 5000);
  }

  /**
   * バッチ変換
   * @param {Array<Object>} files - ファイル配列
   * @param {Object} options - 変換オプション
   * @returns {Promise<Object>} バッチ変換結果
   */
  async convertBatch(files, options = {}) {
    return this.execute("batch-convert", { files, options }, 60000);
  }

  /**
   * パフォーマンステスト
   * @param {ArrayBuffer} imageData - 画像データ
   * @returns {Promise<Object>} パフォーマンス統計
   */
  async performanceTest(imageData) {
    return this.execute("performance-test", { imageData }, 30000);
  }

  /**
   * ヘルスチェック
   * @returns {Promise<Object>} ヘルス情報
   */
  async healthCheck() {
    const worker = this.workers.find((w) => !w.busy);
    if (!worker) {
      throw new Error("No available workers for health check");
    }

    return this.execute("health-check", {}, 5000);
  }

  /**
   * 統計情報を取得
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.size,
      activeWorkers: this.workers.filter((w) => w.busy).length,
      availableWorkers: this.workers.filter((w) => !w.busy).length,
      queueLength: this.queue.length,
      activeJobs: this.activeJobs.size,
      workers: this.workers.map((w) => ({
        id: w.id,
        busy: w.busy,
        jobCount: w.jobCount,
        lastJobTime: w.lastJobTime,
        uptime: Date.now() - w.createdAt,
      })),
    };
  }

  /**
   * プールをシャットダウン
   * @returns {Promise<void>}
   */
  async shutdown() {
    console.log("[WorkerPool] Shutting down worker pool...");

    // すべてのアクティブジョブをキャンセル
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.timeoutId) {
        clearTimeout(job.timeoutId);
      }
      job.reject(new Error("Worker pool is shutting down"));
    }
    this.activeJobs.clear();

    // キューをクリア
    for (const job of this.queue) {
      if (job.timeoutId) {
        clearTimeout(job.timeoutId);
      }
      job.reject(new Error("Worker pool is shutting down"));
    }
    this.queue = [];

    // すべてのワーカーを終了（タイムアウト付き）
    const terminationPromises = this.workers.map(async (workerInfo) => {
      try {
        // リスナーを削除してメモリリークを防止
        workerInfo.worker.removeAllListeners();

        // 終了を試みる（タイムアウト付き）
        const terminatePromise = workerInfo.worker.terminate();
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(() => resolve(), 5000),
        );

        await Promise.race([terminatePromise, timeoutPromise]);
      } catch (error) {
        console.error(
          `[WorkerPool] Error terminating worker ${workerInfo.id}:`,
          error,
        );
      }
    });

    await Promise.all(terminationPromises);
    this.workers = [];

    // 最終メモリクリーンアップ
    this.memoryManager.cleanup();

    console.log("[WorkerPool] Worker pool shut down complete");
  }
}

module.exports = WorkerPool;
