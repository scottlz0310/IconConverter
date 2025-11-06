/**
 * メモリ管理サービス
 * 要件4.3, 4.4: メモリ使用量200MB未満維持、CPU使用量5%未満維持
 *
 * ガベージコレクション最適化、メモリ監視、リソース管理を提供
 */

const { app } = require("electron");
const os = require("os");

/**
 * メモリ管理クラス
 */
class MemoryManager {
  constructor() {
    this.monitoringInterval = null;
    this.gcInterval = null;
    this.stats = {
      memoryUsage: [],
      cpuUsage: [],
      gcCount: 0,
      lastGcTime: null,
      peakMemory: 0,
      averageMemory: 0,
      averageCpu: 0,
    };

    // メモリ閾値（MB）
    this.memoryThresholds = {
      warning: 150, // 警告レベル
      critical: 180, // クリティカルレベル
      target: 200, // 目標上限（要件4.3）
    };

    // CPU閾値（%）
    this.cpuThresholds = {
      warning: 3,
      critical: 4,
      target: 5, // 目標上限（要件4.4）
    };

    // 前回のCPU測定値
    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuCheck = Date.now();

    // GC設定
    this.gcConfig = {
      enabled: true,
      interval: 60000, // 1分ごと
      aggressiveThreshold: 180, // MB
      forceGcOnCritical: true,
    };
  }

