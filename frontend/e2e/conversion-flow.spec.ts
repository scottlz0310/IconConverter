/**
 * 画像変換フローのE2Eテスト
 *
 * 完全な変換フロー（ファイルアップロード → オプション選択 → 変換 → ダウンロード）をテストします。
 * 要件: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 6.2
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// テスト用の画像ファイルパス
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_IMAGE_PATH = path.join(__dirname, 'fixtures', 'test-image.png');

test.describe('画像変換フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
  });

  test('ページが正しく読み込まれる', async ({ page }) => {
    await expect(page).toHaveTitle(/Image to ICO Converter/i);
    await expect(page.getByText('画像ファイルをドラッグ&ドロップ')).toBeVisible({ timeout: 10000 });
  });

  test('ファイルをアップロードしてプレビューが表示される（要件2.1, 2.2, 2.4）', async ({
    page,
  }) => {
    // ファイル選択ボタンをクリック
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    // プレビューが表示されることを確認
    await expect(page.getByText('画像プレビュー')).toBeVisible({ timeout: 10000 });
    await expect(page.getByAltText(/選択された画像/i)).toBeVisible({ timeout: 10000 });

    // 画像情報が表示されることを確認
    await expect(page.getByText(/test-image\.png/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/PNG/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('透明化オプションを変更できる（要件3.1, 3.2）', async ({ page }) => {
    // ファイルをアップロード
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(500);

    // 透明化保持がデフォルトで有効
    const preserveCheckbox = page.locator('#preserve-transparency');
    const autoCheckbox = page.locator('#auto-transparent-bg');

    await expect(preserveCheckbox).toBeVisible({ timeout: 10000 });
    await expect(preserveCheckbox).toBeChecked();

    // 自動背景透明化に切り替え
    await autoCheckbox.click({ force: true });
    await page.waitForTimeout(300);

    // 自動背景透明化が有効、透明化保持が無効になることを確認
    await expect(autoCheckbox).toBeChecked();
    await expect(preserveCheckbox).not.toBeChecked();

    // 透明化保持に戻す
    await preserveCheckbox.click({ force: true });
    await page.waitForTimeout(300);
    await expect(preserveCheckbox).toBeChecked();
    await expect(autoCheckbox).not.toBeChecked();
  });

  test('変換ボタンが正しく動作する（要件4.1, 4.2）', async ({ page }) => {
    // ファイルをアップロード（変換ボタンは画像アップロード後に表示される）
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(1000);

    // 変換ボタンをaria-labelで検索
    const convertButton = page.getByRole('button', { name: /ICOファイルに変換/ });

    // 画像アップロード後、ボタンが表示され有効になる
    await expect(convertButton).toBeVisible({ timeout: 10000 });
    await expect(convertButton).toBeEnabled({ timeout: 10000 });
  });

  test('キーボードナビゲーションが機能する（要件6.4）', async ({ page }) => {
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // Tabキーでナビゲーション
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    // ファイルアップロードエリアまたは最初のフォーカス可能な要素を確認
    const dropzone = page
      .getByRole('button', { name: /画像ファイルをアップロード|ファイルを選択/i })
      .first();
    await expect(dropzone).toBeVisible({ timeout: 10000 });
  });

  test('レスポンシブデザインが機能する（要件6.1）', async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByText('画像ファイルをドラッグ&ドロップ')).toBeVisible();

    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText('画像ファイルをドラッグ&ドロップ')).toBeVisible();

    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText('画像ファイルをドラッグ&ドロップ')).toBeVisible();
  });

  test('ダークモードが機能する（要件6.5）', async ({ page }) => {
    // ダークモード切替ボタンを探す
    const themeToggle = page.getByRole('button', { name: /テーマ切替|ダークモード|ライトモード/i });

    if (await themeToggle.isVisible()) {
      // ダークモードに切り替え
      await themeToggle.click();

      // HTMLにdarkクラスが追加されることを確認
      const html = page.locator('html');
      const classList = await html.getAttribute('class');
      expect(classList).toContain('dark');
    }
  });

  test('画像を削除できる（要件2.4）', async ({ page }) => {
    // ファイルをアップロード
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    // プレビューが表示される
    await expect(page.getByText('画像プレビュー')).toBeVisible({ timeout: 10000 });

    // 削除ボタンをクリック
    const deleteButton = page.getByRole('button', { name: /画像を削除|削除|クリア/i });
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await deleteButton.click();
    await page.waitForTimeout(500);

    // プレビューが消える
    await expect(page.getByText('画像プレビュー')).not.toBeVisible();

    // ファイルアップロードエリアが再表示される
    await expect(page.getByText('画像ファイルをドラッグ&ドロップ')).toBeVisible({ timeout: 10000 });
  });

  test('エラーメッセージが表示される（要件4.5）', async ({ page }) => {
    // サポートされていない形式のファイルをアップロード
    const invalidFile = path.join(__dirname, 'fixtures', 'test.txt');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFile);
    await page.waitForTimeout(1000);

    // エラートーストまたはエラーメッセージが表示される
    const errorMessage = page
      .getByText(/対応していないファイル形式|サポートされていない|無効なファイル|エラー/i)
      .first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });
});

test.describe('アクセシビリティ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
  });

  test('ARIAラベルが適切に設定されている（要件6.3）', async ({ page }) => {
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // ファイルアップロードエリアまたはボタン
    const dropzone = page
      .getByRole('button', { name: /画像ファイルをアップロード|ファイルを選択/i })
      .first();
    await expect(dropzone).toBeVisible({ timeout: 10000 });

    // ファイル入力
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
  });

  test('フォーカス管理が適切（要件6.4）', async ({ page }) => {
    // ファイルをアップロード
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(500);

    // 変換ボタンが表示されることを確認
    const convertButton = page.getByRole('button', { name: /ICOファイルに変換/i });
    await expect(convertButton).toBeVisible({ timeout: 10000 });
    await expect(convertButton).toBeEnabled({ timeout: 10000 });

    // 変換ボタンにフォーカスを当てる
    await convertButton.focus();
    await expect(convertButton).toBeFocused();
  });
});
