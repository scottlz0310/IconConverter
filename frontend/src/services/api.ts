/**
 * APIクライアント
 *
 * バックエンドAPIとの通信を担当
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type { ConversionOptions, ErrorResponse, HealthResponse } from '../types';

/**
 * APIベースURL（環境変数から取得、デフォルトはlocalhost:8000）
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * 最大ファイルサイズ（環境変数から取得、デフォルトは10MB）
 */
export const MAX_FILE_SIZE = Number(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760;

/**
 * エラーメッセージマッピング
 * ユーザーフレンドリーで具体的なエラーメッセージを提供
 */
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_FORMAT: '対応していないファイル形式です。PNG、JPEG、BMP、GIF、TIFF、WebP形式の画像をご使用ください。',
  FILE_TOO_LARGE: 'ファイルサイズが大きすぎます。10MB以下の画像ファイルをご使用ください。',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。インターネット接続を確認して、もう一度お試しください。',
  SERVER_ERROR: 'サーバーエラーが発生しました。しばらく時間をおいてから、もう一度お試しください。',
  TIMEOUT_ERROR: 'リクエストがタイムアウトしました。ファイルサイズが大きい場合は時間がかかることがあります。もう一度お試しください。',
  UNKNOWN_ERROR: '予期しないエラーが発生しました。問題が解決しない場合は、サポートにお問い合わせください。',
  CONVERSION_FAILED: '画像の変換に失敗しました。別の画像ファイルをお試しください。',
  RATE_LIMIT_EXCEEDED: 'リクエスト数が制限を超えました。しばらく時間をおいてから、もう一度お試しください。',
};

/**
 * axiosインスタンスの作成
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒タイムアウト
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

/**
 * リクエストインターセプター
 * リクエスト送信前の処理
 */
apiClient.interceptors.request.use(
  (config) => {
    // リクエストIDを生成（デバッグ用）
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    config.headers['X-Request-ID'] = requestId;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * レスポンスインターセプター
 * レスポンス受信後の処理
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ErrorResponse>) => {
    // エラーハンドリング
    return Promise.reject(error);
  }
);

/**
 * APIエラーを解析してユーザーフレンドリーなメッセージを返す
 *
 * @param error - エラーオブジェクト
 * @returns ユーザーフレンドリーなエラーメッセージ
 */
export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>;

    // タイムアウトエラー
    if (axiosError.code === 'ECONNABORTED') {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }

    // ネットワークエラー
    if (!axiosError.response) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // バックエンドからのエラーレスポンス
    const errorData = axiosError.response.data;
    if (errorData?.error_code && ERROR_MESSAGES[errorData.error_code]) {
      return ERROR_MESSAGES[errorData.error_code];
    }

    // HTTPステータスコードに基づくエラーメッセージ
    const status = axiosError.response.status;
    if (status === 413) {
      return ERROR_MESSAGES.FILE_TOO_LARGE;
    }
    if (status === 415) {
      return ERROR_MESSAGES.INVALID_FORMAT;
    }
    if (status === 429) {
      return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
    }
    if (status >= 500) {
      return ERROR_MESSAGES.SERVER_ERROR;
    }
    if (status === 400) {
      // バリデーションエラーの場合は詳細メッセージを使用
      if (errorData?.detail) {
        return errorData.detail;
      }
      return ERROR_MESSAGES.CONVERSION_FAILED;
    }

    // バックエンドからのdetailメッセージを使用
    if (errorData?.detail) {
      return errorData.detail;
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * 画像をICOファイルに変換する
 *
 * @param file - 変換する画像ファイル
 * @param options - 変換オプション
 * @returns ICOファイルのBlob
 * @throws エラーが発生した場合
 */
export async function convertImage(
  file: File,
  options: ConversionOptions
): Promise<Blob> {
  // FormDataの作成
  const formData = new FormData();
  formData.append('file', file);
  formData.append('preserve_transparency', String(options.preserveTransparency));
  formData.append('auto_transparent_bg', String(options.autoTransparentBg));

  try {
    // API呼び出し
    const response = await apiClient.post<Blob>('/api/convert', formData, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    // エラーを再スロー（呼び出し側でハンドリング）
    throw error;
  }
}

/**
 * ヘルスチェックを実行する
 *
 * @returns ヘルスチェック結果
 * @throws エラーが発生した場合
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await apiClient.get<HealthResponse>('/api/health');
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * ファイルサイズを検証する
 *
 * @param file - 検証するファイル
 * @returns 検証結果（trueの場合は有効）
 */
export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * ファイル形式を検証する
 *
 * @param file - 検証するファイル
 * @returns 検証結果（trueの場合は有効）
 */
export function validateFileFormat(file: File): boolean {
  const allowedFormats = [
    'image/png',
    'image/jpeg',
    'image/bmp',
    'image/gif',
    'image/tiff',
    'image/webp',
  ];

  return allowedFormats.includes(file.type);
}

/**
 * ファイルを検証する（サイズと形式）
 *
 * @param file - 検証するファイル
 * @returns 検証結果オブジェクト
 */
export function validateFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!validateFileFormat(file)) {
    return {
      valid: false,
      error: ERROR_MESSAGES.INVALID_FORMAT,
    };
  }

  if (!validateFileSize(file)) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `${ERROR_MESSAGES.FILE_TOO_LARGE}（現在のファイルサイズ: ${fileSizeMB}MB）`,
    };
  }

  return { valid: true };
}
