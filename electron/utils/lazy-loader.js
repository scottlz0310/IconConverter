/**
 * LazyLoader - 遅延ロードユーティリティ
 * 要件4.1: 起動時間最適化のため、重いモジュールを必要になるまでロードしない
 */

class LazyLoader {
  constructor() {
    this.modules = new Map();
    this.loadTimes = new Map();
    this.loadStartTime = Date.now();
  }

  /**
   * モジュールを遅延ロード
   * @param {string} moduleName - モジュール名
   * @returns {Promise<any>} ロードされたモジュール
   */
  async load(moduleName) {
    if (this.modules.has(moduleName)) {
      return this.modules.get(moduleName);
    }

    const startTime = Date.now();
    console.log(`[LazyLoader] Loading module: ${moduleName}`);

    try {
      const module = await this.loadModule(moduleName);
      const loadTime = Date.now() - startTime;

      this.modules.set(moduleName, module);
      this.loadTimes.set(moduleName, loadTime);

      console.log(
        `[LazyLoader] Module ${moduleName} loaded in ${loadTime}ms (${Math.round((Date.now() - this.loadStartTime) / 1000)}s since app start)`,
      );

      return module;
    } catch (error) {
      console.error(`[LazyLoader] Failed to load module ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * モジュールを同期的に遅延ロード（既にロード済みの場合のみ）
   * @param {string} moduleName - モジュール名
   * @returns {any|null} ロードされたモジュール、またはnull
   */
  getSync(moduleName) {
    return this.modules.get(moduleName) || null;
  }

  /**
   * 実際のモジュールロード処理
   * @param {string} moduleName - モジュール名
   * @returns {Promise<any>} ロードされたモジュール
   */
  async loadModule(moduleName) {
    switch (moduleName) {
      case "sharp":
        // 要件4.1: 重いモジュール（sharp等）の遅延ロード
        return require("sharp");

      case "image-converter":
        return require("../services/image-converter");

      case "file-manager":
        return require("../services/file-manager");

      case "system-integration":
        return require("../services/system-integration");

      case "tray-manager":
        return require("../services/tray-manager");

      case "validation":
        return require("./validation");

      case "ico-generator":
        return require("./ico-generator");

      default:
        throw new Error(`Unknown module: ${moduleName}`);
    }
  }

  /**
   * モジュールがロード済みかチェック
   * @param {string} moduleName - モジュール名
   * @returns {boolean} ロード済みの場合true
   */
  isLoaded(moduleName) {
    return this.modules.has(moduleName);
  }

  /**
   * プリロード - 重要なモジュールをバックグラウンドでロード
   * 要件4.1: 初回起動時のプリロード最適化
   * @param {string[]} moduleNames - プリロードするモジュール名の配列
   */
  async preload(moduleNames) {
    console.log(`[LazyLoader] Preloading ${moduleNames.length} modules...`);
    const startTime = Date.now();

    // 並列でプリロード
    const promises = moduleNames.map((moduleName) =>
      this.load(moduleName).catch((error) => {
        console.error(`[LazyLoader] Preload failed for ${moduleName}:`, error);
        return null;
      }),
    );

    await Promise.all(promises);

    const totalTime = Date.now() - startTime;
    console.log(`[LazyLoader] Preload completed in ${totalTime}ms`);
  }

  /**
   * ロード統計を取得
   * @returns {Object} ロード統計
   */
  getStats() {
    const stats = {
      totalModules: this.modules.size,
      modules: {},
      totalLoadTime: 0,
    };

    for (const [moduleName, loadTime] of this.loadTimes.entries()) {
      stats.modules[moduleName] = {
        loadTime,
        loaded: this.isLoaded(moduleName),
      };
      stats.totalLoadTime += loadTime;
    }

    return stats;
  }

  /**
   * メモリ使用量を取得
   * 要件4.3: メモリ使用量監視
   * @returns {Object} メモリ使用量情報
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      used: Math.round(usage.heapUsed / 1024 / 1024), // MB
      total: Math.round(usage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100),
      rss: Math.round(usage.rss / 1024 / 1024), // MB (Resident Set Size)
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
  }

  /**
   * モジュールをアンロード（メモリ解放）
   * @param {string} moduleName - モジュール名
   */
  unload(moduleName) {
    if (this.modules.has(moduleName)) {
      this.modules.delete(moduleName);
      console.log(`[LazyLoader] Module ${moduleName} unloaded`);

      // ガベージコレクションを促す
      if (global.gc) {
        global.gc();
      }
    }
  }

  /**
   * すべてのモジュールをクリア
   */
  clear() {
    const count = this.modules.size;
    this.modules.clear();
    this.loadTimes.clear();
    console.log(`[LazyLoader] Cleared ${count} modules`);

    // ガベージコレクションを促す
    if (global.gc) {
      global.gc();
    }
  }
}

// シングルトンインスタンス
const lazyLoader = new LazyLoader();

module.exports = lazyLoader;
