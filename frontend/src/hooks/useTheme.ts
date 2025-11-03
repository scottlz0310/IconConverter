import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

/**
 * テーマ管理カスタムフック
 * ダークモード切替機能を提供
 * ローカルストレージにテーマ設定を保存
 */
export function useTheme() {
  // ローカルストレージまたはシステム設定から初期テーマを取得
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';

    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored;
    }

    return 'system';
  });

  // 実際に適用されているテーマ（systemの場合はOSの設定を反映）
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;

    // システムのダークモード設定を監視
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      let effectiveTheme: 'light' | 'dark';

      if (theme === 'system') {
        effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      } else {
        effectiveTheme = theme;
      }

      // HTMLのクラスを更新
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveTheme);

      setResolvedTheme(effectiveTheme);
    };

    updateTheme();

    // システムのテーマ変更を監視
    const listener = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', listener);

    return () => {
      mediaQuery.removeEventListener('change', listener);
    };
  }, [theme]);

  // テーマを設定する関数
  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  };

  // テーマをトグルする関数（light ⇔ dark）
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}
