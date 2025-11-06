/**
 * 変換ボタンコンポーネント
 *
 * 画像をICOファイルに変換し、自動ダウンロードを実行します。
 */

import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { useImageStore } from '../stores/imageStore';
import { useImageConversion } from '../hooks/useImageConversion';
import { imageAPI } from '../adapters/image-api';
import { isElectron } from '../utils/electron';

/**
 * 変換ボタンコンポーネント
 *
 * 要件4.1, 4.2, 4.3, 4.4, 4.5に対応:
 * - 変換ボタンのクリックでバックエンドに画像とオプションを送信
 * - 変換処理中のローディング状態表示
 * - 変換完了後の自動ダウンロード
 * - エラーハンドリングとトースト通知
 */
export function ConvertButton() {
  const { image, options, setStatus, setError } = useImageStore();

  // 画像変換フックの使用
  const { mutate: convertImage, isPending } = useImageConversion({
    onSuccess: async (blob: Blob) => {
      // 要件4.4: 変換成功時の処理
      setStatus('success');

      try {
        // ファイル名の設定（元のファイル名.ico）
        const originalName = image?.name || 'image';
        const baseName = originalName.replace(/\.[^/.]+$/, ''); // 拡張子を除去
        const filename = `${baseName}.ico`;

        // 環境に応じた保存処理（ElectronまたはWeb）
        await imageAPI.saveFile(blob, filename);

        // 成功トースト通知
        toast.success('変換完了', {
          description: isElectron()
            ? 'ICOファイルを保存しました'
            : 'ICOファイルのダウンロードを開始しました',
        });

        // 状態をidleに戻す
        setTimeout(() => {
          setStatus('idle');
        }, 2000);
      } catch (error) {
        // 保存キャンセルまたはエラー
        const errorMessage = error instanceof Error ? error.message : '保存に失敗しました';
        if (!errorMessage.includes('cancelled')) {
          setError(errorMessage);
          toast.error('保存エラー', {
            description: errorMessage,
          });
        }
        setStatus('idle');
      }
    },
    onError: (error: string) => {
      // 要件4.5: エラーハンドリング
      setError(error);
      setStatus('error');

      // エラートースト通知
      toast.error('変換エラー', {
        description: error,
      });
    },
  });

  // 変換ボタンのクリックハンドラー
  const handleConvert = () => {
    if (!image) {
      toast.error('エラー', {
        description: '画像ファイルを選択してください',
      });
      return;
    }

    // 変換状態を更新
    setStatus('converting');
    setError(null);

    // 要件4.1: API呼び出し
    convertImage({
      file: image.file,
      options,
    });
  };

  /**
   * キーボードイベントハンドラー
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enterキーで変換を実行
    if (e.key === 'Enter' && !isDisabled) {
      e.preventDefault();
      handleConvert();
    }
  };

  // 画像が選択されていない場合はボタンを無効化
  const isDisabled = !image || isPending;

  return (
    <Button
      onClick={handleConvert}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      size="lg"
      className="w-full text-sm sm:text-base min-h-[48px] sm:min-h-[52px] touch-manipulation focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-smooth hover-scale shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={isPending ? '変換中' : 'ICOファイルに変換'}
      aria-busy={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" aria-hidden="true" />
          <span className="ml-2">変換中...</span>
        </>
      ) : (
        <>
          <Download
            className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-y-0.5"
            aria-hidden="true"
          />
          <span className="ml-2 font-semibold">ICOファイルに変換</span>
        </>
      )}
    </Button>
  );
}
