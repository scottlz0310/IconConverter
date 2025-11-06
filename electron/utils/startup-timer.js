/**
 * StartupTimer - 起動時間測定ユーティリティ
 * 要件4.1: 起動時間3秒以内の目標達成を監視
 */

class StartupTimer {
  constructor() {
    this.startTime = Date.now();
    this.milestones = new Map();
    this.TARGET_STARTUP_TIME = 3000; // 3秒
  }

  /**
   * マイルストーンを記録
   * @param {string} name - マイルストーン名
   * @param {string} description - 説明
   */
  mark(name, description = "") {
    const elapsed = Date.now() - this.startTime;
    this.milestones.set(name, {
      elapsed,
      description,
      timestamp: Date.now(),
    });

    console.log(
      `[StartupTimer] ${name}: ${elapsed}ms${description ? ` - ${description}` : ""}`,
    );

    return elapsed;
  }

  /**
   * 起動完了を記録
   * @returns {Object} 起動統計
   */
  complete() {
    const totalTime = this.mark("complete", "Startup completed");

    const stats = {
      totalTime,
      targetTime: this.TARGET_STARTUP_TIME,
      withinTarget: totalTime <= this.TARGET_STARTUP_TIME,
      milestones: Array.from(this.milestones.entries()).map(([name, data]) => ({
        name,
        elapsed: data.elapsed,
        description: data.description,
      })),
    };

    // 結果をログ出力
    console.log("\n=== Startup Performance Report ===");
    console.log(`Total startup time: ${totalTime}ms`);
    console.log(`Target: ${this.TARGET_STARTUP_TIME}ms`);
    console.log(
      `Status: ${stats.withinTarget ? "✓ PASS" : "✗ FAIL (exceeded target)"}`,
    );
    console.log("\nMilestones:");

    for (const milestone of stats.milestones) {
      console.log(
        `  ${milestone.name.padEnd(20)} ${milestone.elapsed.toString().padStart(6)}ms  ${milestone.description}`,
      );
    }

    console.log("===================================\n");

    return stats;
  }

  /**
   * 経過時間を取得
   * @returns {number} 経過時間（ミリ秒）
   */
  getElapsed() {
    return Date.now() - this.startTime;
  }

  /**
   * 目標時間内かチェック
   * @returns {boolean} 目標時間内の場合true
   */
  isWithinTarget() {
    return this.getElapsed() <= this.TARGET_STARTUP_TIME;
  }

  /**
   * 統計情報を取得
   * @returns {Object} 統計情報
   */
  getStats() {
    return {
      startTime: this.startTime,
      elapsed: this.getElapsed(),
      targetTime: this.TARGET_STARTUP_TIME,
      withinTarget: this.isWithinTarget(),
      milestones: Array.from(this.milestones.entries()).map(([name, data]) => ({
        name,
        elapsed: data.elapsed,
        description: data.description,
      })),
    };
  }

  /**
   * リセット
   */
  reset() {
    this.startTime = Date.now();
    this.milestones.clear();
  }
}

// シングルトンインスタンス
const startupTimer = new StartupTimer();

module.exports = startupTimer;
