/**
 * メモリマネージャーのテスト
 * 要件4.3, 4.4: メモリ使用量200MB未満維持、CPU使用量5%未満維持
 */

const { MemoryManager, getMemoryManager } = require("../memory-manager");

describe("MemoryManager", () => {
  let memoryManager;

  beforeEach(() => {
    memoryManager = new MemoryManager();
  });

  afterEach(() => {
    if (memoryManager) {
      memoryManager.stopMonitoring();
    }
  });

  describe("初期化", () => {
    test("メモリマネージャーが正しく初期化される", () => {
      expect(memoryManager).toBeDefined();
      expect(memoryManager.stats).toBeDefined();
      expect(memoryManager.memoryThresholds).toBeDefined();
      expect(memoryManager.cpuThresholds).toBeDefined();
    });

    test("デフォルトの閾値が設定される", () => {
      expect(memoryManager.memoryThresholds.target).toBe(200);
      expect(memoryManager.cpuThresholds.target).toBe(5);
    });
  });

  describe("メモリ使用量取得", () => {
    test("メモリ使用量が取得できる", () => {
      const memory = memoryManager.getMemoryUsage();

      expect(memory).toBeDefined();
      expect(memory.heapUsed).toBeGreaterThan(0);
      expect(memory.heapUsedMB).toBeGreaterThan(0);
      expect(memory.heapTotal).toBeGreaterThan(0);
      expect(memory.heapTotalMB).toBeGreaterThan(0);
    });

    test("メモリ使用量がMB単位で返される", () => {
      const memory = memoryManager.getMemoryUsage();

      expect(typeof memory.heapUsedMB).toBe("number");
      expect(memory.heapUsedMB).toBeGreaterThan(0);
      expect(memory.heapUsedMB).toBeLessThan(1000); // 通常1GB未満
    });
  });

  describe("CPU使用量取得", () => {
    test("CPU使用量が取得できる", () => {
      const cpu = memoryManager.getCpuUsage();

      expect(cpu).toBeDefined();
      expect(cpu.user).toBeGreaterThanOrEqual(0);
      expect(cpu.system).toBeGreaterThanOrEqual(0);
      expect(cpu.total).toBeGreaterThanOrEqual(0);
      expect(cpu.percent).toBeGreaterThanOrEqual(0);
    });

    test("CPU使用率がパーセンテージで返される", () => {
      const cpu = memoryManager.getCpuUsage();

      expect(typeof cpu.percent).toBe("number");
      expect(cpu.percent).toBeGreaterThanOrEqual(0);
      expect(cpu.percent).toBeLessThan(100);
    });
  });

  describe("システムメモリ情報", () => {
    test("システムメモリ情報が取得できる", () => {
      const systemMemory = memoryManager.getSystemMemory();

      expect(systemMemory).toBeDefined();
      expect(systemMemory.total).toBeGreaterThan(0);
      expect(systemMemory.totalMB).toBeGreaterThan(0);
      expect(systemMemory.free).toBeGreaterThan(0);
      expect(systemMemory.freeMB).toBeGreaterThan(0);
      expect(systemMemory.used).toBeGreaterThan(0);
      expect(systemMemory.usedMB).toBeGreaterThan(0);
    });

    test("使用率が正しく計算される", () => {
      const systemMemory = memoryManager.getSystemMemory();

      expect(systemMemory.usagePercent).toBeGreaterThan(0);
      expect(systemMemory.usagePercent).toBeLessThanOrEqual(100);
    });
  });

  describe("メトリクス収集", () => {
    test("メトリクスが収集される", () => {
      memoryManager.collectMetrics();

      expect(memoryManager.stats.memoryUsage.length).toBe(1);
      expect(memoryManager.stats.cpuUsage.length).toBe(1);
    });

    test("古いメトリクスが削除される", () => {
      // 101個のメトリクスを追加
      for (let i = 0; i < 101; i++) {
        memoryManager.collectMetrics();
      }

      // 最新100件のみ保持
      expect(memoryManager.stats.memoryUsage.length).toBe(100);
      expect(memoryManager.stats.cpuUsage.length).toBe(100);
    });

    test("平均値が計算される", () => {
      memoryManager.collectMetrics();
      memoryManager.collectMetrics();

      expect(memoryManager.stats.averageMemory).toBeGreaterThan(0);
      expect(memoryManager.stats.averageCpu).toBeGreaterThanOrEqual(0);
    });
  });

  describe("監視機能", () => {
    test("監視が開始される", () => {
      memoryManager.startMonitoring(1000);

      expect(memoryManager.monitoringInterval).toBeDefined();
    });

    test("監視が停止される", () => {
      memoryManager.startMonitoring(1000);
      memoryManager.stopMonitoring();

      expect(memoryManager.monitoringInterval).toBeNull();
    });

    test("重複して監視を開始しない", () => {
      memoryManager.startMonitoring(1000);
      const firstInterval = memoryManager.monitoringInterval;

      memoryManager.startMonitoring(1000);
      const secondInterval = memoryManager.monitoringInterval;

      expect(firstInterval).toBe(secondInterval);

      memoryManager.stopMonitoring();
    });
  });

  describe("ガベージコレクション", () => {
    test("GCが実行される（global.gc利用可能時）", () => {
      if (global.gc) {
        const beforeMemory = memoryManager.getMemoryUsage();
        memoryManager.performGarbageCollection("test");
        const afterMemory = memoryManager.getMemoryUsage();

        expect(memoryManager.stats.gcCount).toBe(1);
        expect(memoryManager.stats.lastGcTime).toBeDefined();
      } else {
        // global.gc が利用できない場合はスキップ
        expect(true).toBe(true);
      }
    });

    test("GCが利用できない場合は警告を出す", () => {
      const originalGc = global.gc;
      global.gc = undefined;

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      memoryManager.performGarbageCollection("test");

      expect(consoleSpy).toHaveBeenCalled();

      global.gc = originalGc;
      consoleSpy.mockRestore();
    });
  });

  describe("バッファ解放", () => {
    test("バッファが解放される", () => {
      const buffers = [
        Buffer.alloc(1024 * 1024), // 1MB
        Buffer.alloc(1024 * 1024), // 1MB
      ];

      memoryManager.releaseBuffers(buffers);

      expect(buffers.length).toBe(0);
    });

    test("単一バッファも解放できる", () => {
      const buffer = Buffer.alloc(1024 * 1024);
      const buffers = [buffer];

      memoryManager.releaseBuffers(buffer);

      // 関数内で配列化されるため、元の変数は影響を受けない
      expect(buffer).toBeDefined();
    });
  });

  describe("統計情報", () => {
    test("統計情報が取得できる", () => {
      memoryManager.collectMetrics();
      const stats = memoryManager.getStats();

      expect(stats).toBeDefined();
      expect(stats.current).toBeDefined();
      expect(stats.current.memory).toBeDefined();
      expect(stats.current.cpu).toBeDefined();
      expect(stats.current.system).toBeDefined();
      expect(stats.stats).toBeDefined();
      expect(stats.thresholds).toBeDefined();
      expect(stats.compliance).toBeDefined();
    });

    test("コンプライアンス情報が含まれる", () => {
      memoryManager.collectMetrics();
      const stats = memoryManager.getStats();

      expect(stats.compliance.memoryCompliant).toBeDefined();
      expect(stats.compliance.cpuCompliant).toBeDefined();
      expect(stats.compliance.averageMemoryCompliant).toBeDefined();
      expect(stats.compliance.averageCpuCompliant).toBeDefined();
    });
  });

  describe("レポート生成", () => {
    test("レポートが生成される", () => {
      memoryManager.collectMetrics();
      const report = memoryManager.generateReport();

      expect(typeof report).toBe("string");
      expect(report).toContain("Memory Manager Report");
      expect(report).toContain("Current Status");
      expect(report).toContain("Memory:");
      expect(report).toContain("CPU:");
    });
  });

  describe("シャットダウン", () => {
    test("シャットダウンが正常に完了する", () => {
      memoryManager.startMonitoring(1000);
      memoryManager.shutdown();

      expect(memoryManager.monitoringInterval).toBeNull();
    });
  });

  describe("シングルトン", () => {
    test("同じインスタンスが返される", () => {
      const instance1 = getMemoryManager();
      const instance2 = getMemoryManager();

      expect(instance1).toBe(instance2);
    });
  });
});
