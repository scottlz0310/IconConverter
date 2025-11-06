/**
 * ワーカープールのテスト
 * 要件4.2, 8.5: ワーカープロセスの動作確認
 */

const WorkerPool = require("../worker-pool");
const fs = require("fs");
const path = require("path");

describe("WorkerPool", () => {
  let workerPool;

  beforeEach(() => {
    // 小さいプールサイズでテスト
    workerPool = new WorkerPool(2);
  });

  afterEach(async () => {
    if (workerPool) {
      await workerPool.shutdown();
    }
  });

  describe("初期化", () => {
    test("ワーカープールが正しく初期化される", () => {
      const stats = workerPool.getStats();
      expect(stats.poolSize).toBe(2);
      expect(stats.availableWorkers).toBe(2);
      expect(stats.activeWorkers).toBe(0);
    });

    test("統計情報が正しく取得できる", () => {
      const stats = workerPool.getStats();
      expect(stats).toHaveProperty("totalJobs");
      expect(stats).toHaveProperty("completedJobs");
      expect(stats).toHaveProperty("failedJobs");
      expect(stats).toHaveProperty("queueLength");
      expect(stats).toHaveProperty("workers");
    });
  });

  describe("ヘルスチェック", () => {
    test("ヘルスチェックが成功する", async () => {
      const health = await workerPool.healthCheck();
      expect(health.success).toBe(true);
      expect(health.health.status).toBe("healthy");
      expect(health.health).toHaveProperty("memory");
      expect(health.health).toHaveProperty("cpu");
    });
  });

  describe("画像検証", () => {
    test("有効なPNG画像を検証できる", async () => {
      // 1x1の透明PNG画像を作成
      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      );

      const result = await workerPool.validateImage(
        pngBuffer.buffer.slice(
          pngBuffer.byteOffset,
          pngBuffer.byteOffset + pngBuffer.byteLength,
        ),
        "test.png",
      );

      expect(result.success).toBe(true);
      expect(result.result.isValid).toBe(true);
      expect(result.result.format).toBe("image/png");
    }, 10000);

    test("無効なデータを拒否する", async () => {
      const invalidBuffer = Buffer.from("invalid image data");

      const result = await workerPool.validateImage(
        invalidBuffer.buffer.slice(
          invalidBuffer.byteOffset,
          invalidBuffer.byteOffset + invalidBuffer.byteLength,
        ),
        "test.png",
      );

      expect(result.success).toBe(true);
      expect(result.result.isValid).toBe(false);
    }, 10000);
  });

  describe("並列処理", () => {
    test("複数のジョブを並列処理できる", async () => {
      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      );

      const arrayBuffer = pngBuffer.buffer.slice(
        pngBuffer.byteOffset,
        pngBuffer.byteOffset + pngBuffer.byteLength,
      );

      // 複数のジョブを同時に実行
      const promises = [
        workerPool.validateImage(arrayBuffer, "test1.png"),
        workerPool.validateImage(arrayBuffer, "test2.png"),
        workerPool.validateImage(arrayBuffer, "test3.png"),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.result.isValid).toBe(true);
      });

      const stats = workerPool.getStats();
      expect(stats.completedJobs).toBe(3);
    }, 15000);
  });

  describe("エラーハンドリング", () => {
    test("タイムアウトを正しく処理する", async () => {
      // 非常に短いタイムアウトでテスト
      await expect(
        workerPool.execute("convert", { imageData: new ArrayBuffer(0) }, 1),
      ).rejects.toThrow("timed out");
    }, 10000);

    test("無効なジョブタイプを拒否する", async () => {
      await expect(
        workerPool.execute("invalid-type", {}, 5000),
      ).rejects.toThrow();
    }, 10000);
  });

  describe("統計情報", () => {
    test("ジョブ実行後に統計が更新される", async () => {
      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      );

      const arrayBuffer = pngBuffer.buffer.slice(
        pngBuffer.byteOffset,
        pngBuffer.byteOffset + pngBuffer.byteLength,
      );

      await workerPool.validateImage(arrayBuffer, "test.png");

      const stats = workerPool.getStats();
      expect(stats.totalJobs).toBeGreaterThan(0);
      expect(stats.completedJobs).toBeGreaterThan(0);
    }, 10000);
  });

  describe("シャットダウン", () => {
    test("正常にシャットダウンできる", async () => {
      await workerPool.shutdown();

      const stats = workerPool.getStats();
      expect(stats.poolSize).toBe(2);
      expect(stats.workers).toHaveLength(0);
    });

    test("シャットダウン後はジョブを拒否する", async () => {
      await workerPool.shutdown();

      const pngBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      );

      await expect(
        workerPool.validateImage(
          pngBuffer.buffer.slice(
            pngBuffer.byteOffset,
            pngBuffer.byteOffset + pngBuffer.byteLength,
          ),
          "test.png",
        ),
      ).rejects.toThrow();
    });
  });
});
