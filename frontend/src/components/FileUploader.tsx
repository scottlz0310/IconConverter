/**
 * FileUploaderコンポーネント
 *
 * ドラッグ&ドロップまたはファイル選択による画像アップロード機能を提供します。
 *
 * 要件:
 * - 2.1: ドラッグ&ドロップでファイルを受け付ける
 * - 2.2: ファイル選択ボタンを提供
 * - 2.3: PNG, JPEG, BMP, GIF, TIFF, WebP形式をサポート
 * - 2.4: 画像ファイル選択時にプレビューを表示
 * - 2.5: 最大ファイルサイズ10MBの制限
 */

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { useImageStore } from '../stores/imageStore';
import { Button } from './ui/button';
import { Card } from './ui/card';
import type { ImageFile } from '../types';

/**
 * サポートされている画像形式
 * 要件2.3: PNG, JPEG, BMP, GIF, TIFF, WebP形式をサポート
 */
const ACCEPTED_FORMATS = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/bmp': ['.bmp'],
  'image/gif': ['.gif'],
  'image/tiff': ['.tiff', '.tif'],
  'image/webp': ['.webp'],
};

/**
 * 最大ファイルサイズ（バイト）
 * 要件2.5: 最大ファイルサイズ10MBの制限
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * ファイルサイズを人間が読みやすい形式にフォーマット
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * FileUploaderコンポーネント
 */
export function FileUploader() {
  const { setImage, setError } = useImageStore();

  /**
   * ファイルドロップ時の処理
   * 要件2.4: Data URLの生成とストアへの保存
   */
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // エラーをクリア
      setError(null);

      // 拒否されたファイルがある場合
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const errors = rejection.errors;

        let errorMessage = '';
        if (errors.some((e: any) => e.code === 'file-too-large')) {
          errorMessage = `ファイルサイズが大きすぎます（最大${formatFileSize(MAX_FILE_SIZE)}）`;
        } else if (errors.some((e: any) => e.code === 'file-invalid-type')) {
          errorMessage = '対応していないファイル形式です。PNG, JPEG, BMP, GIF, TIFF, WebPのいずれかを選択してください。';
        } else {
          errorMessage = 'ファイルのアップロードに失敗しました。';
        }

        setError(errorMessage);
        toast.error('ファイルエラー', {
          description: errorMessage,
        });
        return;
      }

      // 受け入れられたファイルがない場合
      if (acceptedFiles.length === 0) {
        return;
      }

      // 最初のファイルのみを処理（複数選択は無効）
      const file = acceptedFiles[0];

      // Data URLを生成してImageFileオブジェクトを作成
      const preview = URL.createObjectURL(file);
      const imageFile: ImageFile = {
        file,
        preview,
        name: file.name,
        size: file.size,
        type: file.type,
      };

      // ストアに保存
      setImage(imageFile);

      // 成功通知
      toast.success('ファイルを読み込みました', {
        description: `${file.name} (${formatFileSize(file.size)})`,
      });
    },
    [setImage, setError]
  );

  /**
   * react-dropzoneの設定
   */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxSize: MAX_FILE_SIZE,
    multiple: false, // 単一ファイルのみ
    noClick: false,
    noKeyboard: false,
  });

  return (
    <Card className="p-4 sm:p-6 lg:p-8">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 sm:p-8 lg:p-12 text-center cursor-pointer
          transition-colors duration-200 touch-manipulation
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/5 active:bg-accent/10'
          }
        `}
        role="button"
        tabIndex={0}
        aria-label="画像ファイルをアップロード"
        onKeyDown={(e) => {
          // Enterキーまたはスペースキーでファイル選択ダイアログを開く
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const input = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
            input?.click();
          }
        }}
      >
        <input {...getInputProps()} aria-label="ファイル選択" />

        <div className="flex flex-col items-center gap-3 sm:gap-4">
          {isDragActive ? (
            <>
              <FileImage className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-primary" />
              <p className="text-base sm:text-lg font-medium text-primary">
                ファイルをドロップしてください
              </p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-muted-foreground" />
              <div className="space-y-1 sm:space-y-2">
                <p className="text-base sm:text-lg font-medium">
                  画像ファイルをドラッグ&ドロップ
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  または
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="mt-1 sm:mt-2 min-h-[48px] touch-manipulation"
              >
                ファイルを選択
              </Button>
              <div className="text-xs sm:text-sm text-muted-foreground space-y-1 mt-2">
                <p className="hidden sm:block">対応形式: PNG, JPEG, BMP, GIF, TIFF, WebP</p>
                <p className="sm:hidden">PNG, JPEG, BMP, GIF, TIFF, WebP</p>
                <p>最大サイズ: {formatFileSize(MAX_FILE_SIZE)}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
