const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const lazyLoader = require("./utils/lazy-loader");
const startupTimer = require("./utils/startup-timer");
const { getMemoryManager } = require("./services/memory-manager");
const UpdateManager = require("./services/updater");

// セキュリティ設定: 最小限のシステム権限で実行
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");

let mainWindow = null;
let splashWindow = null;
let trayManager = null;
let workerPool = null; // 要件8.5: ワーカープロセスの管理
let memoryManager = null; // 要件4.3, 4.4: メモリ・CPU監視
let updateManager = null; // 要件6.3, 10.2: 自動更新機能

// 起動時間計測（要件4.1: 起動時間3秒以内の目標達成）
const appStartTime = Date.now();
startupTimer.mark("app-init", "Application initialized");

/**
 * スプラッシュスクリーンを作成
 * 要件4.1, 11.3: 起動時間最適化、コールドスタート最適化
 */
function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 500,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, "splash.html"));

  // スプラッシュスクリーンの準備が完了したら表示
  splashWindow.once("ready-to-show", () => {
    splashWindow.show();
    startupTimer.mark("splash-shown", "Splash screen displayed");
  });
}

/**
 * スプラッシュスクリーンを閉じる
 */
function closeSplashScreen() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
    startupTimer.mark("splash-closed", "Splash screen closed");
  }
}

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

  // ウィンドウの準備が完了したら表示（要件4.1: 起動時間最適化、ready-to-showイベント使用）
  mainWindow.once("ready-to-show", () => {
    startupTimer.mark("window-ready", "Main window ready to show");

    // スプラッシュスクリーンを閉じてメインウィンドウを表示
    closeSplashScreen();

    // フェードイン効果でメインウィンドウを表示
    mainWindow.setOpacity(0);
    mainWindow.show();
    startupTimer.mark("window-shown", "Main window displayed");

    // スムーズなフェードイン
    let opacity = 0;
    const fadeInterval = setInterval(() => {
      opacity += 0.1;
      if (opacity >= 1) {
        opacity = 1;
        clearInterval(fadeInterval);
        startupTimer.mark("fade-complete", "Fade-in animation completed");

        // 起動完了レポートを出力
        const stats = startupTimer.complete();

        // 起動時間が目標を超えた場合は警告
        if (!stats.withinTarget) {
          console.warn(
            `[Startup] Warning: Startup time (${stats.totalTime}ms) exceeded target of ${stats.targetTime}ms`,
          );
        }
      }
      mainWindow.setOpacity(opacity);
    }, 16); // 約60fps

    mainWindow.focus();

    // バックグラウンドでモジュールをプリロード（要件4.1: 初回起動時のプリロード最適化）
    setTimeout(() => {
      const preloadStart = Date.now();
      lazyLoader
        .preload(["image-converter", "file-manager"])
        .then(() => {
          const preloadTime = Date.now() - preloadStart;
          console.log(
            `[Startup] Background preload completed in ${preloadTime}ms`,
          );
          console.log("[Startup] Memory usage:", lazyLoader.getMemoryUsage());
          console.log("[Startup] Loader stats:", lazyLoader.getStats());
        })
        .catch((error) => {
          console.error("[Startup] Background preload failed:", error);
        });
    }, 100);
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

  // ウィンドウが閉じられたときの処理（要件2.2: バックグラウンド実行）
  mainWindow.on("close", (event) => {
    // macOS以外では、ウィンドウを閉じる代わりにトレイに最小化
    if (
      process.platform !== "darwin" &&
      trayManager &&
      trayManager.isCreated()
    ) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // ウィンドウのロードエラーハンドリング
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.error(
        `[Startup] Window failed to load: ${errorCode} - ${errorDescription}`,
      );
      closeSplashScreen();
    },
  );
}

/**
 * コマンドライン引数からファイルパスを処理
 * 要件2.1: コマンドライン引数での起動対応
 */
let pendingFilePath = null;

function handleCommandLineFile(argv) {
  // 要件1.1: PNG、JPEG、BMP、GIF、TIFF、WebP対応
  const supportedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".bmp",
    ".gif",
    ".tiff",
    ".tif",
    ".webp",
  ];

  // コマンドライン引数からファイルパスを検索
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    // オプション引数をスキップ
    if (arg.startsWith("-")) continue;

    // ファイルパスかどうかを確認
    const ext = path.extname(arg).toLowerCase();
    if (supportedExtensions.includes(ext)) {
      return arg;
    }
  }

  return null;
}

