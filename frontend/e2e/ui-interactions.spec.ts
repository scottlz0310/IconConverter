/**
 * UI インタラクションのE2Eテスト
 *
 * バックエンドなしでテストできるUI要素のテストです。
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// テスト用の画像ファイルパス
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_IMAGE_PATH = path.join(__dirname, 'fixtures', 'test-image.png');

test.describe('UI インタラクション', () => {
  test.beforeAll(async () => {
    const fixturesDir = path.join(__dirname, 'fixtures');
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }

    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      // 100x100の赤いPNG画像
      const pngData = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAA' +
        'AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZ' +
        'cwAADsMAAA7DAcdvqGQAAABfSURBVHhe7dAxAQAADMOg+Tfd' +
        'SXYQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAw' +
        'BgAAAP//AwBkpwAB8QAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(TEST_IMAGE_PATH, pngData);
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForLoadState('domcontentloaded');
  });

  test('アプリケーションが正しく読み込まれる', async ({ page }) => {
    // タイトルを確認
    await expect(page).toHaveTitle(/Image to ICO Converter/i);

    // メインコンテンツが表示される
    await expect(page.getByText('画像ファイルをドラッグ&ドロップ')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /ファイルを選択/i })).toBeVisible({ timeout: 10000 });
  });

  test('ファイルアップロードUIが機能する', async ({ page }) => {
    // ファイル入力要素が存在する
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // ファイルを選択
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(500);

    // プレビューが表示される
    await expect(page.getByText('画像プレビュー')).toBeVisible({ timeout: 10000 });
    await expect(page.getByAltText(/選択された画像/i)).toBeVisible({ timeout: 10000 });
  });

  test('変換オプションが表示され操作できる', async ({ page }) => {
    // ファイルをアップロード（オプションは画像アップロード後に表示される）
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_IMAGE_PATH);
    await page.waitForTimeout(1000);

    // オプションのチェックボックスが表示される
    const preserveCheckbox = page.locator('#preserve-transparency');
    const autoCheckbox = page.locator('#auto-transparent-bg');

    await expect(preserveCheckbox).toBeVisible({ timeout: 10000 });
    await expect(autoCheckbox).toBeVisible({ timeout: 10000 });

    // デフォルトで透明化保持が選択されている
    await expect(preserveCheckbox).toBeChecked();
    await expect(autoCheckbox).not.toBeChecked();
  });

  test('変換ボタンの状態が正しく変化する', async ({ page }) => {
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

  test('レスポンシブレイアウトが機能する', async ({ page }) => {
    // デスクトップ
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(300);
    await expect(page.getByText('画像ファイルをドラッグ&ドロップ')).toBeVisible({ timeout: 10000 });

    // モバイル
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await expect(page.getByText('画像ファイルをドラッグ&ドロップ')).toBeVisible({ timeout: 10000 });
  });
});
