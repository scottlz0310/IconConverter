/**
 * useThemeフックのユニットテスト
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';

describe('useTheme', () => {
  describe('初期状態', () => {
    it('デフォルトでsystemテーマが設定される', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('system');
    });

    it('ローカルストレージからテーマを読み込む', () => {
      localStorage.setItem('theme', 'dark');

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
    });

    it('無効なテーマ値の場合はsystemにフォールバック', () => {
      localStorage.setItem('theme', 'invalid');

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('system');
    });
  });

  describe('setTheme', () => {
    it('テーマを設定できる', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('lightテーマを設定できる', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
      expect(localStorage.getItem('theme')).toBe('light');
    });

    it('systemテーマを設定できる', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.theme).toBe('system');
      expect(localStorage.getItem('theme')).toBe('system');
    });
  });

  describe('toggleTheme', () => {
    it('lightからdarkに切り替えられる', () => {
      const { result } = renderHook(() => useTheme());

      // 初期状態をlightに設定
      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');

      // トグル
      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
    });

    it('darkからlightに切り替えられる', () => {
      const { result } = renderHook(() => useTheme());

      // 初期状態をdarkに設定
      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');

      // トグル
      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
    });

    it('複数回トグルできる', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      // 1回目のトグル
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('dark');

      // 2回目のトグル
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('light');

      // 3回目のトグル
      act(() => {
        result.current.toggleTheme();
      });
      expect(result.current.theme).toBe('dark');
    });
  });

  describe('resolvedTheme', () => {
    it('lightテーマの場合はresolvedThemeもlight', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.resolvedTheme).toBe('light');
    });

    it('darkテーマの場合はresolvedThemeもdark', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.resolvedTheme).toBe('dark');
    });

    it('systemテーマの場合はOSの設定に従う（ライトモード）', () => {
      // matchMediaをライトモードに設定
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false, // ダークモードではない
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.resolvedTheme).toBe('light');
    });

    it('systemテーマの場合はOSの設定に従う（ダークモード）', () => {
      // matchMediaをダークモードに設定
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: true, // ダークモード
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('system');
      });

      expect(result.current.resolvedTheme).toBe('dark');
    });
  });

  describe('DOM操作', () => {
    it('テーマ変更時にHTMLのクラスが更新される', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);

      act(() => {
        result.current.setTheme('light');
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
