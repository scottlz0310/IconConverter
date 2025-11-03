/**
 * ConversionOptionsコンポーネントのテスト
 *
 * 要件3.1, 3.2, 3.3, 3.4, 3.5のテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversionOptions } from '../ConversionOptions';
import { useImageStore } from '../../stores/imageStore';

// Zustandストアをモック
vi.mock('../../stores/imageStore');

describe('ConversionOptions', () => {
  const mockSetOptions = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('透明化保持オプションが表示される（要件3.1）', () => {
    (useImageStore as any).mockReturnValue({
      options: { preserveTransparency: true, autoTransparentBg: false },
      status: 'idle',
      setOptions: mockSetOptions,
    });

    render(<ConversionOptions />);

    expect(screen.getByLabelText('透明化保持')).toBeInTheDocument();
    expect(screen.getByText(/既存の透明度を保持/i)).toBeInTheDocument();
  });

  it('自動背景透明化オプションが表示される（要件3.2）', () => {
    (useImageStore as any).mockReturnValue({
      options: { preserveTransparency: true, autoTransparentBg: false },
      status: 'idle',
      setOptions: mockSetOptions,
    });

    render(<ConversionOptions />);

    expect(screen.getByLabelText('自動背景透明化')).toBeInTheDocument();
    expect(screen.getByText(/四隅のピクセルから単色背景を検出/i)).toBeInTheDocument();
  });

  it('デフォルトで透明化保持が有効（要件3.5）', () => {
    (useImageStore as any).mockReturnValue({
      options: { preserveTransparency: true, autoTransparentBg: false },
      status: 'idle',
      setOptions: mockSetOptions,
    });

    render(<ConversionOptions />);

    const preserveCheckbox = screen.getByLabelText('透明化保持') as HTMLInputElement;
    const autoCheckbox = screen.getByLabelText('自動背景透明化') as HTMLInputElement;

    expect(preserveCheckbox.checked).toBe(true);
    expect(autoCheckbox.checked).toBe(false);
  });

  it('透明化保持を選択すると自動背景透明化が無効化される（要件3.3）', async () => {
    (useImageStore as any).mockReturnValue({
      options: { preserveTransparency: false, autoTransparentBg: true },
      status: 'idle',
      setOptions: mockSetOptions,
    });

    render(<ConversionOptions />);

    const preserveCheckbox = screen.getByLabelText('透明化保持');
    await userEvent.click(preserveCheckbox);

    expect(mockSetOptions).toHaveBeenCalledWith({
      preserveTransparency: true,
      autoTransparentBg: false,
    });
  });

  it('自動背景透明化を選択すると透明化保持が無効化される（要件3.4）', async () => {
    (useImageStore as any).mockReturnValue({
      options: { preserveTransparency: true, autoTransparentBg: false },
      status: 'idle',
      setOptions: mockSetOptions,
    });

    render(<ConversionOptions />);

    const autoCheckbox = screen.getByLabelText('自動背景透明化');
    await userEvent.click(autoCheckbox);

    expect(mockSetOptions).toHaveBeenCalledWith({
      preserveTransparency: false,
      autoTransparentBg: true,
    });
  });

  it('処理中はオプション変更が無効化される', () => {
    (useImageStore as any).mockReturnValue({
      options: { preserveTransparency: true, autoTransparentBg: false },
      status: 'converting',
      setOptions: mockSetOptions,
    });

    render(<ConversionOptions />);

    const preserveCheckbox = screen.getByLabelText('透明化保持') as HTMLInputElement;
    const autoCheckbox = screen.getByLabelText('自動背景透明化') as HTMLInputElement;

    expect(preserveCheckbox.disabled).toBe(true);
    expect(autoCheckbox.disabled).toBe(true);
  });

  it('キーボードでチェックボックスを操作できる（アクセシビリティ）', async () => {
    (useImageStore as any).mockReturnValue({
      options: { preserveTransparency: true, autoTransparentBg: false },
      status: 'idle',
      setOptions: mockSetOptions,
    });

    render(<ConversionOptions />);

    const preserveCheckbox = screen.getByLabelText('透明化保持');
    preserveCheckbox.focus();

    // Enterキーでトグル
    await userEvent.keyboard('{Enter}');

    expect(mockSetOptions).toHaveBeenCalled();
  });
});
