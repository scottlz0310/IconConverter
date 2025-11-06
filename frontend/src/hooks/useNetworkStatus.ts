/**
 * ネットワーク状態監視カスタムフック
 * 要件3.1: オフライン動作対応
 */

import { useState, useEffect } from 'react';
import { isElectron } from '../utils/electron';

/**
 * ネットワーク状態を監視するカスタムフック
 *
 * Electron環境では常にオンライン扱い（ローカル処理のため）
 * Web環境ではNavigator Online APIを使用
 *
 * @example
 * ```tsx
 * function App() {
 *   const { isOnline, isOfflineMode } = useNetworkStatus();
 *
 *   return (
 *     <div>
 *       {!isOnline && !isOfflineMode && (
 *         <div>オフラインです。インターネット接続を確認してください。</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNetworkStatus() {
  const isOfflineMode = isElectron(); // Electron環境は常にオフラインモード対応

  // Electron環境では常にオンライン、Web環境では実際の状態を使用
  const [isOnline, setIsOnline] = useState(() => {
    return isOfflineMode ? true : navigator.onLine;
  });

  useEffect(() => {
    // Electron環境では何もしない
    if (isOfflineMode) {
      return;
    }

    // Web環境でのネットワーク状態監視
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // イベントリスナーを登録
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // クリーンアップ
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [isOfflineMode]);

  return {
    isOnline,
    isOfflineMode,
    canConvert: isOfflineMode || isOnline, // オフラインモードまたはオンラインなら変換可能
  };
}
