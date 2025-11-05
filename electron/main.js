const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// セキュリティ設定: 最小限のシステム権限で実行
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

let mainWindow = null;

/**
 * セキュアなウィンドウを作成
 * 要件6.2, 8.4: セキュアなIPC通信、最小限のシステム権限
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // 要件4.1: 起動時間最適化のため準備完了まで非表示
    backgroundColor: '#ffffff',
    webPreferences: {
      // セキュリティ設定
      nodeIntegration: false,           // Node.js統合無効
      contextIsolation: true,           // コンテキスト分離有効
      enableRemoteModule: false,        // リモートモジュール無効
      sandbox: false,                   // 画像処理のためサンドボックス無効（必要に応じて）
      webSecurity: true,                // Webセキュリティ有効
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  // 開発環境とプロダクション環境の切り替え
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    // 開発ツールを開く
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }

  // ウィンドウの準備が完了したら表示（要件4.1: 起動時間最適化）
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // CSP設定（セキュリティ強化）
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob:; " +
          "connect-src 'self' http://localhost:* ws://localhost:*;"
        ]
      }
    });
  });

  // 外部ナビゲーション防止（セキュリティ）
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    // 開発環境ではlocalhostを許可
    if (process.env.NODE_ENV === 'development') {
      if (!parsedUrl.origin.startsWith('http://localhost')) {
        event.preventDefault();
      }
    } else {
      if (parsedUrl.origin !== 'file://') {
        event.preventDefault();
      }
    }
  });

  // 新しいウィンドウ作成防止（セキュリティ）
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // ウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * アプリケーション起動時の処理
 */
app.whenReady().then(() => {
  createWindow();

  // macOS: Dockアイコンクリック時の処理
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // 自動更新チェック（プロダクション環境のみ）
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

/**
 * すべてのウィンドウが閉じられたときの処理
 */
app.on('window-all-closed', () => {
  // macOS以外ではアプリケーションを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * アプリケーション終了前の処理
 */
app.on('before-quit', () => {
  // クリーンアップ処理
});

/**
 * IPC通信ハンドラー（基本実装）
 * 詳細な実装はフェーズ2で追加
 */

// アプリケーションバージョン取得
ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

// ウィンドウ表示
ipcMain.handle('show-window', async () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // エラーログの記録（将来的に実装）
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // エラーログの記録（将来的に実装）
});