  /**
   * メモリ監視を開始
   * @param {number} interval - 監視間隔（ミリ秒、デフォルト: 30秒）
   */
  startMonitoring(interval = 30000) {
    if (this.monitoringInterval) {
      console.warn("[MemoryManager] Monitoring already started");
      return;
    }

    console.log(
      `[MemoryManager] Starting memory monitoring (interval: ${interval}ms)`,
    );

    // 初回測定
    this.collectMetrics();

    // 定期的な監視
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
    }, interval);

    // 定期的なGC実行
    if (this.gcConfig.enabled && global.gc) {
      this.gcInterval = setInterval(() => {
        this.performGarbageCollection("scheduled");
      }, this.gcConfig.interval);
    }
  }

  /**
   * メモリ監視を停止
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log("[MemoryManager] Memory monitoring stopped");
    }

    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
  }

  /**
   * メトリクスを収集
   */
  collectMetrics() {
    const memory = this.getMemoryUsage();
    const cpu = this.getCpuUsage();

    // 統計に追加
    this.stats.memoryUsage.push({
      timestamp: Date.now(),
      ...memory,
    });

    this.stats.cpuUsage.push({
      timestamp: Date.now(),
      ...cpu,
    });

    // ピークメモリを更新
    if (memory.heapUsedMB > this.stats.peakMemory) {
      this.stats.peakMemory = memory.heapUsedMB;
    }

    // 古いデータを削除（最新100件のみ保持）
    if (this.stats.memoryUsage.length > 100) {
      this.stats.memoryUsage.shift();
    }
    if (this.stats.cpuUsage.length > 100) {
      this.stats.cpuUsage.shift();
    }

    // 平均値を計算
    this.calculateAverages();
  }

  /**
   * メモリ使用量を取得
   * @returns {Object} メモリ使用量情報
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();

    return {
      heapUsed: usage.heapUsed,
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotal: usage.heapTotal,
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
      external: usage.external,
      externalMB: Math.round(usage.external / 1024 / 1024),
      rss: usage.rss,
      rssMB: Math.round(usage.rss / 1024 / 1024),
      arrayBuffers: usage.arrayBuffers,
      arrayBuffersMB: Math.round(usage.arrayBuffers / 1024 / 1024),
    };
  }

  /**
   * CPU使用量を取得
   * @returns {Object} CPU使用量情報
   */
  getCpuUsage() {
    const currentUsage = process.cpuUsage(this.lastCpuUsage);
    const currentTime = Date.now();
    const timeDelta = currentTime - this.lastCpuCheck;

    // 次回の計算のために保存
    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuCheck = currentTime;

    // マイクロ秒を秒に変換
    const userSeconds = currentUsage.user / 1000000;
    const systemSeconds = currentUsage.system / 1000000;
    const totalSeconds = userSeconds + systemSeconds;

    // CPU使用率を計算（%）
    const cpuPercent = (totalSeconds / (timeDelta / 1000)) * 100;

    return {
      user: Math.round(userSeconds * 1000) / 1000,
      system: Math.round(systemSeconds * 1000) / 1000,
      total: Math.round(totalSeconds * 1000) / 1000,
      percent: Math.round(cpuPercent * 100) / 100,
    };
  }

  /**
   * システム全体のメモリ情報を取得
   * @returns {Object} システムメモリ情報
   */
  getSystemMemory() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      total: totalMemory,
      totalMB: Math.round(totalMemory / 1024 / 1024),
      free: freeMemory,
      freeMB: Math.round(freeMemory / 1024 / 1024),
      used: usedMemory,
      usedMB: Math.round(usedMemory / 1024 / 1024),
      usagePercent: Math.round((usedMemory / totalMemory) * 100),
    };
  }

  /**
   * 平均値を計算
   */
  calculateAverages() {
    if (this.stats.memoryUsage.length > 0) {
      const sum = this.stats.memoryUsage.reduce(
        (acc, m) => acc + m.heapUsedMB,
        0,
      );
      this.stats.averageMemory =
        Math.round((sum / this.stats.memoryUsage.length) * 100) / 100;
    }

    if (this.stats.cpuUsage.length > 0) {
      const sum = this.stats.cpuUsage.reduce((acc, c) => acc + c.percent, 0);
      this.stats.averageCpu =
        Math.round((sum / this.stats.cpuUsage.length) * 100) / 100;
    }
  }

  /**
   * 閾値をチェック
   */
  checkThresholds() {
    const memory = this.getMemoryUsage();
    const cpu = this.getCpuUsage();

    // メモリ閾値チェック
    if (memory.heapUsedMB >= this.memoryThresholds.critical) {
      console.warn(
        `[MemoryManager] CRITICAL: Memory usage ${memory.heapUsedMB}MB exceeds critical threshold ${this.memoryThresholds.critical}MB`,
      );

      if (this.gcConfig.forceGcOnCritical) {
        this.performGarbageCollection("critical");
      }
    } else if (memory.heapUsedMB >= this.memoryThresholds.warning) {
      console.warn(
        `[MemoryManager] WARNING: Memory usage ${memory.heapUsedMB}MB exceeds warning threshold ${this.memoryThresholds.warning}MB`,
      );

      // アグレッシブGCを実行
      if (memory.heapUsedMB >= this.gcConfig.aggressiveThreshold && global.gc) {
        this.performGarbageCollection("aggressive");
      }
    }

    // CPU閾値チェック
    if (cpu.percent >= this.cpuThresholds.critical) {
      console.warn(
        `[MemoryManager] CRITICAL: CPU usage ${cpu.percent}% exceeds critical threshold ${this.cpuThresholds.critical}%`,
      );
    } else if (cpu.percent >= this.cpuThresholds.warning) {
      console.warn(
        `[MemoryManager] WARNING: CPU usage ${cpu.percent}% exceeds warning threshold ${this.cpuThresholds.warning}%`,
      );
    }
  }

  /**
   * ガベージコレクションを実行
   * @param {string} reason - GC実行理由
   */
  performGarbageCollection(reason = "manual") {
    if (!global.gc) {
      console.warn(
        "[MemoryManager] Garbage collection not available. Run with --expose-gc flag.",
      );
      return;
    }

    const beforeMemory = this.getMemoryUsage();
    const startTime = Date.now();

    try {
      global.gc();

      const afterMemory = this.getMemoryUsage();
      const duration = Date.now() - startTime;
      const freed = beforeMemory.heapUsedMB - afterMemory.heapUsedMB;

      this.stats.gcCount++;
      this.stats.lastGcTime = Date.now();

      console.log(
        `[MemoryManager] GC completed (${reason}): freed ${freed}MB in ${duration}ms (${beforeMemory.heapUsedMB}MB -> ${afterMemory.heapUsedMB}MB)`,
      );
    } catch (error) {
      console.error("[MemoryManager] GC error:", error);
    }
  }

  /**
   * 大きなバッファを解放
   * @param {Array<Buffer>} buffers - 解放するバッファ配列
   */
  releaseBuffers(buffers) {
    if (!Array.isArray(buffers)) {
      buffers = [buffers];
    }

    let totalSize = 0;
    for (const buffer of buffers) {
      if (Buffer.isBuffer(buffer)) {
        totalSize += buffer.length;
      }
    }

    // バッファ参照をクリア
    buffers.length = 0;

    console.log(
      `[MemoryManager] Released ${Math.round(totalSize / 1024 / 1024)}MB of buffer memory`,
    );

    // GCを促進
    if (global.gc && totalSize > 10 * 1024 * 1024) {
      // 10MB以上の場合
      this.performGarbageCollection("buffer-release");
    }
  }

  /**
   * メモリクリーンアップを実行
   * 処理完了後に呼び出してメモリを解放
   */
  cleanup() {
    console.log("[MemoryManager] Performing memory cleanup...");

    const beforeMemory = this.getMemoryUsage();

    // GCを実行
    if (global.gc) {
      global.gc();
    }

    // 少し待ってから再度測定
    setTimeout(() => {
      const afterMemory = this.getMemoryUsage();
      const freed = beforeMemory.heapUsedMB - afterMemory.heapUsedMB;

      console.log(
        `[MemoryManager] Cleanup completed: freed ${freed}MB (${beforeMemory.heapUsedMB}MB -> ${afterMemory.heapUsedMB}MB)`,
      );
    }, 100);
  }

  /**
   * 統計情報を取得
   * @returns {Object} 統計情報
   */
  getStats() {
    const currentMemory = this.getMemoryUsage();
    const currentCpu = this.getCpuUsage();
    const systemMemory = this.getSystemMemory();

    return {
      current: {
        memory: currentMemory,
        cpu: currentCpu,
        system: systemMemory,
      },
      stats: {
        ...this.stats,
        memoryUsageHistory: this.stats.memoryUsage.slice(-10), // 最新10件
        cpuUsageHistory: this.stats.cpuUsage.slice(-10), // 最新10件
      },
      thresholds: {
        memory: this.memoryThresholds,
        cpu: this.cpuThresholds,
      },
      compliance: {
        memoryCompliant:
          currentMemory.heapUsedMB < this.memoryThresholds.target,
        cpuCompliant: currentCpu.percent < this.cpuThresholds.target,
        averageMemoryCompliant:
          this.stats.averageMemory < this.memoryThresholds.target,
        averageCpuCompliant: this.stats.averageCpu < this.cpuThresholds.target,
      },
    };
  }

  /**
   * レポートを生成
   * @returns {string} レポート文字列
   */
  generateReport() {
    const stats = this.getStats();

    const report = `
=== Memory Manager Report ===
Current Status:
  Memory: ${stats.current.memory.heapUsedMB}MB / ${this.memoryThresholds.target}MB (${stats.compliance.memoryCompliant ? "✓" : "✗"})
  CPU: ${stats.current.cpu.percent}% / ${this.cpuThresholds.target}% (${stats.compliance.cpuCompliant ? "✓" : "✗"})

Averages:
  Memory: ${stats.stats.averageMemory}MB (${stats.compliance.averageMemoryCompliant ? "✓" : "✗"})
  CPU: ${stats.stats.averageCpu}% (${stats.compliance.averageCpuCompliant ? "✓" : "✗"})

Peak Memory: ${stats.stats.peakMemory}MB
GC Count: ${stats.stats.gcCount}
Last GC: ${stats.stats.lastGcTime ? new Date(stats.stats.lastGcTime).toISOString() : "Never"}

System Memory:
  Total: ${stats.current.system.totalMB}MB
  Used: ${stats.current.system.usedMB}MB (${stats.current.system.usagePercent}%)
  Free: ${stats.current.system.freeMB}MB
============================
`;

    return report;
  }

  /**
   * メモリマネージャーをシャットダウン
   */
  shutdown() {
    console.log("[MemoryManager] Shutting down...");

    this.stopMonitoring();

    // 最終クリーンアップ
    this.cleanup();

    // 最終レポート
    console.log(this.generateReport());
  }
}

// シングルトンインスタンス
let instance = null;

/**
 * メモリマネージャーのシングルトンインスタンスを取得
 * @returns {MemoryManager}
 */
function getMemoryManager() {
  if (!instance) {
    instance = new MemoryManager();
  }
  return instance;
}

module.exports = {
  MemoryManager,
  getMemoryManager,
};
