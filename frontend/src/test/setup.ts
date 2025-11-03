/**
 * Vitestテストセットアップファイル
 *
 * テスト実行前に必要な設定を行います。
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});
