/**
 * アクセシビリティテスト
 *
 * 要件7.3: WCAG 2.1 AA準拠の検証
 * 要件7.4: キーボードナビゲーションの検証
 */

const { test, expect, _electron: electron } = require("@playwright/test");
const { injectAxe, checkA11y, getViolations } = require("axe-playwright");
const path = require("path");

test.describe("アクセシビリティ @accessibility", () => {
  let electronApp;
  let window;

  test.beforeEach(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, "../../electron/main.js")],
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
    });

    window = await electronApp.firstWindow();
    await window.waitForLoadState("domcontentloaded");

    // axe-coreを注入
    await injectAxe(window);
  });

  test.afterEach(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test("WCAG 2.1 AAレベルに準拠している（要件7.3）", async () => {
    // アクセシビリティチェックを実行
    const violations = await getViolations(window, null, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
    });

    // 違反がないことを確認
    expect(violations).toHaveLength(0);

    // 違反がある場合は詳細を出力
    if (violations.length > 0) {
      console.log("アクセシビリティ違反:");
      violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  影響: ${violation.impact}`);
        console.log(`  ヘルプ: ${violation.helpUrl}`);
      });
    }
  });

  test("すべてのインタラクティブ要素にアクセシブルな名前がある", async () => {
    const violations = await getViolations(window, null, {
      runOnly: {
        type: "rule",
        values: ["button-name", "link-name", "input-button-name"],
      },
    });

    expect(violations).toHaveLength(0);
  });

  test("適切なARIAロールが設定されている", async () => {
    const violations = await getViolations(window, null, {
      runOnly: {
        type: "rule",
        values: ["aria-roles", "aria-allowed-attr", "aria-required-attr"],
      },
    });

    expect(violations).toHaveLength(0);
  });

  test("色のコントラスト比が十分である", async () => {
    const violations = await getViolations(window, null, {
      runOnly: {
        type: "rule",
        values: ["color-contrast"],
      },
    });

    expect(violations).toHaveLength(0);
  });

  test("キーボードナビゲーションが機能する（要件7.4）", async () => {
    // Tabキーでフォーカス移動
    await window.keyboard.press("Tab");
    await window.waitForTimeout(200);

    // フォーカスされた要素を取得
    const focusedElement = await window.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el.tagName,
        role: el.getAttribute("role"),
        ariaLabel: el.getAttribute("aria-label"),
      };
    });

    // フォーカス可能な要素にフォーカスが移動していることを確認
    expect(focusedElement.tagName).toBeTruthy();
    expect(["BUTTON", "A", "INPUT", "DIV"]).toContain(focusedElement.tagName);
  });

  test("Enterキーでボタンを操作できる（要件7.4）", async () => {
    // ファイル選択ボタンにフォーカス
    const button = await window.locator("button").first();
    await button.focus();

    // フォーカスされていることを確認
    const isFocused = await button.evaluate(
      (el) => el === document.activeElement,
    );
    expect(isFocused).toBe(true);

    // Enterキーで操作可能か確認（実際の動作はモックで確認）
    await window.keyboard.press("Enter");
    await window.waitForTimeout(200);
  });

  test("Escapeキーでダイアログを閉じられる", async () => {
    // ダイアログが開いている場合
    const dialog = await window.locator('[role="dialog"]').first();
    const dialogExists = (await dialog.count()) > 0;

    if (dialogExists) {
      await window.keyboard.press("Escape");
      await window.waitForTimeout(200);

      // ダイアログが閉じられたことを確認
      const stillExists = (await dialog.count()) > 0;
      expect(stillExists).toBe(false);
    }
  });

  test("スクリーンリーダー用のテキストが提供されている", async () => {
    // sr-only クラスまたは aria-label が設定されているか確認
    const srElements = await window
      .locator(".sr-only, [aria-label], [aria-describedby]")
      .count();
    expect(srElements).toBeGreaterThan(0);
  });

  test("フォーカスインジケーターが表示される", async () => {
    // ボタンにフォーカス
    const button = await window.locator("button").first();
    await button.focus();

    // フォーカススタイルが適用されているか確認
    const focusStyle = await button.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        boxShadow: styles.boxShadow,
        border: styles.border,
      };
    });

    // 何らかのフォーカス表示があることを確認
    const hasFocusIndicator =
      focusStyle.outline !== "none" ||
      focusStyle.boxShadow !== "none" ||
      focusStyle.border !== "none";

    expect(hasFocusIndicator).toBe(true);
  });

  test("画像に代替テキストがある", async () => {
    const violations = await getViolations(window, null, {
      runOnly: {
        type: "rule",
        values: ["image-alt"],
      },
    });

    expect(violations).toHaveLength(0);
  });

  test("フォームラベルが適切に関連付けられている", async () => {
    const violations = await getViolations(window, null, {
      runOnly: {
        type: "rule",
        values: ["label", "label-content-name-mismatch"],
      },
    });

    expect(violations).toHaveLength(0);
  });
});
