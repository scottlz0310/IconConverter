const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

// セキュリティ設定: 最小限のシステム権限で実行
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");

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
    backgroundColor: "#ffffff",
    webPreferences: {
      // セキュリティ設定
      nodeIntegration: false, // Node.js統合無効
      contextIsolation: true, // コンテキスト分離有効
      enableRemoteModule: false, // リモートモジュール無効
      sandbox: false, // 画像処理のためサンドボックス無効（必要に応じて）
      webSecurity: true, // Webセキュリティ有効
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "../assets/icon.png"),
  });

  // 開発環境とプロダクション環境の切り替え
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    // 開発ツールを開く
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../frontend/dist/index.html"));
  }

  // ウィンドウの準備が完了したら表示（要件4.1: 起動時間最適化）
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // CSP設定（セキュリティ強化）
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob:; " +
              "connect-src 'self' http://localhost:* ws://localhost:*;",
          ],
        },
      });
    },
  );

  // 外部ナビゲーション防止（セキュリティ）
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    // 開発環境ではlocalhostを許可
    if (process.env.NODE_ENV === "development") {
      if (!parsedUrl.origin.startsWith("http://localhost")) {
        event.preventDefault();
      }
    } else {
      if (parsedUrl.origin !== "file://") {
        event.preventDefault();
      }
    }
  });

  // 新しいウィンドウ作成防止（セキュリティ）
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });

  // ウィンドウが閉じられたときの処理
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * アプリケーション起動時の処理
 */
