/**
 * Playwright設定 - Electronアプリケーション用E2Eテスト
 *
 * UI操作テスト、アクセシビリティテスト、統合テストを実行
 */

const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",

  // テストタイムアウト
  timeout: 30000,
  expect: {
    timeout: 5000,
  },

  // 並列実行設定
  fullyParallel: false, // Electronアプリは1つずつ実行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Electronアプリは並列実行不可

  // レポーター設定
  reporter: [
    ["html", { outputFolder: "test-results/html" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["list"],
  ],

  // 共通設定
  use: {
    // スクリーンショット設定
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",

    // アクセシビリティテスト用
    baseURL: "file://",
  },

  // プロジェクト設定
  projects: [
    {
      name: "electron-app",
      testMatch: /.*\.spec\.js/,
      use: {
        ...devices["Desktop Chrome"],
        // Electron固有の設定はテストファイル内で行う
      },
    },
    {
      name: "accessibility",
      testMatch: /.*\.accessibility\.spec\.js/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  // 出力ディレクトリ
  outputDir: "test-results/artifacts",
});
