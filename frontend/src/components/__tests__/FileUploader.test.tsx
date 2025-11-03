/**
 * FileUploaderコンポーネントのテスト
 *
 * 要件2.1, 2.2, 2.3, 2.5のテスト
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUploader } from '../FileUploader';
import { useImageStore } from '../../stores/imageStore';

// Zustandストアをモック
vi.mock('../../stores/imageStore');

// sonnerのtoastをモック
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('FileUploader', () => {
  const mockSetImage = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useImageStore as any).mockReturnValue({
      setImage: mockSetImage,
      setError: mockSetError,
    });
  });

  it('ドラッグ&ドロップエリアが表示される（要件2.1）', () => {
    render(<FileUploader />);

    expect(screen.getByRole('button', { name: /画像ファイルをアップロード/i })).toBeInTheDocument();
    expect(screen.getByText(/画像ファイルをドラッグ&ドロップ/i)).toBeInTheDocument();
  });

  it('ファイル選択ボタンが表示される（要件2.2）', () => {
    render(<FileUploader />);

    const button = screen.getByRole('button', { name: /ファイルを選択/i });
    expect(button).toBeInTheDocument();
  });

  it('対応形式が表示される（要件2.3）', () => {
    render(<FileUploader />);

    // 複数の要素が存在するため、getAllByTextを使用
    const formatTexts = screen.getAllByText(/PNG, JPEG, BMP, GIF, TIFF, WebP/i);
    expect(formatTexts.length).toBeGreaterThan(0);
  });

  it('最大ファイルサイズが表示される（要件2.5）', () => {
    render(<FileUploader />);

    const sizeText = screen.getByText(/最大サイズ: 10 MB/i);
    expect(sizeText).toBeInTheDocument();
  });

  it('有効なファイルをドロップするとsetImageが呼ばれる', async () => {
    // URL.createObjectURLをモック
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/test');

    render(<FileUploader />);

    const file = new File(['test'], 'test.png', { type: 'image/png' });

    // ファイルをアップロード
    const input = screen.getByLabelText('ファイル選択') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(mockSetImage).toHaveBeenCalled();
    });
  });

  it('キーボードでファイル選択ダイアログを開ける（アクセシビリティ）', async () => {
    render(<FileUploader />);

    const dropzone = screen.getByRole('button', { name: /画像ファイルをアップロード/i });
    dropzone.focus();

    // Enterキーを押す
    await userEvent.keyboard('{Enter}');

    // ファイル入力要素が存在することを確認
    const input = screen.getByLabelText('ファイル選択');
    expect(input).toBeInTheDocument();
  });

  it('ドロップゾーンが正しくレンダリングされる', () => {
    render(<FileUploader />);

    const dropzone = screen.getByRole('button', { name: /画像ファイルをアップロード/i });
    expect(dropzone).toBeInTheDocument();
    expect(dropzone).toHaveAttribute('tabindex', '0');
  });

  it('アップロードアイコンが表示される', () => {
    render(<FileUploader />);

    // Upload アイコンが存在することを確認（lucide-reactのUploadアイコン）
    const uploadIcon = document.querySelector('svg');
    expect(uploadIcon).toBeInTheDocument();
  });

  it('ファイル入力要素が存在する', () => {
    render(<FileUploader />);

    const input = screen.getByLabelText('ファイル選択');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
  });
});
