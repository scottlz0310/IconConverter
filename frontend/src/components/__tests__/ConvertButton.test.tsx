/**
 * ConvertButtonコンポーネントのテスト
 *
 * 要件4.1, 4.2, 4.3, 4.4, 4.5のテスト
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvertButton } from '../ConvertButton';
import { useImageStore } from '../../stores/imageStore';
import { useImageConversion } from '../../hooks/useImageConversion';
import type { ImageFile } from '../../types';

// Zustandストアをモック
vi.mock('../../stores/imageStore');

// useImageConversionフックをモック
vi.mock('../../hooks/useImageConversion');

// sonnerのtoastをモック
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// URL.createObjectURLとrevokeObjectURLをモック
global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');
global.URL.revokeObjectURL = vi.fn();

describe('ConvertButton', () => {
  const mockSetStatus = vi.fn();
  const mockSetError = vi.fn();
  const mockMutate = vi.fn();
  const mockImage: ImageFile = {
    file: new File(['test'], 'test.png', { type: 'image/png' }),
    preview: 'blob:http://localhost/test',
    name: 'test.png',
    size: 1024,
    type: 'image/png',
  };

  let mockOnSuccess: ((blob: Blob) => void) | undefined;
  let mockOnError: ((error: string) => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSuccess = undefined;
    mockOnError = undefined;

    // useImageConversionをモックして、コールバックをキャプチャ
    (useImageConversion as any).mockImplementation((callbacks: any) => {
      mockOnSuccess = callbacks?.onSuccess;
      mockOnError = callbacks?.onError;
      return {
        mutate: mockMutate,
        isPending: false,
      };
    });
  });

  it('画像が選択されていない場合はボタンが無効化される', () => {
    (useImageStore as any).mockReturnValue({
      image: null,
      options: { preserveTransparency: true, autoTransparentBg: false },
      setStatus: mockSetStatus,
      setError: mockSetError,
    });

    render(<ConvertButton />);

    const button = screen.getByRole('button', { name: /ICOファイルに変換/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('画像が選択されている場合はボタンが有効化される', () => {
    (useImageStore as any).mockReturnValue({
      image: mockImage,
      options: { preserveTransparency: true, autoTransparentBg: false },
      setStatus: mockSetStatus,
      setError: mockSetError,
    });

    render(<ConvertButton />);

    const button = screen.getByRole('button', { name: /ICOファイルに変換/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('ボタンをクリックすると変換が開始される（要件4.1）', async () => {
    (useImageStore as any).mockReturnValue({
      image: mockImage,
      options: { preserveTransparency: true, autoTransparentBg: false },
      setStatus: mockSetStatus,
      setError: mockSetError,
    });

    render(<ConvertButton />);

    const button = screen.getByRole('button', { name: /ICOファイルに変換/i });
    await userEvent.click(button);

    expect(mockSetStatus).toHaveBeenCalledWith('converting');
    expect(mockSetError).toHaveBeenCalledWith(null);
    expect(mockMutate).toHaveBeenCalledWith({
      file: mockImage.file,
      options: { preserveTransparency: true, autoTransparentBg: false },
    });
  });

  it('変換中はローディング状態が表示される（要件4.2）', () => {
    (useImageStore as any).mockReturnValue({
      image: mockImage,
      options: { preserveTransparency: true, autoTransparentBg: false },
      setStatus: mockSetStatus,
      setError: mockSetError,
    });

    (useImageConversion as any).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    });

    render(<ConvertButton />);

    expect(screen.getByText('変換中...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /変換中/i })).toHaveAttribute('aria-busy', 'true');
  });

  it('Enterキーで変換を実行できる（アクセシビリティ）', async () => {
    (useImageStore as any).mockReturnValue({
      image: mockImage,
      options: { preserveTransparency: true, autoTransparentBg: false },
      setStatus: mockSetStatus,
      setError: mockSetError,
    });

    render(<ConvertButton />);

    const button = screen.getByRole('button', { name: /ICOファイルに変換/i });
    button.focus();

    await userEvent.keyboard('{Enter}');

    expect(mockMutate).toHaveBeenCalled();
  });

  it('ボタンにアイコンが表示される', () => {
    (useImageStore as any).mockReturnValue({
      image: mockImage,
      options: { preserveTransparency: true, autoTransparentBg: false },
      setStatus: mockSetStatus,
      setError: mockSetError,
    });

    render(<ConvertButton />);

    // Downloadアイコンが存在することを確認
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('ボタンにaria属性が正しく設定されている', () => {
    (useImageStore as any).mockReturnValue({
      image: mockImage,
      options: { preserveTransparency: true, autoTransparentBg: false },
      setStatus: mockSetStatus,
      setError: mockSetError,
    });

    render(<ConvertButton />);

    const button = screen.getByRole('button', { name: /ICOファイルに変換/i });
    expect(button).toHaveAttribute('aria-label', 'ICOファイルに変換');
    expect(button).toHaveAttribute('aria-busy', 'false');
  });

  it('変換中はaria-busyがtrueになる', () => {
    (useImageStore as any).mockReturnValue({
      image: mockImage,
      options: { preserveTransparency: true, autoTransparentBg: false },
      setStatus: mockSetStatus,
      setError: mockSetError,
    });

    (useImageConversion as any).mockImplementation((callbacks: any) => {
      mockOnSuccess = callbacks?.onSuccess;
      mockOnError = callbacks?.onError;
      return {
        mutate: mockMutate,
        isPending: true,
      };
    });

    render(<ConvertButton />);

    const button = screen.getByRole('button', { name: /変換中/i });
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('useImageConversionフックにonSuccessコールバックが渡される', () => {
    (useImageStore as any).mockReturnValue({
      image: mockImage,
      options: { preserveTransparency: true, autoTransparentBg: false },
      setStatus: mockSetStatus,
      setError: mockSetError,
    });

    render(<ConvertButton />);

    // useImageConversionが正しいコールバックで呼ばれたことを確認
    expect(useImageConversion).toHaveBeenCalled();
    expect(mockOnSuccess).toBeDefined();
    expect(mockOnError).toBeDefined();
  });
});
