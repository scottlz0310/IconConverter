/**
 * TypeScript型定義
 *
 * アプリケーション全体で使用される型定義
 */

/**
 * 画像ファイル情報
 */
export interface ImageFile {
  /** 元のFileオブジェクト */
  file: File;
  /** プレビュー用のData URL */
  preview: string;
  /** ファイル名 */
  name: string;
  /** ファイルサイズ（バイト） */
  size: number;
  /** MIMEタイプ */
  type: string;
}

/**
 * 変換オプション
 */
export interface ConversionOptions {
  /** 透明化保持（既存の透明度を保持） */
  preserveTransparency: boolean;
  /** 自動背景透明化（四隅のピクセルから単色背景を検出して除去） */
  autoTransparentBg: boolean;
}

/**
 * 変換状態
 */
export type ConversionStatus = 'idle' | 'uploading' | 'converting' | 'success' | 'error';

/**
 * アプリケーション状態（Zustandストア用）
 */
export interface AppState {
  /** 選択された画像ファイル */
  image: ImageFile | null;
  /** 変換オプション */
  options: ConversionOptions;
  /** 変換状態 */
  status: ConversionStatus;
  /** エラーメッセージ */
  error: string | null;
  /** 画像を設定 */
  setImage: (image: ImageFile | null) => void;
  /** オプションを設定 */
  setOptions: (options: ConversionOptions) => void;
  /** 状態を設定 */
  setStatus: (status: ConversionStatus) => void;
  /** エラーを設定 */
  setError: (error: string | null) => void;
  /** 状態をリセット */
  reset: () => void;
}

/**
 * ヘルスチェックレスポンス
 */
export interface HealthResponse {
  /** ステータス */
  status: 'healthy' | 'unhealthy';
  /** バージョン */
  version: string;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  /** エラーメッセージ */
  detail: string;
  /** エラーコード（オプション） */
  error_code?: string;
}

/**
 * テーマ
 */
export type Theme = 'light' | 'dark' | 'system';