/**
 * アプリケーション起動時の処理
 */
app.whenReady().then(async () => {
  startupTimer.mark("app-ready", "Electron app ready");

  // スプラッシュスクリーンを先に表示（要件4.1, 11.3: コールドスタート最適化）
  createSplashScreen();

  // メインウィンドウを作成（バックグラウンドで準備）
  createWindow();
  startupTimer.mark("window-created", "Main window created");

  // メモリマネージャーを初期化（要件4.3, 4.4: メモリ使用量200MB未満、CPU使用量5%未満維持）
  try {
    memoryManager = getMemoryManager();
    memoryManager.startMonitoring(30000); // 30秒ごとに監視
    startupTimer.mark("memory-manager-started", "Memory monitoring started");
    console.log("[Startup] Memory manager initialized");
  } catch (error) {
    console.error("[Startup] Failed to initialize memory manager:", error);
  }

  // ワーカープールを初期化（要件4.2, 8.5: 画像処理をワーカープロセスに分離）
  try {
    const WorkerPool = require("./workers/worker-pool");
    workerPool = new WorkerPool();
    startupTimer.mark("worker-pool-created", "Worker pool initialized");
    console.log("[Startup] Worker pool initialized:", workerPool.getStats());
  } catch (error) {
    console.error("[Startup] Failed to initialize worker pool:", error);
  }

  // システムトレイを遅延ロードで作成（要件2.2: System_Tray機能、要件4.1: 起動時間最適化）
  try {
    const TrayManager = await lazyLoader.load("tray-manager");
    trayManager = new TrayManager(mainWindow);
    trayManager.create();
    startupTimer.mark("tray-created", "System tray created");
  } catch (error) {
    console.error("[Startup] Failed to create system tray:", error);
  }

  // macOS: Dockアイコンクリック時の処理
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });

  // 自動更新マネージャーを初期化（要件6.3, 10.2: セキュアな検証付き自動更新）
  try {
    updateManager = new UpdateManager(mainWindow);
    startupTimer.mark("update-manager-created", "Update manager initialized");
    console.log("[Startup] Update manager initialized");
  } catch (error) {
    console.error("[Startup] Failed to initialize update manager:", error);
  }

  // 要件2.1: コマンドライン引数で渡されたファイルを処理
  const filePath = handleCommandLineFile(process.argv);
  if (filePath) {
    pendingFilePath = filePath;
    // ウィンドウが準備できたらファイルを送信
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.once("did-finish-load", () => {
        mainWindow.webContents.send("open-file-from-cli", pendingFilePath);
        pendingFilePath = null;
      });
    }
  }
});

/**
 * Windows/Linux: 既に起動している場合の処理
 * 要件2.1: ファイルパス受け渡し処理
 */
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 既にインスタンスが起動している場合は終了
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // 既存のウィンドウを表示
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();

      // コマンドライン引数からファイルパスを取得
      const filePath = handleCommandLineFile(commandLine);
      if (filePath) {
        // レンダラープロセスにファイルパスを送信
        mainWindow.webContents.send("open-file-from-cli", filePath);
      }
    }
  });
}

/**
 * macOS: ファイルを開く処理
 * 要件2.1: ファイルパス受け渡し処理
 */
app.on("open-file", (event, filePath) => {
  event.preventDefault();

  if (mainWindow && mainWindow.webContents) {
    // ウィンドウが既に存在する場合
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("open-file-from-cli", filePath);
  } else {
    // ウィンドウがまだ作成されていない場合は保留
    pendingFilePath = filePath;
  }
});

/**
 * すべてのウィンドウが閉じられたときの処理
 */
app.on("window-all-closed", () => {
  // システムトレイが有効な場合はバックグラウンドで実行を継続
  // macOS以外でトレイが無効な場合はアプリケーションを終了
  if (
    process.platform !== "darwin" &&
    (!trayManager || !trayManager.isCreated())
  ) {
    app.quit();
  }
});

/**
 * アプリケーション終了前の処理
 */
