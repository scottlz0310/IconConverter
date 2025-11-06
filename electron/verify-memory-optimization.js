/**
 * メモリ最適化機能の検証スクリプト
 * 要件4.3, 4.4: メモリ使用量200MB未満維持、CPU使用量5%未満維持
 */

const { MemoryManager } = require("./services/memory-manager");

console.log("=== メモリ最適化機能の検証 ===\n");

// メモリマネージャーを作成
const memoryManager = new MemoryManager();

console.log("1. 初期状態の確認");
console.log("-------------------");
const initialMemory = memoryManager.getMemoryUsage();
console.log(`メモリ使用量: ${initialMemory.heapUsedMB}MB`);
console.log(`目標値: ${memoryManager.memoryThresholds.target}MB`);
console.log(
  `コンプライアンス: ${initialMemory.heapUsedMB < memoryManager.memoryThresholds.target ? "✓ 合格" : "✗ 不合格"}`,
);
console.log();

console.log("2. CPU使用量の確認");
console.log("-------------------");
const initialCpu = memoryManager.getCpuUsage();
console.log(`CPU使用率: ${initialCpu.percent}%`);
console.log(`目標値: ${memoryManager.cpuThresholds.target}%`);
console.log(
  `コンプライアンス: ${initialCpu.percent < memoryManager.cpuThresholds.target ? "✓ 合格" : "✗ 不合格"}`,
);
console.log();

console.log("3. システムメモリ情報");
console.log("-------------------");
const systemMemory = memoryManager.getSystemMemory();
console.log(`総メモリ: ${systemMemory.totalMB}MB`);
console.log(`使用中: ${systemMemory.usedMB}MB (${systemMemory.usagePercent}%)`);
console.log(`空き: ${systemMemory.freeMB}MB`);
console.log();

console.log("4. 大きなバッファの作成とクリーンアップテスト");
console.log("-------------------");
const beforeAlloc = memoryManager.getMemoryUsage();
console.log(`割り当て前: ${beforeAlloc.heapUsedMB}MB`);

// 大きなバッファを作成（50MB）
const buffers = [];
for (let i = 0; i < 50; i++) {
  buffers.push(Buffer.alloc(1024 * 1024)); // 1MB each
}

const afterAlloc = memoryManager.getMemoryUsage();
console.log(`割り当て後: ${afterAlloc.heapUsedMB}MB`);
console.log(`増加量: ${afterAlloc.heapUsedMB - beforeAlloc.heapUsedMB}MB`);

// バッファを解放
memoryManager.releaseBuffers(buffers);
console.log("バッファ解放実行");

// クリーンアップ
memoryManager.cleanup();
console.log("メモリクリーンアップ実行");

// 少し待ってから測定
setTimeout(() => {
  const afterCleanup = memoryManager.getMemoryUsage();
  console.log(`クリーンアップ後: ${afterCleanup.heapUsedMB}MB`);
  console.log(`解放量: ${afterAlloc.heapUsedMB - afterCleanup.heapUsedMB}MB`);
  console.log();

  console.log("5. メトリクス収集テスト");
  console.log("-------------------");
  memoryManager.collectMetrics();
  memoryManager.collectMetrics();
  memoryManager.collectMetrics();

  console.log(
    `収集されたメモリメトリクス: ${memoryManager.stats.memoryUsage.length}件`,
  );
  console.log(
    `収集されたCPUメトリクス: ${memoryManager.stats.cpuUsage.length}件`,
  );
  console.log(`平均メモリ使用量: ${memoryManager.stats.averageMemory}MB`);
  console.log(`平均CPU使用率: ${memoryManager.stats.averageCpu}%`);
  console.log();

  console.log("6. ガベージコレクションテスト");
  console.log("-------------------");
  if (global.gc) {
    const beforeGc = memoryManager.getMemoryUsage();
    memoryManager.performGarbageCollection("test");
    const afterGc = memoryManager.getMemoryUsage();

    console.log(`GC前: ${beforeGc.heapUsedMB}MB`);
    console.log(`GC後: ${afterGc.heapUsedMB}MB`);
    console.log(`解放量: ${beforeGc.heapUsedMB - afterGc.heapUsedMB}MB`);
    console.log(`GC実行回数: ${memoryManager.stats.gcCount}`);
  } else {
    console.log("⚠ global.gc が利用できません");
    console.log("  Node.jsを --expose-gc フラグ付きで起動してください");
  }
  console.log();

  console.log("7. 統計情報の確認");
  console.log("-------------------");
  const stats = memoryManager.getStats();
  console.log(`現在のメモリ: ${stats.current.memory.heapUsedMB}MB`);
  console.log(`現在のCPU: ${stats.current.cpu.percent}%`);
  console.log(`ピークメモリ: ${stats.stats.peakMemory}MB`);
  console.log(`平均メモリ: ${stats.stats.averageMemory}MB`);
  console.log(`平均CPU: ${stats.stats.averageCpu}%`);
  console.log();

  console.log("8. コンプライアンスチェック");
  console.log("-------------------");
  console.log(
    `メモリコンプライアンス: ${stats.compliance.memoryCompliant ? "✓ 合格" : "✗ 不合格"}`,
  );
  console.log(
    `CPUコンプライアンス: ${stats.compliance.cpuCompliant ? "✓ 合格" : "✗ 不合格"}`,
  );
  console.log(
    `平均メモリコンプライアンス: ${stats.compliance.averageMemoryCompliant ? "✓ 合格" : "✗ 不合格"}`,
  );
  console.log(
    `平均CPUコンプライアンス: ${stats.compliance.averageCpuCompliant ? "✓ 合格" : "✗ 不合格"}`,
  );
  console.log();

  console.log("9. レポート生成");
  console.log("-------------------");
  const report = memoryManager.generateReport();
  console.log(report);

  console.log("=== 検証完了 ===");
  console.log();

  // 最終結果
  const finalMemory = memoryManager.getMemoryUsage();
  const finalCpu = memoryManager.getCpuUsage();

  console.log("最終結果:");
  console.log(
    `メモリ: ${finalMemory.heapUsedMB}MB / ${memoryManager.memoryThresholds.target}MB ${finalMemory.heapUsedMB < memoryManager.memoryThresholds.target ? "✓" : "✗"}`,
  );
  console.log(
    `CPU: ${finalCpu.percent}% / ${memoryManager.cpuThresholds.target}% ${finalCpu.percent < memoryManager.cpuThresholds.target ? "✓" : "✗"}`,
  );

  if (
    finalMemory.heapUsedMB < memoryManager.memoryThresholds.target &&
    finalCpu.percent < memoryManager.cpuThresholds.target
  ) {
    console.log("\n✅ すべての要件を満たしています！");
  } else {
    console.log("\n⚠ 一部の要件を満たしていません");
  }

  process.exit(0);
}, 500);
