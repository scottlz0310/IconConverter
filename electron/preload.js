const { contextBridge, ipcRenderer } = require("electron");

/**
 * セキュアなAPI公開（contextBridge使用）
 * 要件8.4: セキュアなIPC通信
 * 要件6.2: 最小限のシステム権限
 */

/**
 * 入力サニタイゼーション関数
 * 要件6.4, 6.5: 入力ファイル検証、悪意のあるファイルからの保護
 */
function sanitizeFilename(filename) {
  if (typeof filename !== "string") {
    throw new Error("Invalid filename type");
  }
  // 危険な文字を除去
  return filename.replace(/[<>:"/\\|?*]/g, "_").substring(0, 255);
}

/**
 * 画像データのバリデーション
 * 要件6.4: 入力ファイル検証
 */
function validateImageData(data) {
  if (!(data instanceof ArrayBuffer)) {
    throw new Error("Invalid image data format");
  }
  // 10MB制限（要件に基づく）
  if (data.byteLength > 10 * 1024 * 1024) {
    throw new Error("Image file too large (max 10MB)");
  }
  if (data.byteLength === 0) {
    throw new Error("Empty file");
  }
  return data;
}

/**
 * Electron APIの公開
 * レンダラープロセスから window.electronAPI でアクセス可能
 */
contextBridge.exposeInMainWorld("electronAPI", {
  // アプリケーション情報
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  // ウィンドウ制御
  showWindow: () => ipcRenderer.invoke("show-window"),
  minimizeToTray: () => ipcRenderer.invoke("minimize-to-tray"),
  backgroundConvert: (filePath, options) =>
    ipcRenderer.invoke("background-convert", filePath, options),

  // ファイル操作（要件2.3, 2.4: Native_Dialog、ドラッグ&ドロップ）
  selectImageFile: () => ipcRenderer.invoke("select-image-file"),
  selectMultipleImageFiles: () =>
    ipcRenderer.invoke("select-multiple-image-files"),
  saveICOFile: (data, defaultName) => {
    try {
      const sanitizedName = sanitizeFilename(defaultName);
      return ipcRenderer.invoke("save-ico-file", data, sanitizedName);
    } catch (error) {
      return Promise.reject(error);
    }
  },
  handleDroppedFile: (filePath) =>
    ipcRenderer.invoke("handle-dropped-file", filePath),
  getRecentFiles: () => ipcRenderer.invoke("get-recent-files"),
  clearRecentFiles: () => ipcRenderer.invoke("clear-recent-files"),
  showInFolder: (filePath) => ipcRenderer.invoke("show-in-folder", filePath),

  // 画像変換（要件1.1-1.5: 画像変換機能）
  convertToICO: (imageData, options) => {
    try {
      const validatedData = validateImageData(imageData);
      return ipcRenderer.invoke("convert-to-ico", validatedData, options);
    } catch (error) {
      return Promise.reject(error);
    }
  },

  // ファイルバリデーション（要件6.4: 入力ファイル検証）
  validateImageFile: (buffer, filename) => {
    try {
      const validatedData = validateImageData(buffer);
      const sanitizedName = sanitizeFilename(filename);
      return ipcRenderer.invoke(
        "validate-image-file",
        validatedData,
        sanitizedName,
      );
    } catch (error) {
      return Promise.reject(error);
    }
  },

  // 設定管理（要件3.3: ローカル設定保存）
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),

  // システム統合（要件2.1, 2.5: File_Association）
  setFileAssociation: (enabled) =>
    ipcRenderer.invoke("set-file-association", enabled),

  // パフォーマンス監視（要件4.3, 4.4: メモリ・CPU使用量）
  getMemoryUsage: () => ipcRenderer.invoke("get-memory-usage"),
  getCPUUsage: () => ipcRenderer.invoke("get-cpu-usage"),

  // コマンドライン引数からのファイル取得（要件2.1: コマンドライン引数での起動対応）
  getPendingFile: () => ipcRenderer.invoke("get-pending-file"),

  // イベントリスナー（一方向通信）
  onUpdateAvailable: (callback) => {
    ipcRenderer.on("update-available", (_event, info) => callback(info));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on("update-downloaded", (_event, info) => callback(info));
  },
  onQuickConvert: (callback) => {
    ipcRenderer.on("quick-convert", (_event, filePath) => callback(filePath));
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on("update-progress", (_event, progress) => callback(progress));
  },
  // 要件2.1: コマンドライン引数からのファイルオープン
  onOpenFileFromCLI: (callback) => {
    ipcRenderer.on("open-file-from-cli", (_event, filePath) =>
      callback(filePath),
    );
  },

  // イベントリスナーの削除
  removeUpdateAvailableListener: () => {
    ipcRenderer.removeAllListeners("update-available");
  },
  removeUpdateDownloadedListener: () => {
    ipcRenderer.removeAllListeners("update-downloaded");
  },
  removeQuickConvertListener: () => {
    ipcRenderer.removeAllListeners("quick-convert");
  },
  removeUpdateProgressListener: () => {
    ipcRenderer.removeAllListeners("update-progress");
  },
  removeOpenFileFromCLIListener: () => {
    ipcRenderer.removeAllListeners("open-file-from-cli");
  },
});

/**
 * 環境情報の公開
 */
contextBridge.exposeInMainWorld("electronEnv", {
  isElectron: true,
  platform: process.platform,
  nodeVersion: process.versions.node,
  chromeVersion: process.versions.chrome,
  electronVersion: process.versions.electron,
});

/**
 * セキュリティ: グローバルオブジェクトの保護
 */
window.addEventListener("DOMContentLoaded", () => {
  // プリロードスクリプトが正常に読み込まれたことを確認
  console.log("Preload script loaded successfully");
  console.log("Electron API available:", !!window.electronAPI);
});