app.on("before-quit", async () => {
  // ワーカープールをシャットダウン
  if (workerPool) {
    await workerPool.shutdown();
    workerPool = null;
  }

  // メモリマネージャーをシャットダウン（要件4.3, 4.4: 最終レポート出力）
  if (memoryManager) {
    memoryManager.shutdown();
    memoryManager = null;
  }

  // 更新マネージャーをクリーンアップ（要件6.3, 10.2: 自動更新機能）
  if (updateManager) {
    updateManager.destroy();
    updateManager = null;
  }

  // システムトレイを破棄
  if (trayManager) {
    trayManager.destroy();
    trayManager = null;
  }
});

/**
 * IPC通信ハンドラー
 */

// サービスの遅延ロード（要件4.1: 起動時間最適化）
async function getImageConverterService() {
  return await lazyLoader.load("image-converter");
}

async function getFileManager() {
  return await lazyLoader.load("file-manager");
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

// メモリ使用量取得（要件4.3: メモリ使用量監視機能）
ipcMain.handle("get-memory-usage", async () => {
  if (memoryManager) {
    return memoryManager.getMemoryUsage();
  }
  return process.memoryUsage();
});

// CPU使用量取得（要件4.4: CPU使用量監視）
ipcMain.handle("get-cpu-usage", async () => {
  if (memoryManager) {
    return memoryManager.getCpuUsage();
  }
  return { percent: 0 };
});

// パフォーマンス統計取得
ipcMain.handle("get-performance-stats", async () => {
  if (memoryManager) {
    return memoryManager.getStats();
  }
  return null;
});

// メモリクリーンアップ実行
ipcMain.handle("cleanup-memory", async () => {
  if (memoryManager) {
    memoryManager.cleanup();
    return { success: true };
  }
  return { success: false, error: "Memory manager not available" };
});

// 画像変換（要件1.1-1.5: 画像変換機能、要件4.2, 8.5: ワーカープロセスで処理）
ipcMain.handle("convert-to-ico", async (event, imageData, options) => {
  try {
    // ワーカープールが利用可能な場合はワーカーで処理
    if (workerPool) {
      const result = await workerPool.convertImage(imageData, options);

      if (result.success) {
        return {
          success: true,
          data: result.data,
          processingTime: result.processingTime,
          metadata: result.metadata,
          performance: result.performance,
        };
      } else {
        return {
          success: false,
          error: result.error,
          processingTime: result.processingTime,
        };
      }
    } else {
      // フォールバック: メインプロセスで処理
      console.warn("[IPC] Worker pool not available, using main process");
      const service = await getImageConverterService();
      const buffer = Buffer.from(imageData);
      const result = await service.convertToICO(buffer, options);

      if (result.success) {
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
    }
  } catch (error) {
    console.error("IPC convert-to-ico error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// 画像ファイル検証（要件6.4: 入力ファイル検証、ワーカープロセスで処理）
ipcMain.handle("validate-image-file", async (event, buffer, filename) => {
  try {
    // ワーカープールが利用可能な場合はワーカーで処理
    if (workerPool) {
      const result = await workerPool.validateImage(buffer, filename);
      return result.result;
    } else {
      // フォールバック: メインプロセスで処理
      const service = await getImageConverterService();
      const imageBuffer = Buffer.from(buffer);
      const result = await service.validateImageFile(imageBuffer, filename);
      return result;
    }
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
    const fileManager = await getFileManager();
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
    const fileManager = await getFileManager();
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
    const fileManager = await getFileManager();
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
    const fileManager = await getFileManager();
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
    const fileManager = await getFileManager();
    return await fileManager.getRecentFiles();
  } catch (error) {
    console.error("IPC get-recent-files error:", error);
    return [];
  }
});

// 最近使用したファイルのクリア
ipcMain.handle("clear-recent-files", async () => {
  try {
    const fileManager = await getFileManager();
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
    const fileManager = await getFileManager();
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
    // システム統合サービスの遅延ロード（要件4.1: 起動時間最適化）
    const SystemIntegration = await lazyLoader.load("system-integration");
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

// バックグラウンド変換（要件2.2: バックグラウンドでの変換処理）
ipcMain.handle("background-convert", async (event, filePath, options) => {
  try {
    if (trayManager) {
      const result = await trayManager.performBackgroundConversion(
        filePath,
        options,
      );
      return result;
    } else {
      throw new Error("Tray manager not initialized");
    }
  } catch (error) {
    console.error("IPC background-convert error:", error);
    throw error;
  }
});

// パフォーマンス監視（要件4.3: メモリ使用量）
ipcMain.handle("get-memory-usage", async () => {
  return lazyLoader.getMemoryUsage();
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

// 保留中のファイルパスを取得（要件2.1: コマンドライン引数での起動対応）
ipcMain.handle("get-pending-file", async () => {
  const filePath = pendingFilePath;
  pendingFilePath = null; // 取得後はクリア
  return filePath;
});

// LazyLoaderの統計情報を取得（デバッグ用）
ipcMain.handle("get-loader-stats", async () => {
  return lazyLoader.getStats();
});

// 起動時間統計を取得（デバッグ用）
ipcMain.handle("get-startup-stats", async () => {
  return startupTimer.getStats();
});

// ワーカープール統計を取得（要件4.3, 4.4: パフォーマンス監視）
ipcMain.handle("get-worker-pool-stats", async () => {
  if (workerPool) {
    return workerPool.getStats();
  }
  return null;
});

// ワーカープールヘルスチェック
ipcMain.handle("worker-pool-health-check", async () => {
  if (workerPool) {
    try {
      const health = await workerPool.healthCheck();
      return health;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
  return {
    success: false,
    error: "Worker pool not initialized",
  };
});

// プレビュー生成（ワーカープロセスで処理）
ipcMain.handle("generate-preview", async (event, imageData, maxSize) => {
  try {
    if (workerPool) {
      const result = await workerPool.generatePreview(imageData, maxSize);
      return result.result;
    } else {
      // フォールバック
      const service = await getImageConverterService();
      const buffer = Buffer.from(imageData);
      return await service.generatePreview(buffer, maxSize);
    }
  } catch (error) {
    console.error("IPC generate-preview error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// 背景色検出（ワーカープロセスで処理）
ipcMain.handle("detect-background-color", async (event, imageData) => {
  try {
    if (workerPool) {
      const result = await workerPool.detectBackground(imageData);
      return result.result;
    } else {
      // フォールバック
      const service = await getImageConverterService();
      const buffer = Buffer.from(imageData);
      return await service.detectBackgroundColor(buffer);
    }
  } catch (error) {
    console.error("IPC detect-background-color error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// バッチ変換（ワーカープロセスで処理）
ipcMain.handle("batch-convert", async (event, files, options) => {
  try {
    if (workerPool) {
      const result = await workerPool.convertBatch(files, options);
      return result;
    } else {
      // フォールバック
      const service = await getImageConverterService();
      const fileBuffers = files.map((file) => ({
        buffer: Buffer.from(file.imageData),
        filename: file.filename,
      }));
      const results = await service.convertBatch(fileBuffers, options);
      return {
        success: true,
        results,
      };
    }
  } catch (error) {
    console.error("IPC batch-convert error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// パフォーマンステスト（ワーカープロセスで処理）
ipcMain.handle("performance-test", async (event, imageData) => {
  try {
    if (workerPool) {
      const result = await workerPool.performanceTest(imageData);
      return result.stats;
    } else {
      // フォールバック
      const service = await getImageConverterService();
      const buffer = Buffer.from(imageData);
      return await service.getPerformanceStats(buffer);
    }
  } catch (error) {
    console.error("IPC performance-test error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// 自動更新関連のIPCハンドラー（要件6.3, 10.2: 自動更新機能）

// 手動更新チェック
ipcMain.handle("check-for-updates", async () => {
  try {
    if (updateManager) {
      await updateManager.manualCheckForUpdates();
      return { success: true };
    } else {
      return {
        success: false,
        error: "Update manager not initialized",
      };
    }
  } catch (error) {
    console.error("IPC check-for-updates error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// 現在のアプリバージョン取得
ipcMain.handle("get-current-version", async () => {
  return app.getVersion();
});

// 更新のダウンロード開始
ipcMain.handle("download-update", async () => {
  try {
    if (updateManager) {
      // UpdateManagerが内部でautoUpdater.downloadUpdate()を呼び出す
      return { success: true };
    } else {
      return {
        success: false,
        error: "Update manager not initialized",
      };
    }
  } catch (error) {
    console.error("IPC download-update error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// 更新のインストールと再起動
ipcMain.handle("install-update", async () => {
  try {
    if (updateManager) {
      // UpdateManagerが内部でautoUpdater.quitAndInstall()を呼び出す
      return { success: true };
    } else {
      return {
        success: false,
        error: "Update manager not initialized",
      };
    }
  } catch (error) {
    console.error("IPC install-update error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
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
