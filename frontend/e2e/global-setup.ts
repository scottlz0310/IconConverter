/**
 * Playwright Global Setup
 *
 * すべてのテストの前に実行されるセットアップ
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function globalSetup() {
  console.log('Setting up test fixtures...');

  // fixturesディレクトリの作成
  const fixturesDir = path.join(__dirname, 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
    console.log('Created fixtures directory');
  }

  // テスト用画像の生成
  const testImagePath = path.join(fixturesDir, 'test-image.png');
  if (!fs.existsSync(testImagePath)) {
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
    fs.writeFileSync(testImagePath, pngData);
    console.log('Created test image');
  }

  // テスト用テキストファイルの生成（エラーテスト用）
  const testTextPath = path.join(fixturesDir, 'test.txt');
  if (!fs.existsSync(testTextPath)) {
    fs.writeFileSync(testTextPath, 'This is a text file');
    console.log('Created test text file');
  }

  console.log('Test fixtures setup complete');
}
