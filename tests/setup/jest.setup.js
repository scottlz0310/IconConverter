/**
 * Jest セットアップファイル
 *
 * すべてのテスト実行前に実行される共通設定
 */

// グローバルタイムアウト設定
jest.setTimeout(10000);

// コンソール出力の抑制（必要に応じて）
if (process.env.SILENT_TESTS === "true") {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

// テスト環境のクリーンアップ
afterEach(() => {
  jest.clearAllMocks();
});
