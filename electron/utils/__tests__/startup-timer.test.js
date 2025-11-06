/**
 * StartupTimer テスト
 * 要件4.1: 起動時間3秒以内の目標達成を監視するテスト
 */

const StartupTimer = require("../startup-timer");

describe("StartupTimer", () => {
  let timer;

  beforeEach(() => {
    // 各テスト前に新しいインスタンスを作成
    const StartupTimerClass =
      require("../startup-timer").constructor || StartupTimer;
    timer = new StartupTimerClass();
  });

  describe("mark", () => {
    it("マイルストーンを記録できる", () => {
      const elapsed = timer.mark("test-milestone", "Test description");

      expect(elapsed).toBeGreaterThanOrEqual(0);
      expect(timer.milestones.has("test-milestone")).toBe(true);
    });

    it("複数のマイルストーンを記録できる", () => {
      timer.mark("milestone-1", "First milestone");
      timer.mark("milestone-2", "Second milestone");
      timer.mark("milestone-3", "Third milestone");

      expect(timer.milestones.size).toBe(3);
    });

    it("マイルストーンの経過時間が増加する", async () => {
      const elapsed1 = timer.mark("milestone-1");

      // 少し待機
      await new Promise((resolve) => setTimeout(resolve, 10));

      const elapsed2 = timer.mark("milestone-2");

      expect(elapsed2).toBeGreaterThan(elapsed1);
    });
  });

  describe("getElapsed", () => {
    it("経過時間を取得できる", async () => {
      const elapsed1 = timer.getElapsed();

      // 少し待機
      await new Promise((resolve) => setTimeout(resolve, 10));

      const elapsed2 = timer.getElapsed();

      expect(elapsed2).toBeGreaterThan(elapsed1);
      expect(elapsed2).toBeGreaterThanOrEqual(10);
    });
  });

  describe("isWithinTarget", () => {
    it("目標時間内の場合trueを返す", () => {
      // 起動直後は目標時間内のはず
      expect(timer.isWithinTarget()).toBe(true);
    });

    it("目標時間を超えた場合falseを返す", () => {
      // 目標時間を強制的に超過させる
      timer.startTime = Date.now() - 4000; // 4秒前に設定

      expect(timer.isWithinTarget()).toBe(false);
    });
  });

  describe("complete", () => {
    it("起動完了を記録し統計を返す", () => {
      timer.mark("app-init", "App initialized");
      timer.mark("window-ready", "Window ready");

      const stats = timer.complete();

      expect(stats).toBeDefined();
      expect(stats.totalTime).toBeGreaterThanOrEqual(0);
      expect(stats.targetTime).toBe(3000);
      expect(stats.withinTarget).toBeDefined();
      expect(stats.milestones).toHaveLength(3); // app-init, window-ready, complete
    });

    it("目標時間内の場合withinTargetがtrueになる", () => {
      const stats = timer.complete();

      expect(stats.withinTarget).toBe(true);
      expect(stats.totalTime).toBeLessThanOrEqual(3000);
    });

    it("目標時間を超えた場合withinTargetがfalseになる", () => {
      // 目標時間を強制的に超過させる
      timer.startTime = Date.now() - 4000; // 4秒前に設定

      const stats = timer.complete();

      expect(stats.withinTarget).toBe(false);
      expect(stats.totalTime).toBeGreaterThan(3000);
    });
  });

  describe("getStats", () => {
    it("統計情報を取得できる", () => {
      timer.mark("milestone-1", "First milestone");
      timer.mark("milestone-2", "Second milestone");

      const stats = timer.getStats();

      expect(stats).toBeDefined();
      expect(stats.startTime).toBeDefined();
      expect(stats.elapsed).toBeGreaterThanOrEqual(0);
      expect(stats.targetTime).toBe(3000);
      expect(stats.withinTarget).toBeDefined();
      expect(stats.milestones).toHaveLength(2);
    });
  });

  describe("reset", () => {
    it("タイマーをリセットできる", () => {
      timer.mark("milestone-1");
      timer.mark("milestone-2");

      expect(timer.milestones.size).toBe(2);

      timer.reset();

      expect(timer.milestones.size).toBe(0);
      expect(timer.getElapsed()).toBeLessThan(100); // リセット直後は経過時間が短い
    });
  });

  describe("パフォーマンス目標", () => {
    it("TARGET_STARTUP_TIMEが3000msに設定されている", () => {
      expect(timer.TARGET_STARTUP_TIME).toBe(3000);
    });

    it("起動時間が3秒以内であることを検証できる", () => {
      // 実際の起動シミュレーション
      timer.mark("app-init", "App initialized");

      // 少し待機（実際の起動処理をシミュレート）
      const delay = 100;
      const start = Date.now();
      while (Date.now() - start < delay) {
        // busy wait
      }

      timer.mark("window-ready", "Window ready");

      const stats = timer.complete();

      // 100ms程度の処理なので目標時間内のはず
      expect(stats.withinTarget).toBe(true);
      expect(stats.totalTime).toBeLessThan(3000);
    });
  });
});
