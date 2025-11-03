/**
 * ImagePreviewコンポーネントのテスト
 *
 * 要件2.4のテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImagePreview } from '../ImagePreview';
import { useImageStore } from '../../stores/imageStore';
import type { ImageFile } from '../../types';

// Zustandストアをモック
vi.mock('../../stores/imageStore');

// sonnerのtoastをモック
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}));

// URL.revokeObjectURLをモック
global.URL.revokeObjectURL = vi.fn();

describe('ImagePreview', () => {
  const mockReset = vi.fn();
  const mockImage: ImageFile = {
    file: new File(['test'], 'test.png', { type: 'image/png' }),
    preview: 'blob:http://localhost/test',
    name: 'test.png',
    size: 1024,
    type: 'image/png',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('画像が選択されていない場合は何も表示しない', () => {
    (useImageStore as any).mockReturnValue({
      image: null,
      status: 'idle',
      reset: mockReset,
    });

    const { container } = render(<ImagePreview />);
    expect(container.firstChild).toBeNull();
  });

  it('画像プレビューが表示される（要件2.4）', () => {
    (useImageStore as any).mockReturnValue({
      image: mockImage,
      status: 'idle',
      reset: mockReset,
    });

    render(<ImagePreview />);

    // CardTitleはheadingロールを持たないため、テキストで検索
    expect(screen.getByText('画像プレビュー')).toBeInTheDocument();
    expect(screen.getByAltText(/選択された画像: test.png/i)).toBeInTheDocument();
  });

  it('画像情報が表示される（要件2.4）', () => {
    (useImageStore as any).mockReturnValue({
      image: mockImage,
      status: 'idle',
      reset: mockReset,
    });

    render(<ImagePreview />);

    expect(screen.getByText('test.png')).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('PNG')).toBeInTheDocument();
  });

  it('削除ボタンをクリックするとresetが呼ばれる（要件2.4）', async () => {
    (useImageStore as any).mockReturnValue({
      image: mockImage,
      status: 'idle',
      reset: mockReset,
    });

    render(<ImagePreview />);

    const deleteButton = screen.getByRole('button', { name: /画像を削除/i });
    await userEvent.click(deleteButton);

    expect(mockReset).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockImage.preview);
  });

  it('処理中は削除ボタンが無効化される', () => {
    (useImageStore as any).mockReturnValue({
      image: mockImage,
      status: 'converting',
      reset: mockReset,
    });

    render(<ImagePreview />);

    const deleteButton = screen.getByRole('button', { name: /画像を削除/i }) as HTMLButtonElement;
    expect(deleteButton.disabled).toBe(true);
  });

  it('Deleteキーで画像を削除できる（アクセシビリティ）', async () => {
    (useImageStore as any).mockReturnValue({
      image: mockImage,
      status: 'idle',
      reset: mockReset,
    });

    const { container } = render(<ImagePreview />);

    // Cardにフォーカスを当ててからDeleteキーを押す
    const card = container.firstChild as HTMLElement;

    // fireEventを使用してkeydownイベントを直接発火
    const event = new KeyboardEvent('keydown', { key: 'Delete', bubbles: true });
    card.dispatchEvent(event);

    expect(mockReset).toHaveBeenCalled();
  });
});
