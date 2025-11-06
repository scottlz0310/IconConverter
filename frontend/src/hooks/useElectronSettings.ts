/**
 * Electron設定管理カスタムフック
 * 要件3.3: Electron固有状態の管理
 */

import { useEffect } from 'react';
import { useImageStore } from '../stores/imageStore';
import { isElectron, getElectronAPI } from '../utils/electron';
import type { ElectronSettings } from '../types';

/**
 * Electron設定を管理するカスタムフック
 *
 * Electron環境でのみ動作し、設定の読み込みと保存を行います。
 *
 * @example
 * ```tsx
 * function SettingsPanel() {
 *   const { settings, updateSettings } = useElectronSettings();
 *
 *   const handleToggleFileAssociation = async () => {
 *     await updateSettings({ fileAssociation: !settings?.fileAssociation });
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useElectronSettings() {
  const { electronSettings, setElectronSettings } = useImageStore();

  /**
   * Electron設定を読み込む
   */
  const loadSettings = async () => {
    if (!isElectron()) return;

    try {
      const electronAPI = getElectronAPI();
      const appSettings = await electronAPI.getSettings();

      const settings: ElectronSettings = {
        isMinimized: false,
        fileAssociation: appSettings.fileAssociation,
        autoUpdate: appSettings.autoUpdate,
        startMinimized: appSettings.startMinimized,
      };

      setElectronSettings(settings);
    } catch (error) {
      console.error('Failed to load Electron settings:', error);
    }
  };

  /**
   * Electron設定を更新する
   */
  const updateSettings = async (updates: Partial<ElectronSettings>) => {
    if (!isElectron()) return;

    try {
      const electronAPI = getElectronAPI();
      const currentSettings = electronSettings || {
        isMinimized: false,
        fileAssociation: false,
        autoUpdate: true,
        startMinimized: false,
      };

      const newSettings = { ...currentSettings, ...updates };

      // Electron APIに保存
      await electronAPI.saveSettings({
        theme: 'system',
        language: 'ja',
        fileAssociation: newSettings.fileAssociation,
        startMinimized: newSettings.startMinimized,
        autoUpdate: newSettings.autoUpdate,
      });

      // ファイル関連付けの設定
      if ('fileAssociation' in updates) {
        await electronAPI.setFileAssociation(updates.fileAssociation!);
      }

      // ストアを更新
      setElectronSettings(newSettings);
    } catch (error) {
      console.error('Failed to update Electron settings:', error);
      throw error;
    }
  };

  /**
   * ウィンドウを最小化
   */
  const minimizeToTray = async () => {
    if (!isElectron()) return;

    try {
      const electronAPI = getElectronAPI();
      await electronAPI.minimizeToTray();

      if (electronSettings) {
        setElectronSettings({ ...electronSettings, isMinimized: true });
      }
    } catch (error) {
      console.error('Failed to minimize to tray:', error);
    }
  };

  /**
   * ウィンドウを表示
   */
  const showWindow = async () => {
    if (!isElectron()) return;

    try {
      const electronAPI = getElectronAPI();
      await electronAPI.showWindow();

      if (electronSettings) {
        setElectronSettings({ ...electronSettings, isMinimized: false });
      }
    } catch (error) {
      console.error('Failed to show window:', error);
    }
  };

  /**
   * 初回マウント時に設定を読み込む
   */
  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    settings: electronSettings,
    loadSettings,
    updateSettings,
    minimizeToTray,
    showWindow,
  };
}
