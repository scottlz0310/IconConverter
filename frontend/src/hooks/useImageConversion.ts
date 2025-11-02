/**
 * 画像変換カスタムフック
 *
 * TanStack Queryを使用して画像変換処理を管理します。
 */

import { useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { convertImage, parseApiError } from '../services/api';
import type { ConversionOptions } from '../types';

/**
 * 画像変換のリクエストパラメータ
 */
interface ConvertImageParams {
  /** 変換する画像ファイル */
  file: File;
  /** 変換オプション */
  options: ConversionOptions;
}

/**
 * 画像変換カスタムフック
 *
 * TanStack QueryのuseMutationを使用して、画像変換処理を管理します。
 * 非同期処理、エラーハンドリング、ローディング状態を自動的に管理します。
 *
 * @example
 * ```tsx
 * function ConvertButton() {
 *   const { mutate, isPending, isError, error } = useImageConversion({
 *     onSuccess: (blob) => {
 *       // ダウンロード処理
 *       const url = URL.createObjectURL(blob);
 *       const a = document.createElement('a');
 *       a.href = url;
 *       a.download = 'output.ico';
 *       a.click();
 *       URL.revokeObjectURL(url);
 *     },
 *     onError: (error) => {
 *       console.error('変換エラー:', error);
 *     },
 *   });
 *
 *   const handleConvert = () => {
 *     mutate({ file: selectedFile, options: conversionOptions });
 *   };
 *
 *   return (
 *     <button onClick={handleConvert} disabled={isPending}>
 *       {isPending ? '変換中...' : '変換'}
 *     </button>
 *   );
 * }
 * ```
 *
 * @param options - TanStack Queryのオプション
 * @returns useMutationの結果
 */
export function useImageConversion(
  options?: {
    onSuccess?: (data: Blob) => void;
    onError?: (error: string) => void;
  }
): UseMutationResult<Blob, string, ConvertImageParams> {
  return useMutation<Blob, string, ConvertImageParams>({
    mutationFn: async ({ file, options: conversionOptions }: ConvertImageParams) => {
      try {
        const blob = await convertImage(file, conversionOptions);
        return blob;
      } catch (error) {
        // エラーを解析してユーザーフレンドリーなメッセージに変換
        const errorMessage = parseApiError(error);
        throw errorMessage;
      }
    },
    onSuccess: (data) => {
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      if (options?.onError) {
        options.onError(error);
      }
    },
    // リトライ設定: ネットワークエラーの場合のみ1回リトライ
    retry: (failureCount, error) => {
      // ネットワークエラーの場合のみリトライ
      if (error.includes('ネットワークエラー') && failureCount < 1) {
        return true;
      }
      return false;
    },
    retryDelay: 1000, // 1秒後にリトライ
  });
}
