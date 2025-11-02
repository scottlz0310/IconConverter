/**
 * APIクライアントのテスト
 */

import { describe, it, expect } from 'vitest';
import { validateFile, validateFileFormat, validateFileSize, MAX_FILE_SIZE } from '../api';

describe('APIクライアント', () => {
  describe('validateFileFormat', () => {
    it('有効な画像形式を受け入れる', () => {
      const validFormats = [
        'image/png',
        'image/jpeg',
        'image/bmp',
        'image/gif',
        'image/tiff',
        'image/webp',
      ];

      validFormats.forEach((format) => {
        const file = new File([''], 'test.png', { type: format });
        expect(validateFileFormat(file)).toBe(true);
      });
    });

    it('無効な画像形式を拒否する', () => {
      const invalidFormats = ['image/svg+xml', 'application/pdf', 'text/plain'];

      invalidFormats.forEach((format) => {
        const file = new File([''], 'test.txt', { type: format });
        expect(validateFileFormat(file)).toBe(false);
      });
    });
  });

  describe('validateFileSize', () => {
    it('制限内のファイルサイズを受け入れる', () => {
      const file = new File([new ArrayBuffer(1024 * 1024)], 'test.png', {
        type: 'image/png',
      }); // 1MB
      expect(validateFileSize(file)).toBe(true);
    });

    it('制限を超えるファイルサイズを拒否する', () => {
      const file = new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], 'test.png', {
        type: 'image/png',
      });
      expect(validateFileSize(file)).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('有効なファイルを受け入れる', () => {
      const file = new File([new ArrayBuffer(1024)], 'test.png', {
        type: 'image/png',
      });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('無効な形式のファイルを拒否する', () => {
      const file = new File([new ArrayBuffer(1024)], 'test.txt', {
        type: 'text/plain',
      });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('サイズ超過のファイルを拒否する', () => {
      const file = new File([new ArrayBuffer(MAX_FILE_SIZE + 1)], 'test.png', {
        type: 'image/png',
      });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