app.whenReady().then(() => {
  createWindow();

  // macOS: Dockアイコンクリック時の処理
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // 自動更新チェック（プロダクション環境のみ）
  if (process.env.NODE_ENV !== "development") {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

/**
 * すべてのウィンドウが閉じられたときの処理
 */
app.on("window-all-closed", () => {
  // macOS以外ではアプリケーションを終了
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * アプリケーション終了前の処理
 */
app.on("before-quit", () => {
  // クリーンアップ処理
});

/**
 * IPC通信ハンドラー
 */

// サービスの遅延ロード（要件4.1: 起動時間最適化）
let ImageConverterService = null;
let FileManager = null;

function getImageConverterService() {
  if (!ImageConverterService) {
    ImageConverterService = require("./services/image-converter");
  }
  return ImageConverterService;
}

function getFileManager() {
  if (!FileManager) {
    FileManager = require("./services/file-manager");
  }
  return FileManager;
}

// アプリケーションバージョン取得
ipcMain.handle("get-app-version", async () => {
  return app.getVersion();
});

// ウィンドウ表示
ipcMain.handle("show-window", async () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// 画像変換（要件1.1-1.5: 画像変換機能）
ipcMain.handle("convert-to-ico", async (event, imageData, options) => {
  try {
    const service = getImageConverterService();
    const buffer = Buffer.from(imageData);
    const result = await service.convertToICO(buffer, options);

    if (result.success) {
      // ArrayBufferとして返す
      return {
        success: true,
        data: result.data.buffer.slice(
          result.data.byteOffset,
          result.data.byteOffset + result.data.byteLength,
        ),
        processingTime: result.processingTime,
        metadata: result.metadata,
      };
    } else {
      return result;
    }
  } catch (error) {
    console.error("IPC convert-to-ico error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// 画像ファイル検証（要件6.4: 入力ファイル検証）
ipcMain.handle("validate-image-file", async (event, buffer, filename) => {
  try {
    const service = getImageConverterService();
    const imageBuffer = Buffer.from(buffer);
    const result = await service.validateImageFile(imageBuffer, filename);
    return result;
  } catch (error) {
    console.error("IPC validate-image-file error:", error);
    return {
      isValid: false,
      error: error.message,
    };
  }
});

// ファイル選択ダイアログ（要件2.3: Native_Dialog使用）
ipcMain.handle("select-image-file", async () => {
  try {
    const fileManager = getFileManager();
    const result = await fileManager.selectImageFile(mainWindow);

    if (result) {
      // 最近使用したファイルに追加
      await fileManager.addRecentFile(result.path);
    }

    return result;
  } catch (error) {
    console.error("IPC select-image-file error:", error);
    return null;
  }
});

// 複数ファイル選択ダイアログ
ipcMain.handle("select-multiple-image-files", async () => {
  try {
    const fileManager = getFileManager();
    const results = await fileManager.selectMultipleImageFiles(mainWindow);

    // 最近使用したファイルに追加
    for (const result of results) {
      await fileManager.addRecentFile(result.path);
    }

    return results;
  } catch (error) {
    console.error("IPC select-multiple-image-files error:", error);
    return [];
  }
});

// ファイル保存ダイアログ（要件2.3: Native_Dialog使用）
ipcMain.handle("save-ico-file", async (event, data, defaultName) => {
  try {
    const fileManager = getFileManager();
    const savePath = await fileManager.saveICOFile(
      mainWindow,
      data,
      defaultName,
    );

    if (savePath) {
      // 最近使用したファイルに追加
      await fileManager.addRecentFile(savePath);
    }

    return savePath;
  } catch (error) {
    console.error("IPC save-ico-file error:", error);
    throw error;
  }
});

// ドロップされたファイルの処理（要件2.4: ドラッグ&ドロップ対応）
ipcMain.handle("handle-dropped-file", async (event, filePath) => {
  try {
    const fileManager = getFileManager();
    const result = await fileManager.handleDroppedFile(filePath);

    if (result) {
      // 最近使用したファイルに追加
      await fileManager.addRecentFile(result.path);
    }

    return result;
  } catch (error) {
    console.error("IPC handle-dropped-file error:", error);
    return null;
  }
});

// 最近使用したファイルの取得
ipcMain.handle("get-recent-files", async () => {
  try {
    const fileManager = getFileManager();
    return await fileManager.getRecentFiles();
  } catch (error) {
    console.error("IPC get-recent-files error:", error);
    return [];
  }
});

// 最近使用したファイルのクリア
ipcMain.handle("clear-recent-files", async () => {
  try {
    const fileManager = getFileManager();
    await fileManager.clearRecentFiles();
    return { success: true };
  } catch (error) {
    console.error("IPC clear-recent-files error:", error);
    throw error;
  }
});

// ファイルをエクスプローラー/Finderで表示
ipcMain.handle("show-in-folder", async (event, filePath) => {
  try {
    const fileManager = getFileManager();
    fileManager.showInFolder(filePath);
    return { success: true };
  } catch (error) {
    console.error("IPC show-in-folder error:", error);
    throw error;
  }
});

// 設定取得（要件3.3: ローカル設定保存）
ipcMain.handle("get-settings", async () => {
  try {
    const fs = require("fs").promises;
    const settingsPath = path.join(app.getPath("userData"), "settings.json");

    try {
      const data = await fs.readFile(settingsPath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      // 設定ファイルが存在しない場合はデフォルト設定を返す
      return {
        theme: "system",
        language: "ja",
        fileAssociation: false,
        startMinimized: false,
        autoUpdate: true,
      };
    }
  } catch (error) {
    console.error("IPC get-settings error:", error);
    throw error;
  }
});

// 設定保存（要件3.3: ローカル設定保存）
ipcMain.handle("save-settings", async (event, settings) => {
  try {
    const fs = require("fs").promises;
    const settingsPath = path.join(app.getPath("userData"), "settings.json");

    // 設定の検証
    if (typeof settings !== "object" || settings === null) {
      throw new Error("Invalid settings format");
    }

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf8");
    return { success: true };
  } catch (error) {
    console.error("IPC save-settings error:", error);
    throw error;
  }
});

// ファイル関連付け設定（要件2.1, 2.5: File_Association）
ipcMain.handle("set-file-association", async (event, enabled) => {
  try {
    // システム統合サービスの遅延ロード
    const SystemIntegration = require("./services/system-integration");
    await SystemIntegration.setFileAssociation(enabled);
    return { success: true };
  } catch (error) {
    console.error("IPC set-file-association error:", error);
    throw error;
  }
});

// システムトレイへ最小化（要件2.2: System_Tray機能）
ipcMain.handle("minimize-to-tray", async () => {
  try {
    if (mainWindow) {
      mainWindow.hide();
    }
    return { success: true };
  } catch (error) {
    console.error("IPC minimize-to-tray error:", error);
    throw error;
  }
});

// パフォーマンス監視（要件4.3: メモリ使用量）
ipcMain.handle("get-memory-usage", async () => {
  const usage = process.memoryUsage();
  return {
    used: Math.round(usage.heapUsed / 1024 / 1024), // MB
    total: Math.round(usage.heapTotal / 1024 / 1024), // MB
    percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100),
    rss: Math.round(usage.rss / 1024 / 1024), // MB
  };
});

// CPU使用量監視（要件4.4: CPU使用量）
ipcMain.handle("get-cpu-usage", async () => {
  const usage = process.cpuUsage();
  return {
    user: usage.user,
    system: usage.system,
    percentage: Math.round((usage.user + usage.system) / 1000000), // 概算
  };
});

// エラーハンドリング
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // エラーログの記録（将来的に実装）
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // エラーログの記録（将来的に実装）
});
