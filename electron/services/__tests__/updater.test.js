/**
 * UpdateManager テスト
 *
 * 自動更新機能の基本的な動作を検証します。
 */

const UpdateManager = require("../updater");
const { app } = require("electron");

// Electronモジュールのモック
jest.mock("electron", () => ({
  app: {
    getVersion: jest.fn(() => "1.0.0"),
    getPath: jest.fn((name) => {
      if (name === "userData") return "/tmp/test-user-data";
      return "/tmp";
    }),
    isPackaged: false,
  },
  dialog: {
    showMessageBox: jest.fn(() => Promise.resolve({ response: 0 })),
    showErrorBox: jest.fn(),
  },
}));

// electron-updaterのモック
jest.mock("electron-updater", () => ({
  autoUpdater: {
    autoDownload: false,
    autoInstallOnAppQuit: true,
    logger: null,
    setFeedURL: jest.fn(),
    checkForUpdates: jest.fn(() =>
      Promise.resolve({ updateInfo: { version: "1.1.0" } }),
    ),
    downloadUpdate: jest.fn(() => Promise.resolve()),
    quitAndInstall: jest.fn(),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

// fsのモック
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(() => Promise.reject({ code: "ENOENT" })),
    writeFile: jest.fn(() => Promise.resolve()),
  },
}));

describe("UpdateManager", () => {
  let updateManager;
  let mockWindow;

  beforeEach(() => {
    // モックウィンドウの作成
    mockWindow = {
      isDestroyed: jest.fn(() => false),
      webContents: {
        send: jest.fn(),
      },
    };

    // 環境変数をクリア
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    if (updateManager) {
      updateManager.destroy();
      updateManager = null;
    }
    jest.clearAllMocks();
  });

  describe("初期化", () => {
    test("UpdateManagerが正常に初期化される", () => {
      updateManager = new UpdateManager(mockWindow);
      expect(updateManager).toBeDefined();
      expect(updateManager.mainWindow).toBe(mockWindow);
    });

    test("開発環境では更新チェックが無効化される", () => {
      process.env.NODE_ENV = "development";
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      updateManager = new UpdateManager(mockWindow);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Auto-updater disabled in development mode"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("更新チェック", () => {
    test("checkForUpdatesが正常に実行される", async () => {
      const { autoUpdater } = require("electron-updater");
      updateManager = new UpdateManager(mockWindow);

      await updateManager.checkForUpdates();

      // 開発環境ではスキップされるため、呼び出されない
      expect(autoUpdater.checkForUpdates).not.toHaveBeenCalled();
    });

    test("手動更新チェックが正常に実行される", async () => {
      const { autoUpdater } = require("electron-updater");
      const { dialog } = require("electron");

      updateManager = new UpdateManager(mockWindow);

      await updateManager.manualCheckForUpdates();

      // 開発環境では情報ダイアログが表示される
      expect(dialog.showMessageBox).toHaveBeenCalled();
    });
  });

  describe("設定管理", () => {
    test("設定の読み込みが正常に動作する", async () => {
      updateManager = new UpdateManager(mockWindow);

      // loadSettingsは初期化時に呼ばれる
      await new Promise((resolve) => setTimeout(resolve, 100));

      // エラーが発生しないことを確認
      expect(updateManager.skipVersion).toBeNull();
    });

    test("設定の保存が正常に動作する", async () => {
      const fs = require("fs").promises;
      updateManager = new UpdateManager(mockWindow);
      updateManager.skipVersion = "1.1.0";

      await updateManager.saveSettings();

      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe("クリーンアップ", () => {
    test("destroyが正常に実行される", () => {
      const { autoUpdater } = require("electron-updater");
      updateManager = new UpdateManager(mockWindow);

      updateManager.destroy();

      expect(autoUpdater.removeAllListeners).toHaveBeenCalled();
      expect(updateManager.updateCheckInterval).toBeNull();
    });
  });

  describe("ダイアログ表示", () => {
    test("更新利用可能ダイアログが表示される", async () => {
      const { dialog } = require("electron");
      updateManager = new UpdateManager(mockWindow);

      const info = {
        version: "1.1.0",
        releaseNotes: "テストリリースノート",
      };

      await updateManager.showUpdateAvailableDialog(info);

      expect(dialog.showMessageBox).toHaveBeenCalledWith(
        mockWindow,
        expect.objectContaining({
          type: "info",
          title: "アップデートが利用可能",
          message: expect.stringContaining("1.1.0"),
        }),
      );
    });

    test("更新準備完了ダイアログが表示される", async () => {
      const { dialog } = require("electron");
      updateManager = new UpdateManager(mockWindow);

      const info = {
        version: "1.1.0",
      };

      await updateManager.showUpdateReadyDialog(info);

      expect(dialog.showMessageBox).toHaveBeenCalledWith(
        mockWindow,
        expect.objectContaining({
          type: "info",
          title: "アップデート準備完了",
          message: expect.stringContaining("1.1.0"),
        }),
      );
    });
  });
});
