/**
 * アプリケーション起動テスト
 *
 * 要件4.1: 起動時間3秒以内の検証
 * 要件7.1: UI一貫性の検証
 */

const { test, expect, _electron: electron } = require("@playwright/test");
const path = require("path");

test.describe("アプリケーション起動", () => {
  let electronApp;
  let window;

  test.beforeEach(async () => {
    // Electronアプリを起動
    const startTime = Date.now();

    electronApp = await electron.launch({
      args: [
        path.join(__dirname, "../../electron/main.js"),
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    });

    const launchTime = Date.now() - startTime;

    // 要件4.1: 起動時間3秒以内
    expect(launchTime).toBeLessThan(3000);

    // 最初のウィンドウを取得
    window = await electronApp.firstWindow();
  });

  test.afterEach(async () => {
    if (electronApp) {
      try {
        // Try to close gracefully with timeout
        await Promise.race([
          electronApp.close(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Close timeout")), 5000),
          ),
        ]);
      } catch (error) {
        // Force kill if graceful close fails
        try {
          await electronApp.process().kill();
        } catch (killError) {
          console.error("Failed to kill electron process:", killError);
        }
      }
    }
  });

  test("アプリケーションが正常に起動する", async () => {
    expect(window).toBeDefined();

    // ウィンドウのタイトルを確認
    const title = await window.title();
    expect(title).toContain("IconConverter");
  });

  test("メインウィンドウが表示される", async () => {
    // ウィンドウが表示されているか確認
    const isVisible = await window.isVisible();
    expect(isVisible).toBe(true);

    // ウィンドウサイズを確認
    const size = await window.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    expect(size.width).toBeGreaterThan(800);
    expect(size.height).toBeGreaterThan(600);
  });

  test("必要なUI要素が表示される（要件7.1）", async () => {
    // ファイルアップロード領域
    const uploadArea = await window.locator('[role="button"]').first();
    expect(await uploadArea.isVisible()).toBe(true);

    // メインコンテンツ領域
    const mainContent = await window.locator('main, [role="main"]').first();
    expect(await mainContent.isVisible()).toBe(true);
  });

  test("アプリケーションバージョンが取得できる", async () => {
    const version = await electronApp.evaluate(async ({ app }) => {
      return app.getVersion();
    });

    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
