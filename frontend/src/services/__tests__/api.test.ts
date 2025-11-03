/**
 * APIクライアントのテスト
 */

import { describe, it, expect, vi } from 'vitest';
import axios, { AxiosError } from 'axios';
import {
  validateFile,
  validateFileFormat,
  validateFileSize,
  MAX_FILE_SIZE,
  parseApiError,
  convertImage,
  checkHealth,
} from '../api';
import type { ErrorResponse, ConversionOptions } from '../../types';

// axiosをモック
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        post: vi.fn(),
        get: vi.fn(),
        interceptors: {
          request: { use: vi.fn(), eject: vi.fn() },
          response: { use: vi.fn(), eject: vi.fn() },
        },
      })),
      isAxiosError: vi.fn(),
    },
  };
});

const mockedAxios = vi.mocked(axios, true);

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
      expect(result.error).toContain('MB');
    });
  });

  describe('parseApiError', () => {
    it('タイムアウトエラーを解析する', () => {
      const error = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        response: undefined,
      } as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);
      const message = parseApiError(error);
      expect(message).toContain('タイムアウト');
    });

    it('ネットワークエラーを解析する', () => {
      const error = {
        isAxiosError: true,
        response: undefined,
      } as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);
      const message = parseApiError(error);
      expect(message).toContain('ネットワークエラー');
    });

    it('413エラー（ファイルサイズ超過）を解析する', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 413,
          data: {},
        },
      } as AxiosError<ErrorResponse>;

      mockedAxios.isAxiosError.mockReturnValue(true);
      const message = parseApiError(error);
      expect(message).toContain('ファイルサイズが大きすぎます');
    });

    it('415エラー（無効な形式）を解析する', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 415,
          data: {},
        },
      } as AxiosError<ErrorResponse>;

      mockedAxios.isAxiosError.mockReturnValue(true);
      const message = parseApiError(error);
      expect(message).toContain('対応していないファイル形式');
    });

    it('429エラー（レート制限）を解析する', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 429,
          data: {},
        },
      } as AxiosError<ErrorResponse>;

      mockedAxios.isAxiosError.mockReturnValue(true);
      const message = parseApiError(error);
      expect(message).toContain('リクエスト数が制限');
    });

    it('500エラー（サーバーエラー）を解析する', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
        },
      } as AxiosError<ErrorResponse>;

      mockedAxios.isAxiosError.mockReturnValue(true);
      const message = parseApiError(error);
      expect(message).toContain('サーバーエラー');
    });

    it('400エラー（バリデーションエラー）を解析する', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            detail: 'カスタムエラーメッセージ',
          },
        },
      } as AxiosError<ErrorResponse>;

      mockedAxios.isAxiosError.mockReturnValue(true);
      const message = parseApiError(error);
      expect(message).toBe('カスタムエラーメッセージ');
    });

    it('エラーコード付きエラーを解析する', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            error_code: 'INVALID_FORMAT',
            detail: 'Invalid format',
          },
        },
      } as AxiosError<ErrorResponse>;

      mockedAxios.isAxiosError.mockReturnValue(true);
      const message = parseApiError(error);
      expect(message).toContain('対応していないファイル形式');
    });

    it('未知のエラーを解析する', () => {
      const error = new Error('Unknown error');

      mockedAxios.isAxiosError.mockReturnValue(false);
      const message = parseApiError(error);
      expect(message).toContain('予期しないエラー');
    });

    it('400エラー（detailなし）を解析する', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {},
        },
      } as AxiosError<ErrorResponse>;

      mockedAxios.isAxiosError.mockReturnValue(true);
      const message = parseApiError(error);
      expect(message).toContain('画像の変換に失敗');
    });

    it('レスポンスのdetailメッセージを使用する', () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {
            detail: 'リソースが見つかりません',
          },
        },
      } as AxiosError<ErrorResponse>;

      mockedAxios.isAxiosError.mockReturnValue(true);
      const message = parseApiError(error);
      expect(message).toBe('リソースが見つかりません');
    });
  });

  describe('convertImage', () => {
    it('画像を正常に変換する', async () => {
      const mockBlob = new Blob(['ico data'], { type: 'image/x-icon' });
      const mockPost = vi.fn().mockResolvedValue({ data: mockBlob });

      mockedAxios.create.mockReturnValue({
        post: mockPost,
        get: vi.fn(),
        interceptors: {
          request: { use: vi.fn(), eject: vi.fn() },
          response: { use: vi.fn(), eject: vi.fn() },
        },
      } as unknown as ReturnType<typeof axios.create>);

      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const options: ConversionOptions = {
        preserveTransparency: true,
        autoTransparentBg: false,
      };

      const result = await convertImage(file, options);

      expect(result).toBe(mockBlob);
      expect(mockPost).toHaveBeenCalledWith(
        '/api/convert',
        expect.any(FormData),
        expect.objectContaining({
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
    });
  });

  describe('checkHealth', () => {
    it('ヘルスチェックを正常に実行する', async () => {
      const mockHealthResponse = {
        status: 'healthy',
        version: '2.0.0',
        timestamp: '2024-01-01T00:00:00Z',
      };
      const mockGet = vi.fn().mockResolvedValue({ data: mockHealthResponse });

      mockedAxios.create.mockReturnValue({
        post: vi.fn(),
        get: mockGet,
        interceptors: {
          request: { use: vi.fn(), eject: vi.fn() },
          response: { use: vi.fn(), eject: vi.fn() },
        },
      } as unknown as ReturnType<typeof axios.create>);

      const result = await checkHealth();

      expect(result).toEqual(mockHealthResponse);
      expect(mockGet).toHaveBeenCalledWith('/api/health');
    });
  });
});
