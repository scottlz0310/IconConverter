/**
 * imageStoreのユニットテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useImageStore } from '../imageStore';
import type { ImageFile, ConversionOptions } from '../../types';

describe('imageStore', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useImageStore.getState().reset();
  });

  describe('初期状態', () => {
    it('デフォルト値が正しく設定されている', () => {
      const state = useImageStore.getState();

      expect(state.image).toBeNull();
      expect(state.options).toEqual({
        preserveTransparency: true,
        autoTransparentBg: false,
      });
      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
    });
  });

  describe('setImage', () => {
    it('画像を設定できる', () => {
      const mockImage: ImageFile = {
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        preview: 'blob:test',
        name: 'test.png',
        size: 1024,
        type: 'image/png',
      };

      useImageStore.getState().setImage(mockImage);

      const state = useImageStore.getState();
      expect(state.image).toEqual(mockImage);
      expect(state.error).toBeNull();
    });

    it('画像をクリアできる', () => {
      const mockImage: ImageFile = {
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        preview: 'blob:test',
        name: 'test.png',
        size: 1024,
        type: 'image/png',
      };

      // 画像を設定
      useImageStore.getState().setImage(mockImage);
      expect(useImageStore.getState().image).toEqual(mockImage);

      // 画像をクリア
      useImageStore.getState().setImage(null);
      const state = useImageStore.getState();
      expect(state.image).toBeNull();
      expect(state.status).toBe('idle');
    });

    it('画像設定時にエラーがクリアされる', () => {
      const mockImage: ImageFile = {
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        preview: 'blob:test',
        name: 'test.png',
        size: 1024,
        type: 'image/png',
      };

      // エラーを設定
      useImageStore.getState().setError('テストエラー');
      expect(useImageStore.getState().error).toBe('テストエラー');

      // 画像を設定
      useImageStore.getState().setImage(mockImage);
      expect(useImageStore.getState().error).toBeNull();
    });
  });

  describe('setOptions', () => {
    it('オプションを設定できる', () => {
      const newOptions: ConversionOptions = {
        preserveTransparency: false,
        autoTransparentBg: true,
      };

      useImageStore.getState().setOptions(newOptions);

      const state = useImageStore.getState();
      expect(state.options).toEqual(newOptions);
    });

    it('透明化保持オプションを変更できる', () => {
      useImageStore.getState().setOptions({
        preserveTransparency: false,
        autoTransparentBg: false,
      });

      const state = useImageStore.getState();
      expect(state.options.preserveTransparency).toBe(false);
    });

    it('自動背景透明化オプションを変更できる', () => {
      useImageStore.getState().setOptions({
        preserveTransparency: false,
        autoTransparentBg: true,
      });

      const state = useImageStore.getState();
      expect(state.options.autoTransparentBg).toBe(true);
    });
  });

  describe('setStatus', () => {
    it('ステータスを設定できる', () => {
      useImageStore.getState().setStatus('converting');

      const state = useImageStore.getState();
      expect(state.status).toBe('converting');
    });

    it('ステータス変更時にエラーがクリアされる（errorステータス以外）', () => {
      // エラーを設定
      useImageStore.getState().setError('テストエラー');
      expect(useImageStore.getState().error).toBe('テストエラー');

      // ステータスを変更
      useImageStore.getState().setStatus('converting');
      expect(useImageStore.getState().error).toBeNull();
    });

    it('errorステータスの場合はエラーがクリアされない', () => {
      // エラーを設定
      useImageStore.getState().setError('テストエラー');
      expect(useImageStore.getState().error).toBe('テストエラー');

      // errorステータスに変更
      useImageStore.getState().setStatus('error');
      expect(useImageStore.getState().error).toBe('テストエラー');
    });

    it('全てのステータスを設定できる', () => {
      const statuses: Array<'idle' | 'uploading' | 'converting' | 'success' | 'error'> = [
        'idle',
        'uploading',
        'converting',
        'success',
        'error',
      ];

      statuses.forEach((status) => {
        useImageStore.getState().setStatus(status);
        expect(useImageStore.getState().status).toBe(status);
      });
    });
  });

  describe('setError', () => {
    it('エラーを設定できる', () => {
      useImageStore.getState().setError('テストエラー');

      const state = useImageStore.getState();
      expect(state.error).toBe('テストエラー');
      expect(state.status).toBe('error');
    });

    it('エラーをクリアできる', () => {
      // エラーを設定
      useImageStore.getState().setError('テストエラー');
      expect(useImageStore.getState().error).toBe('テストエラー');

      // エラーをクリア
      useImageStore.getState().setError(null);
      expect(useImageStore.getState().error).toBeNull();
    });

    it('エラー設定時にステータスがerrorに変更される', () => {
      useImageStore.getState().setStatus('idle');
      expect(useImageStore.getState().status).toBe('idle');

      useImageStore.getState().setError('テストエラー');
      expect(useImageStore.getState().status).toBe('error');
    });
  });

  describe('reset', () => {
    it('状態を完全にリセットできる', () => {
      const mockImage: ImageFile = {
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        preview: 'blob:test',
        name: 'test.png',
        size: 1024,
        type: 'image/png',
      };

      // 状態を変更
      useImageStore.getState().setImage(mockImage);
      useImageStore.getState().setOptions({
        preserveTransparency: false,
        autoTransparentBg: true,
      });
      useImageStore.getState().setStatus('converting');
      useImageStore.getState().setError('テストエラー');

      // リセット
      useImageStore.getState().reset();

      const state = useImageStore.getState();
      expect(state.image).toBeNull();
      expect(state.options).toEqual({
        preserveTransparency: true,
        autoTransparentBg: false,
      });
      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
    });
  });

  describe('統合シナリオ', () => {
    it('画像アップロードから変換までの状態遷移', () => {
      const mockImage: ImageFile = {
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        preview: 'blob:test',
        name: 'test.png',
        size: 1024,
        type: 'image/png',
      };

      // 1. 画像をアップロード
      useImageStore.getState().setImage(mockImage);
      expect(useImageStore.getState().image).toEqual(mockImage);
      expect(useImageStore.getState().status).toBe('idle');

      // 2. 変換開始
      useImageStore.getState().setStatus('converting');
      expect(useImageStore.getState().status).toBe('converting');

      // 3. 変換成功
      useImageStore.getState().setStatus('success');
      expect(useImageStore.getState().status).toBe('success');
      expect(useImageStore.getState().error).toBeNull();
    });

    it('エラー発生時の状態遷移', () => {
      const mockImage: ImageFile = {
        file: new File(['test'], 'test.png', { type: 'image/png' }),
        preview: 'blob:test',
        name: 'test.png',
        size: 1024,
        type: 'image/png',
      };

      // 1. 画像をアップロード
      useImageStore.getState().setImage(mockImage);

      // 2. 変換開始
      useImageStore.getState().setStatus('converting');

      // 3. エラー発生
      useImageStore.getState().setError('変換に失敗しました');
      expect(useImageStore.getState().status).toBe('error');
      expect(useImageStore.getState().error).toBe('変換に失敗しました');

      // 4. リセット
      useImageStore.getState().reset();
      expect(useImageStore.getState().status).toBe('idle');
      expect(useImageStore.getState().error).toBeNull();
    });
  });
});
