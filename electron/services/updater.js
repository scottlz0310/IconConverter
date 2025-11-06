/**
 * 自動更新管理サービス
 *
 * electron-updaterを使用してアプリケーションの自動更新機能を提供します。
 * GitHub Releasesと連携し、セキュアな検証付きで更新を配信します。
 *
 * 要件:
 * - 6.3: セキュアな検証付き自動更新機能
 * - 10.2: electron-updaterの統合とGitHub Releases連携
 */

const { autoUpdater } = require("electron-updater");
const { dialog, app } = require("electron");
const path = require("path");
const fs = require("fs").promises;

class UpdateManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.updateCheckInterval = null;
    this.isChecking = false;
    this.skipVersion = null;

    this.setupAutoUpdater();
    this.loadSettings();
  }

  /**
   * 自動更新の初期設定
   * 要件6.3: セキュアな検証付き自動更新
   */
  setupAutoUpdater() {
    // 手動ダウンロード制御（ユーザーの確認後にダウンロード）
    autoUpdater.autoDownload = false;

    // アプリ終了時に自動インストール
    autoUpdater.autoInstallOnAppQuit = true;

    // ログ設定
    autoUpdater.logger = require("electron-log");
    autoUpdater.logger.transports.file.level = "info";

    // 開発環境では更新チェックを無効化
    if (process.env.NODE_ENV === "development" || !app.isPackaged) {
      console.log("Auto-updater disabled in development mode");
      autoUpdater.updateConfigPath = null;
      return;
    }

    // GitHub Releasesの設定（package.jsonのpublish設定を使用）
    // 要件10.2: GitHub Releasesとの連携
    autoUpdater.setFeedURL({
      provider: "github",
      owner: "iconconverter",
      repo: "iconconverter",
      private: false,
    });

    // 更新チェック間隔（4時間）
    this.startPeriodicUpdateCheck();

    // 更新イベントハンドラーの設定
    this.setupEventHandlers();
  }

  /**
   * 更新イベントハンドラーの設定
   */
  setupEventHandlers() {
    autoUpdater.on("checking-for-update", () => {
      console.log("更新を確認中...");
      this.isChecking = true;
    });

    autoUpdater.on("update-available", (info) => {
      console.log("更新が利用可能:", info.version);
      this.isChecking = false;

      // スキップ対象のバージョンかチェック
      if (this.skipVersion === info.version) {
        console.log(`バージョン ${info.version} はスキップされました`);
        return;
      }

      this.showUpdateAvailableDialog(info);
    });

    autoUpdater.on("update-not-available", (info) => {
      console.log("最新バージョンを使用中");
      this.isChecking = false;
    });

    autoUpdater.on("error", (error) => {
      console.error("更新エラー:", error);
      this.isChecking = false;

      // エラーは静かに処理（ユーザーに通知しない）
      // ネットワークエラーなどは一時的な問題の可能性があるため
    });

    autoUpdater.on("download-progress", (progressObj) => {
      const message = `ダウンロード中: ${Math.round(progressObj.percent)}%`;
      console.log(message);

      // レンダラープロセスに進捗を通知
      // 要件10.2: 更新通知UIの実装
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send("update-progress", {
          percent: progressObj.percent,
          transferred: progressObj.transferred,
          total: progressObj.total,
          bytesPerSecond: progressObj.bytesPerSecond,
        });
      }
    });

    autoUpdater.on("update-downloaded", (info) => {
      console.log("更新のダウンロード完了");
      this.showUpdateReadyDialog(info);
    });
  }

  /**
   * 定期的な更新チェックを開始
   */
  startPeriodicUpdateCheck() {
    // 起動時に更新チェック
    setTimeout(() => {
      this.checkForUpdates();
    }, 5000); // 起動から5秒後

    // 4時間ごとに更新チェック
    this.updateCheckInterval = setInterval(
      () => {
        this.checkForUpdates();
      },
      4 * 60 * 60 * 1000,
    );
  }

  /**
   * 更新チェックを実行
   * 要件10.2: バックグラウンド更新チェック
   */
  async checkForUpdates() {
    if (this.isChecking) {
      console.log("既に更新チェック中です");
      return;
    }

    if (process.env.NODE_ENV === "development" || !app.isPackaged) {
      console.log("開発環境では更新チェックをスキップします");
      return;
    }

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error("更新チェックに失敗:", error);
    }
  }

  /**
   * 更新が利用可能な場合のダイアログ表示
   * 要件10.2: 更新確認ダイアログ（日本語対応）
   */
  async showUpdateAvailableDialog(info) {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: "info",
      title: "アップデートが利用可能",
      message: `新しいバージョン ${info.version} が利用可能です。`,
      detail:
        `現在のバージョン: ${app.getVersion()}\n\n` +
        `リリースノート:\n${info.releaseNotes || "詳細はGitHubをご確認ください"}\n\n` +
        `ダウンロードしますか？`,
      buttons: ["今すぐダウンロード", "後で", "このバージョンをスキップ"],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });

    if (result.response === 0) {
      // 今すぐダウンロード
      console.log("更新のダウンロードを開始します");
      try {
        await autoUpdater.downloadUpdate();

        // ダウンロード開始の通知
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("update-downloading", info);
        }
      } catch (error) {
        console.error("更新のダウンロードに失敗:", error);
        this.showDownloadErrorDialog();
      }
    } else if (result.response === 2) {
      // このバージョンをスキップ
      this.skipVersion = info.version;
      await this.saveSettings();
      console.log(`バージョン ${info.version} をスキップします`);
    }
    // result.response === 1 の場合は何もしない（後で）
  }

  /**
   * 更新準備完了時のダイアログ表示
   * 要件10.2: 安全な再起動処理
   */
  async showUpdateReadyDialog(info) {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      // ウィンドウが閉じられている場合は次回起動時にインストール
      return;
    }

    const result = await dialog.showMessageBox(this.mainWindow, {
      type: "info",
      title: "アップデート準備完了",
      message: `バージョン ${info.version} のインストール準備が完了しました。`,
      detail:
        "アプリケーションを再起動してアップデートを適用します。\n" +
        "保存されていない作業がある場合は、先に保存してください。",
      buttons: ["今すぐ再起動", "次回起動時"],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });

    if (result.response === 0) {
      // 即座に再起動してインストール
      // 要件10.2: 安全な再起動処理
      console.log("アプリケーションを再起動して更新を適用します");

      // setImmediate: false - 即座に終了
      // forceRunAfter: true - 強制的に更新後にアプリを起動
      autoUpdater.quitAndInstall(false, true);
    }
    // result.response === 1 の場合は次回起動時に自動インストール
    // autoInstallOnAppQuit が true なので自動的に処理される
  }

  /**
   * ダウンロードエラーダイアログ表示
   */
  async showDownloadErrorDialog() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    await dialog.showMessageBox(this.mainWindow, {
      type: "error",
      title: "ダウンロードエラー",
      message: "更新のダウンロードに失敗しました。",
      detail: "インターネット接続を確認して、後でもう一度お試しください。",
      buttons: ["OK"],
    });
  }

  /**
   * 手動更新チェック（メニューから呼び出し）
   * 要件10.2: 手動更新チェック機能
   */
  async manualCheckForUpdates() {
    if (process.env.NODE_ENV === "development" || !app.isPackaged) {
      await dialog.showMessageBox(this.mainWindow, {
        type: "info",
        title: "更新チェック",
        message: "開発環境では更新チェックは利用できません。",
        buttons: ["OK"],
      });
      return;
    }

    if (this.isChecking) {
      await dialog.showMessageBox(this.mainWindow, {
        type: "info",
        title: "更新チェック",
        message: "既に更新を確認中です。しばらくお待ちください。",
        buttons: ["OK"],
      });
      return;
    }

    try {
      const result = await autoUpdater.checkForUpdates();

      // 更新が見つからなかった場合
      if (
        !result ||
        !result.updateInfo ||
        result.updateInfo.version === app.getVersion()
      ) {
        await dialog.showMessageBox(this.mainWindow, {
          type: "info",
          title: "更新チェック",
          message: "最新バージョンを使用しています。",
          detail: `現在のバージョン: ${app.getVersion()}`,
          buttons: ["OK"],
        });
      }
    } catch (error) {
      console.error("手動更新チェックエラー:", error);

      await dialog.showMessageBox(this.mainWindow, {
        type: "error",
        title: "更新チェックエラー",
        message: "アップデートの確認に失敗しました。",
        detail:
          "インターネット接続を確認してください。\n\n" +
          `エラー: ${error.message}`,
        buttons: ["OK"],
      });
    }
  }

  /**
   * 設定の読み込み
   */
  async loadSettings() {
    try {
      const settingsPath = path.join(
        app.getPath("userData"),
        "updater-settings.json",
      );
      const data = await fs.readFile(settingsPath, "utf8");
      const settings = JSON.parse(data);

      this.skipVersion = settings.skipVersion || null;
    } catch (error) {
      // ファイルが存在しない場合は無視
      if (error.code !== "ENOENT") {
        console.error("設定の読み込みエラー:", error);
      }
    }
  }

  /**
   * 設定の保存
   */
  async saveSettings() {
    try {
      const settingsPath = path.join(
        app.getPath("userData"),
        "updater-settings.json",
      );
      const settings = {
        skipVersion: this.skipVersion,
      };

      await fs.writeFile(
        settingsPath,
        JSON.stringify(settings, null, 2),
        "utf8",
      );
    } catch (error) {
      console.error("設定の保存エラー:", error);
    }
  }

  /**
   * クリーンアップ
   */
  destroy() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }

    // イベントリスナーを削除
    autoUpdater.removeAllListeners();
  }
}

module.exports = UpdateManager;
