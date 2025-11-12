/**
 * Electron環境検出ユーティリティ
 * 要件9.1, 9.4: WebUI版との機能パリティ維持
 */

/**
 * 更新情報の型定義
 */
export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

/**
 * 更新進捗の型定義
 */
export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

/**
 * Electron APIの型定義
 */
export interface ElectronAPI {
  // アプリケーション情報
  getAppVersion: () => Promise<string>;

  // ウィンドウ制御
  showWindow: () => Promise<void>;
  minimizeToTray: () => Promise<void>;

  // ファイル操作
  selectImageFile: () => Promise<{ path: string; buffer: ArrayBuffer; name: string } | null>;
  saveICOFile: (data: ArrayBuffer, defaultName: string) => Promise<string | null>;

  // 画像変換
  convertToICO: (imageData: ArrayBuffer, options: ConversionOptions) => Promise<ConversionResult>;
  validateImageFile: (buffer: ArrayBuffer, filename: string) => Promise<ValidationResult>;

  // 設定管理
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;

  // システム統合
  setFileAssociation: (enabled: boolean) => Promise<void>;

  // パフォーマンス監視
  getMemoryUsage: () => Promise<MemoryInfo>;
  getCPUUsage: () => Promise<number>;

  // イベントリスナー
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;
  onQuickConvert: (callback: (filePath: string) => void) => void;
  onUpdateProgress: (callback: (progress: UpdateProgress) => void) => void;

  // イベントリスナーの削除
  removeUpdateAvailableListener: () => void;
  removeUpdateDownloadedListener: () => void;
  removeQuickConvertListener: () => void;
  removeUpdateProgressListener: () => void;
}

export interface ElectronEnv {
  isElectron: boolean;
  platform: string;
  nodeVersion: string;
  chromeVersion: string;
  electronVersion: string;
}

export interface ConversionOptions {
  preserveTransparency: boolean;
  autoTransparentBg: boolean;
}

export interface ConversionResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
  processingTime: number;
}

export interface ValidationResult {
  isValid: boolean;
  format?: string;
  size?: number;
  error?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fileAssociation: boolean;
  startMinimized: boolean;
  autoUpdate: boolean;
}

export interface MemoryInfo {
  used: number;
  total: number;
  percentage: number;
}

/**
 * グローバルウィンドウオブジェクトの拡張
 */
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    electronEnv?: ElectronEnv;
  }
}

/**
 * Electron環境かどうかを判定
 */
export function isElectron(): boolean {
  return !!(window.electronAPI && window.electronEnv?.isElectron);
}

/**
 * Electron APIを取得（存在しない場合はエラー）
 * 要件3.3: IPC通信エラーハンドリング
 */
export function getElectronAPI(): ElectronAPI {
  if (!window.electronAPI) {
    throw new Error(
      'Electron API is not available. This feature is only available in the desktop app.'
    );
  }
  return window.electronAPI;
}

/**
 * Electron APIを安全に取得（存在しない場合はnull）
 */
export function getElectronAPISafe(): ElectronAPI | null {
  return window.electronAPI || null;
}

/**
 * IPC通信のエラーハンドリングラッパー
 * 要件3.3: IPC通信エラーハンドリングの実装
 */
export async function safeElectronCall<T>(fn: () => Promise<T>, fallback?: T): Promise<T | null> {
  try {
    if (!isElectron()) {
      console.warn('Electron API call attempted in non-Electron environment');
      return fallback !== undefined ? fallback : null;
    }
    return await fn();
  } catch (error) {
    console.error('Electron API call failed:', error);
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

/**
 * Electron環境情報を取得
 */
export function getElectronEnv(): ElectronEnv | null {
  return window.electronEnv || null;
}

/**
 * プラットフォーム情報を取得
 */
export function getPlatform(): string {
  if (isElectron() && window.electronEnv) {
    return window.electronEnv.platform;
  }
  return 'web';
}

/**
 * Electronバージョン情報を取得
 */
export async function getVersionInfo(): Promise<{
  app: string;
  electron?: string;
  chrome?: string;
  node?: string;
}> {
  const info: {
    app: string;
    electron?: string;
    chrome?: string;
    node?: string;
  } = {
    app: 'Unknown',
  };

  if (isElectron()) {
    try {
      info.app = await getElectronAPI().getAppVersion();
      if (window.electronEnv) {
        info.electron = window.electronEnv.electronVersion;
        info.chrome = window.electronEnv.chromeVersion;
        info.node = window.electronEnv.nodeVersion;
      }
    } catch (error) {
      console.error('Failed to get version info:', error);
    }
  }

  return info;
}
