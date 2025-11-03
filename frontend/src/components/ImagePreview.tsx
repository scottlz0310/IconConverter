/**
 * ImagePreviewコンポーネント
 *
 * アップロードされた画像のプレビューと情報を表示します。
 *
 * 要件:
 * - 2.4: 画像ファイル選択時にプレビューを表示
 * - 10.5: 画像プレビューの最適化（メモリ効率）
 */

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useImageStore } from '../stores/imageStore';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

/**
 * ファイルサイズを人間が読みやすい形式にフォーマット
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * MIMEタイプから表示用の形式名を取得
 */
const getFormatName = (mimeType: string): string => {
  const formatMap: Record<string, string> = {
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
    'image/bmp': 'BMP',
    'image/gif': 'GIF',
    'image/tiff': 'TIFF',
    'image/webp': 'WebP',
  };
  return formatMap[mimeType] || mimeType;
};

/**
 * ImagePreviewコンポーネント
 */
export function ImagePreview() {
  const { image, status, reset } = useImageStore();
  const imgRef = useRef<HTMLImageElement>(null);

  /**
   * メモリ最適化: コンポーネントアンマウント時にData URLを解放
   */
  useEffect(() => {
    return () => {
      if (image?.preview && image.preview.startsWith('blob:')) {
        URL.revokeObjectURL(image.preview);
      }
    };
  }, [image?.preview]);

  /**
   * 画像ロード時の最適化: デコード完了を待つ
   */
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete) {
      // 画像が既にロード済みの場合はデコード
      img.decode().catch(() => {
        // デコードエラーは無視（フォールバック）
      });
    }
  }, [image?.preview]);

  // 画像が選択されていない場合は何も表示しない
  if (!image) {
    return null;
  }

  // 要件5.5: 処理中はUIをブロックしない（削除ボタンのみ無効化）
  const isProcessing = status === 'uploading' || status === 'converting';

  /**
   * 削除ボタンクリック時の処理
   * 要件2.4: 画像削除機能
   */
  const handleRemove = () => {
    // Data URLのメモリを解放
    if (image.preview && image.preview.startsWith('blob:')) {
      URL.revokeObjectURL(image.preview);
    }
    // ストアをリセット
    reset();

    // 削除通知
    toast.info('画像を削除しました', {
      description: '新しい画像を選択してください',
    });
  };

  /**
   * キーボードイベントハンドラー
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Deleteキーで画像を削除
    if (e.key === 'Delete' && !isProcessing) {
      e.preventDefault();
      handleRemove();
    }
  };

  return (
    <Card className="h-full" onKeyDown={handleKeyDown}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">画像プレビュー</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={isProcessing}
          className="min-h-[44px] min-w-[44px] h-11 w-11 touch-manipulation focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="画像を削除（Deleteキーでも削除可能）"
          title="画像を削除（Deleteキー）"
        >
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* 画像表示エリア - レスポンシブな高さ */}
        <div className="flex justify-center items-center bg-accent/20 rounded-lg p-3 sm:p-4 min-h-[180px] sm:min-h-[200px] lg:min-h-[250px]">
          <img
            ref={imgRef}
            src={image.preview}
            alt={`選択された画像: ${image.name}`}
            className="max-w-full max-h-[250px] sm:max-h-[300px] lg:max-h-[400px] object-contain rounded"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* 画像情報 - レスポンシブなテキストサイズ */}
        <div className="space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground flex-shrink-0">ファイル名:</span>
            <span className="font-medium truncate text-right" title={image.name}>
              {image.name}
            </span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground flex-shrink-0">サイズ:</span>
            <span className="font-medium">{formatFileSize(image.size)}</span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-muted-foreground flex-shrink-0">形式:</span>
            <span className="font-medium">{getFormatName(image.type)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
