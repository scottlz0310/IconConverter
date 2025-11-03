/**
 * ConversionProgressコンポーネントのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConversionProgress } from '../ConversionProgress';
import { useImageStore } from '../../stores/imageStore';

describe('ConversionProgress', () => {
  beforeEach(() => {
    // 各テスト前にストアをリセット
    useImageStore.getState().reset();
  });

  describe('表示制御', () => {
    it('idle状態では何も表示しない', () => {
      useImageStore.getState().setStatus('idle');

      const { container } = render(<ConversionProgress />);

      expect(container.firstChild).toBeNull();
    });

    it('uploading状態でメッセージとプログレスバーを表示', () => {
      useImageStore.getState().setStatus('uploading');

      render(<ConversionProgress />);

      expect(screen.getByText('ファイルをアップロード中...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('converting状態でメッセージとプログレスバーを表示', () => {
      useImageStore.getState().setStatus('converting');

      render(<ConversionProgress />);

      expect(screen.getByText('画像を変換中...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('success状態でメッセージとプログレスバーを表示', () => {
      useImageStore.getState().setStatus('success');

      render(<ConversionProgress />);

      expect(screen.getByText('変換が完了しました！')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('error状態でエラーメッセージを表示（プログレスバーなし）', () => {
      useImageStore.getState().setStatus('error');

      render(<ConversionProgress />);

      expect(screen.getByText('変換中にエラーが発生しました')).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('role="status"とaria-live="polite"が設定されている', () => {
      useImageStore.getState().setStatus('converting');

      render(<ConversionProgress />);

      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
      expect(statusElement).toHaveAttribute('aria-atomic', 'true');
    });

    it('プログレスバーにaria-labelが設定されている', () => {
      useImageStore.getState().setStatus('converting');

      render(<ConversionProgress />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label');
    });
  });

  describe('スピナー表示', () => {
    it('uploading状態でスピナーを表示', () => {
      useImageStore.getState().setStatus('uploading');

      const { container } = render(<ConversionProgress />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('converting状態でスピナーを表示', () => {
      useImageStore.getState().setStatus('converting');

      const { container } = render(<ConversionProgress />);

      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('success状態でチェックマークを表示', () => {
      useImageStore.getState().setStatus('success');

      const { container } = render(<ConversionProgress />);

      const checkmark = container.querySelector('polyline');
      expect(checkmark).toBeInTheDocument();
    });

    it('error状態ではスピナーもチェックマークも表示しない', () => {
      useImageStore.getState().setStatus('error');

      const { container } = render(<ConversionProgress />);

      const spinner = container.querySelector('.animate-spin');
      const checkmark = container.querySelector('polyline');
      expect(spinner).not.toBeInTheDocument();
      expect(checkmark).not.toBeInTheDocument();
    });
  });

  describe('状態遷移', () => {
    it('idle → uploading → converting → success の遷移', () => {
      const { rerender } = render(<ConversionProgress />);

      // idle: 何も表示されない
      expect(screen.queryByRole('status')).not.toBeInTheDocument();

      // uploading
      useImageStore.getState().setStatus('uploading');
      rerender(<ConversionProgress />);
      expect(screen.getByText('ファイルをアップロード中...')).toBeInTheDocument();

      // converting
      useImageStore.getState().setStatus('converting');
      rerender(<ConversionProgress />);
      expect(screen.getByText('画像を変換中...')).toBeInTheDocument();

      // success
      useImageStore.getState().setStatus('success');
      rerender(<ConversionProgress />);
      expect(screen.getByText('変換が完了しました！')).toBeInTheDocument();
    });

    it('converting → error の遷移', () => {
      useImageStore.getState().setStatus('converting');

      const { rerender } = render(<ConversionProgress />);
      expect(screen.getByText('画像を変換中...')).toBeInTheDocument();

      useImageStore.getState().setStatus('error');
      rerender(<ConversionProgress />);
      expect(screen.getByText('変換中にエラーが発生しました')).toBeInTheDocument();
    });
  });
});
