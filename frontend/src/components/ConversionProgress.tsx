/**
 * ConversionProgressコンポーネント
 *
 * 画像変換処理の進行状況を表示します。
 * - ローディングスピナー
 * - プログレスバー
 * - ステータスメッセージ
 *
 * 要件: 5.1, 5.2
 */

import { Loader2 } from 'lucide-react';
import { Progress } from './ui/progress';
import { useImageStore } from '../stores/imageStore';
import type { ConversionStatus } from '../types';

/**
 * 各状態に対応するメッセージ
 */
const STATUS_MESSAGES: Record<ConversionStatus, string> = {
  idle: '',
  uploading: 'ファイルをアップロード中...',
  converting: '画像を変換中...',
  success: '変換が完了しました！',
  error: '変換中にエラーが発生しました',
};

/**
 * 各状態に対応するプログレス値（0-100）
 */
const STATUS_PROGRESS: Record<ConversionStatus, number> = {
  idle: 0,
  uploading: 30,
  converting: 70,
  success: 100,
  error: 0,
};

/**
 * ConversionProgressコンポーネント
 *
 * 変換処理の進行状況を視覚的に表示します。
 * idle状態では何も表示しません。
 */
export function ConversionProgress() {
  const { status } = useImageStore();

  // idle状態では何も表示しない
  if (status === 'idle') {
    return null;
  }

  const message = STATUS_MESSAGES[status];
  const progress = STATUS_PROGRESS[status];
  const isProcessing = status === 'uploading' || status === 'converting';

  return (
    <div className="space-y-2 sm:space-y-3" role="status" aria-live="polite" aria-atomic="true">
      {/* ステータスメッセージとスピナー */}
      <div className="flex items-center gap-2 sm:gap-3">
        {isProcessing && (
          <Loader2
            className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary flex-shrink-0"
            aria-hidden="true"
          />
        )}
        <p className={`text-xs sm:text-sm font-medium ${
          status === 'success' ? 'text-green-600 dark:text-green-400' :
          status === 'error' ? 'text-destructive' :
          'text-muted-foreground'
        }`}>
          {message}
        </p>
      </div>

      {/* プログレスバー - 処理中または成功時に表示 */}
      {(isProcessing || status === 'success') && (
        <Progress
          value={progress}
          className="h-1.5 sm:h-2"
          aria-label={`変換進行状況: ${progress}%`}
        />
      )}
    </div>
  );
}
