/**
 * 画像変換アプリケーションの状態管理ストア（Zustand）
 *
 * 画像ファイル、変換オプション、変換状態、エラーを管理します。
 */

import { create } from 'zustand';
import type { AppState, ImageFile, ConversionOptions, ConversionStatus } from '../types';

/**
 * デフォルトの変換オプション
 * 要件3.5: デフォルトで「透明化保持」を有効にする
 */
const DEFAULT_OPTIONS: ConversionOptions = {
  preserveTransparency: true,
  autoTransparentBg: false,
};

/**
 * 画像変換アプリケーションのグローバル状態ストア
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { image, setImage, options, setOptions } = useImageStore();
 *
 *   const handleFileSelect = (file: File) => {
 *     const imageFile: ImageFile = {
 *       file,
 *       preview: URL.createObjectURL(file),
 *       name: file.name,
 *       size: file.size,
 *       type: file.type,
 *     };
 *     setImage(imageFile);
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export const useImageStore = create<AppState>((set) => ({
  // 初期状態
  image: null,
  options: DEFAULT_OPTIONS,
  status: 'idle',
  error: null,

  // アクション: 画像を設定
  setImage: (image: ImageFile | null) => {
    set({ image, error: null });

    // 画像がクリアされた場合は状態もリセット
    if (image === null) {
      set({ status: 'idle' });
    }
  },

  // アクション: オプションを設定
  setOptions: (options: ConversionOptions) => {
    set({ options });
  },

  // アクション: 状態を設定
  setStatus: (status: ConversionStatus) => {
    set({ status });

    // 状態が変わったらエラーをクリア（errorステータス以外）
    if (status !== 'error') {
      set({ error: null });
    }
  },

  // アクション: エラーを設定
  setError: (error: string | null) => {
    set({ error });

    // エラーが設定された場合は状態もerrorに変更
    if (error !== null) {
      set({ status: 'error' });
    }
  },

  // アクション: 状態を完全にリセット
  reset: () => {
    set({
      image: null,
      options: DEFAULT_OPTIONS,
      status: 'idle',
      error: null,
    });
  },
}));
