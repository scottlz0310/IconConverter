/**
 * Vitestテストセットアップファイル
 *
 * テスト実行前に必要な設定を行います。
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// localStorageのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// matchMediaのモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// URL.createObjectURLのモック
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).URL.createObjectURL = vi.fn(() => 'blob:mock-url');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).URL.revokeObjectURL = vi.fn();

// Blobのモック
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!(global as any).Blob) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Blob = class Blob {
    constructor(_parts: BlobPart[], options?: { type?: string }) {
      this.size = 0;
      this.type = options?.type || '';
    }
    size: number;
    type: string;
  } as unknown as typeof Blob;
}

// 各テスト前にlocalStorageをクリア
beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});
