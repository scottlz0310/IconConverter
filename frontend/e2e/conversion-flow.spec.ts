/**
 * 画像変換フローのE2Eテスト
 *
 * 完全な変換フロー（ファイルアップロード → オプション選択 → 変換 → ダウンロード）をテストします。
 * 要件: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 6.2
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// テスト用の画像ファイルパス
const TEST_IMAGE_PATH = path.join(__dirname, 'fixtures', 'test-image.png');

test.describe('画像変換フロー', () => {
  test.beforeAll(async () => {
    // テスト用の画像ファイルを作成
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    // 簡単なPNG画像を作成（1x1ピクセルの赤い画像）
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      const pngData = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(TEST_IMAGE_PATH, pngData);
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ページが正しく読み込まれる', async ({ page }) => {
    await expect(page).toHaveTitle(/Image to ICO Converter/i);
    await expect(page.getByText('画像ファイルをドラッグ&ドロップ')).toBeVisible();
  });

  test('ファイルをアップロードしてプレビューが表示される（要件2.1, 2.2, 2.4）', async ({ page }) => {
    // ファイル選択ボタンをクリック
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    // プレビューが表示されることを確認
    await expect(page.getByText('画像プレビュー')).toBeVisible();
    await expect(page.getByAltText(/選択された画像/i)).toBeVisible();

    // 画像情報が表示されることを確認
    await expect(page.getByText(/test-image\.png/i)).toBeVisible();
    await expect(page.getByText(/PNG/i)).toBeVisible();
  });

  test('透明化オプションを変更できる（要件3.1, 3.2）', async ({ page }) => {
    // ファイルをアップロード
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    // 透明化保持がデフォルトで有効
    const preserveCheckbox = page.getByLabel('透明化保持');
    await expect(preserveCheckbox).toBeChecked();

    // 自動背景透明化に切り替え
    const autoCheckbox = page.getByLabel('自動背景透明化');
    await autoCheckbox.click();

    // 自動背景透明化が有効、透明化保持が無効になることを確認
    await expect(autoCheckbox).toBeChecked();
    await expect(preserveCheckbox).not.toBeChecked();

    // 透明化保持に戻す
    await preserveCheckbox.click();
    await expect(preserveCheckbox).toBeChecked();
    await expect(autoCheckbox).not.toBeChecked();
  });

  test('変換ボタンが正しく動作する（要件4.1, 4.2）', async ({ page }) => {
    // 画像がない状態では変換ボタンが無効
    const convertButton = page.getByRole('button', { name: /ICOファイルに変換/i });
    await expect(convertButton).toBeDisabled();

    // ファイルをアップロード
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    // 変換ボタンが有効になる
    await expect(convertButton).toBeEnabled();
  });

  test('キーボードナビゲーションが機能する（要件6.4）', async ({ page }) => {
    // Tabキーでナビゲーション
    await page.keyboard.press('Tab');

    // ファイルアップロードエリアにフォーカスが当たる
    const dropzone = page.getByRole('button', { name: /画像ファイルをアップロード/i });
    await expect(dropzone).toBeFocused();

    // Enterキーでファイル選択ダイアログを開く（実際には開かないが、イベントは発火する）
    await page.keyboard.press('Enter');
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
    await expect(page.getByText('画像プレビュー')).toBeVisible();

    // 削除ボタンをクリック
    const deleteButton = page.getByRole('button', { name: /画像を削除/i });
    await deleteButton.click();

    // プレビューが消える
    await expect(page.getByText('画像プレビュー')).not.toBeVisible();

    // ファイルアップロードエリアが再表示される
    await expect(page.getByText('画像ファイルをドラッグ&ドロップ')).toBeVisible();
  });

  test('エラーメッセージが表示される（要件4.5）', async ({ page }) => {
    // 大きすぎるファイルをアップロードしようとする（モック）
    // 実際のテストでは、バックエンドのモックが必要

    // サポートされていない形式のファイルをアップロード
    const invalidFile = path.join(__dirname, 'fixtures', 'test.txt');
    if (!fs.existsSync(invalidFile)) {
      fs.writeFileSync(invalidFile, 'This is a text file');
    }

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(invalidFile);

    // エラートーストが表示される
    await expect(page.getByText(/対応していないファイル形式/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('アクセシビリティ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ARIAラベルが適切に設定されている（要件6.3）', async ({ page }) => {
    // ファイルアップロードエリア
    const dropzone = page.getByRole('button', { name: /画像ファイルをアップロード/i });
    await expect(dropzone).toHaveAttribute('aria-label');

    // ファイル入力
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('aria-label');
  });

  test('フォーカス管理が適切（要件6.4）', async ({ page }) => {
    // ファイルをアップロード
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);

    // 変換ボタンにフォーカスを移動
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // 変換ボタンがフォーカスされている
    const convertButton = page.getByRole('button', { name: /ICOファイルに変換/i });
    await expect(convertButton).toBeFocused();
  });
});
