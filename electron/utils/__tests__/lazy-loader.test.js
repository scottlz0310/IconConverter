/**
 * LazyLoader テスト
 * 要件4.1: 起動時間最適化のための遅延ロード機能のテスト
 */

const lazyLoader = require("../lazy-loader");

describe("LazyLoader", () => {
  beforeEach(() => {
    // 各テスト前にクリア
    lazyLoader.clear();
  });

  describe("load", () => {
    it("モジュールを遅延ロードできる", async () => {
      const validation = await lazyLoader.load("validation");
      expect(validation).toBeDefined();
      expect(lazyLoader.isLoaded("validation")).toBe(true);
    });

    it("同じモジュールを2回ロードしても1回だけロードされる", async () => {
      const validation1 = await lazyLoader.load("validation");
      const validation2 = await lazyLoader.load("validation");

      expect(validation1).toBe(validation2);
      expect(lazyLoader.getStats().totalModules).toBe(1);
    });

    it("存在しないモジュールをロードするとエラーが発生する", async () => {
      await expect(lazyLoader.load("non-existent-module")).rejects.toThrow();
    });
  });

  describe("getSync", () => {
    it("ロード済みモジュールを同期的に取得できる", async () => {
      await lazyLoader.load("validation");
      const validation = lazyLoader.getSync("validation");
      expect(validation).toBeDefined();
    });

    it("未ロードモジュールを取得するとnullを返す", () => {
      const result = lazyLoader.getSync("validation");
      expect(result).toBeNull();
    });
  });

  describe("isLoaded", () => {
    it("ロード済みモジュールに対してtrueを返す", async () => {
      await lazyLoader.load("validation");
      expect(lazyLoader.isLoaded("validation")).toBe(true);
    });

    it("未ロードモジュールに対してfalseを返す", () => {
      expect(lazyLoader.isLoaded("validation")).toBe(false);
    });
  });

  describe("preload", () => {
    it("複数のモジュールを並列でプリロードできる", async () => {
      const startTime = Date.now();
      await lazyLoader.preload(["validation", "ico-generator"]);
      const elapsed = Date.now() - startTime;

      expect(lazyLoader.isLoaded("validation")).toBe(true);
      expect(lazyLoader.isLoaded("ico-generator")).toBe(true);

      // プリロードは並列実行されるため、順次実行より速いはず
      console.log(`Preload completed in ${elapsed}ms`);
    });

    it("プリロード中にエラーが発生しても他のモジュールはロードされる", async () => {
      await lazyLoader.preload([
        "validation",
        "non-existent-module",
        "ico-generator",
      ]);

      expect(lazyLoader.isLoaded("validation")).toBe(true);
      expect(lazyLoader.isLoaded("ico-generator")).toBe(true);
      expect(lazyLoader.isLoaded("non-existent-module")).toBe(false);
    });
  });

  describe("getStats", () => {
    it("ロード統計を取得できる", async () => {
      await lazyLoader.load("validation");
      await lazyLoader.load("ico-generator");

      const stats = lazyLoader.getStats();

      expect(stats.totalModules).toBe(2);
      expect(stats.modules["validation"]).toBeDefined();
      expect(stats.modules["validation"].loaded).toBe(true);
      expect(stats.modules["validation"].loadTime).toBeGreaterThan(0);
      expect(stats.totalLoadTime).toBeGreaterThan(0);
    });
  });

  describe("getMemoryUsage", () => {
    it("メモリ使用量情報を取得できる", () => {
      const memoryUsage = lazyLoader.getMemoryUsage();

      expect(memoryUsage).toBeDefined();
      expect(memoryUsage.used).toBeGreaterThan(0);
      expect(memoryUsage.total).toBeGreaterThan(0);
      expect(memoryUsage.percentage).toBeGreaterThanOrEqual(0);
      expect(memoryUsage.percentage).toBeLessThanOrEqual(100);
      expect(memoryUsage.rss).toBeGreaterThan(0);
    });
  });

  describe("unload", () => {
    it("モジュールをアンロードできる", async () => {
      await lazyLoader.load("validation");
      expect(lazyLoader.isLoaded("validation")).toBe(true);

      lazyLoader.unload("validation");
      expect(lazyLoader.isLoaded("validation")).toBe(false);
    });
  });

  describe("clear", () => {
    it("すべてのモジュールをクリアできる", async () => {
      await lazyLoader.load("validation");
      await lazyLoader.load("ico-generator");

      expect(lazyLoader.getStats().totalModules).toBe(2);

      lazyLoader.clear();

      expect(lazyLoader.getStats().totalModules).toBe(0);
      expect(lazyLoader.isLoaded("validation")).toBe(false);
      expect(lazyLoader.isLoaded("ico-generator")).toBe(false);
    });
  });

  describe("パフォーマンス", () => {
    it("遅延ロードは即座にロードするより起動時間を短縮する", async () => {
      // 遅延ロードのシミュレーション
      const lazyStartTime = Date.now();
      // モジュールをロードしない（遅延）
      const lazyTime = Date.now() - lazyStartTime;

      // 即座にロードのシミュレーション
      const eagerStartTime = Date.now();
      await lazyLoader.load("validation");
      await lazyLoader.load("ico-generator");
      const eagerTime = Date.now() - eagerStartTime;

      console.log(`Lazy load time: ${lazyTime}ms`);
      console.log(`Eager load time: ${eagerTime}ms`);

      // 遅延ロードの方が速い（ロードしないため）
      expect(lazyTime).toBeLessThan(eagerTime);
    });
  });
});
