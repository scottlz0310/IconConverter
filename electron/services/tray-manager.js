/**
 * システムトレイマネージャー
 * 要件2.2: System_Trayでのバックグラウンド実行
 */

const {
  Tray,
  Menu,
  nativeImage,
  dialog,
  app,
  Notification,
} = require("electron");
const path = require("path");

class TrayManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.tray = null;
    this.contextMenu = null;
  }

  /**
   * システムトレイを作成
   * 要件2.2: トレイアイコンとコンテキストメニューの作成
   */
  create() {
    // トレイアイコンのパスを設定
    const iconPath = this.getIconPath();
    const icon = nativeImage.createFromPath(iconPath);

    // プラットフォームに応じてアイコンサイズを調整
    let resizedIcon;
    if (process.platform === "darwin") {
      // macOS: 16x16または22x22が推奨
      resizedIcon = icon.resize({ width: 16, height: 16 });
    } else if (process.platform === "win32") {
      // Windows: 16x16が推奨
      resizedIcon = icon.resize({ width: 16, height: 16 });
    } else {
      // Linux: 22x22が推奨
      resizedIcon = icon.resize({ width: 22, height: 22 });
    }

    this.tray = new Tray(resizedIcon);

    // ツールチップを設定
    this.tray.setToolTip("IconConverter - 画像をICOに変換");

    // コンテキストメニューを作成
    this.updateContextMenu();

    // ダブルクリックでウィンドウ表示（Windows/Linux）
    this.tray.on("double-click", () => {
      this.showWindow();
    });

    // macOSではクリックでメニュー表示
    if (process.platform === "darwin") {
      this.tray.on("click", () => {
        this.tray.popUpContextMenu(this.contextMenu);
      });
    }

    console.log("System tray created successfully");
  }

  /**
   * トレイアイコンのパスを取得
   */
  getIconPath() {
    // 開発環境とプロダクション環境でパスを切り替え
    if (process.env.NODE_ENV === "development") {
      return path.join(__dirname, "../../assets/icon.png");
    } else {
      // プロダクション環境ではリソースディレクトリから読み込み
      return path.join(process.resourcesPath, "assets/icon.png");
    }
  }

  /**
   * コンテキストメニューを更新
   * 要件2.2: 日本語対応のメニュー項目
   */
  async updateContextMenu(settings = null) {
    // 設定が渡されていない場合は取得
    if (!settings) {
      try {
        settings = await this.getSettings();
      } catch (error) {
        console.error("Failed to get settings:", error);
        settings = { fileAssociation: false };
      }
    }

    this.contextMenu = Menu.buildFromTemplate([
      {
        label: "IconConverterを表示",
        click: () => this.showWindow(),
      },
      {
        label: "画像を変換...",
        click: () => this.quickConvert(),
      },
      { type: "separator" },
      {
        label: "設定",
        click: () => this.showSettings(),
      },
      {
        label: "ファイル関連付け",
        type: "checkbox",
        checked: settings.fileAssociation || false,
        click: (menuItem) => this.toggleFileAssociation(menuItem.checked),
      },
      { type: "separator" },
      {
        label: "バージョン情報",
        click: () => this.showAbout(),
      },
      {
        label: "終了",
        click: () => this.quitApp(),
      },
    ]);

    if (this.tray) {
      this.tray.setContextMenu(this.contextMenu);
    }
  }

  /**
   * ウィンドウを表示
   * 要件2.2: ウィンドウ表示/非表示制御
   */
  showWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  /**
   * ウィンドウを非表示
   * 要件2.2: バックグラウンド実行機能
   */
  hideWindow() {
    if (this.mainWindow) {
      this.mainWindow.hide();
    }
  }

  /**
   * クイック変換機能
   * 要件2.2: トレイからの直接ファイル選択
   */
  async quickConvert() {
    try {
      // ファイル選択ダイアログを表示
      const result = await dialog.showOpenDialog(this.mainWindow, {
        title: "変換する画像を選択",
        properties: ["openFile"],
        filters: [
          {
            name: "画像ファイル",
            extensions: [
              "png",
              "jpg",
              "jpeg",
              "bmp",
              "gif",
              "tiff",
              "tif",
              "webp",
            ],
          },
          { name: "すべてのファイル", extensions: ["*"] },
        ],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];

        // ウィンドウを表示
        this.showWindow();

        // レンダラープロセスにクイック変換イベントを送信
        if (this.mainWindow && this.mainWindow.webContents) {
          this.mainWindow.webContents.send("quick-convert", filePath);
        }

        console.log("Quick convert initiated for:", filePath);
      }
    } catch (error) {
      console.error("Quick convert error:", error);
      this.showError("クイック変換エラー", "ファイルの選択に失敗しました。");
    }
  }

  /**
   * 設定画面を表示
   */
  showSettings() {
    this.showWindow();
    // レンダラープロセスに設定画面表示イベントを送信
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send("show-settings");
    }
  }

  /**
   * ファイル関連付けの切り替え
   * 要件2.2: ファイル関連付け設定の切り替え
   */
  async toggleFileAssociation(enabled) {
    try {
      // システム統合サービスを使用
      const SystemIntegration = require("./system-integration");
      await SystemIntegration.setFileAssociation(enabled);

      // 設定を保存
      const settings = await this.getSettings();
      settings.fileAssociation = enabled;
      await this.saveSettings(settings);

      // メニューを更新
      await this.updateContextMenu(settings);

      // 成功メッセージを表示
      const message = enabled
        ? "ファイル関連付けを有効にしました。"
        : "ファイル関連付けを無効にしました。";

      this.showInfo("ファイル関連付け", message);
    } catch (error) {
      console.error("Failed to toggle file association:", error);

      // エラーダイアログを表示
      this.showError(
        "ファイル関連付けエラー",
        "ファイル関連付けの設定に失敗しました。管理者権限が必要な場合があります。",
      );

      // メニューを元に戻す
      await this.updateContextMenu();
    }
  }

  /**
   * バージョン情報を表示
   */
  showAbout() {
    const version = app.getVersion();
    dialog.showMessageBox(this.mainWindow, {
      type: "info",
      title: "IconConverterについて",
      message: "IconConverter",
      detail: `バージョン: ${version}\n\n画像をICO形式に変換するデスクトップアプリケーション\n\nサポート形式: PNG, JPEG, BMP, GIF, TIFF, WebP`,
      buttons: ["OK"],
    });
  }

  /**
   * アプリケーションを終了
   */
  quitApp() {
    // 確認ダイアログを表示
    const choice = dialog.showMessageBoxSync(this.mainWindow, {
      type: "question",
      buttons: ["終了", "キャンセル"],
      title: "終了確認",
      message: "IconConverterを終了しますか？",
    });

    if (choice === 0) {
      // 終了を選択
      app.quit();
    }
  }

  /**
   * 設定を取得
   */
  async getSettings() {
    try {
      const fs = require("fs").promises;
      const settingsPath = path.join(app.getPath("userData"), "settings.json");

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
  }

  /**
   * 設定を保存
   */
  async saveSettings(settings) {
    const fs = require("fs").promises;
    const settingsPath = path.join(app.getPath("userData"), "settings.json");
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf8");
  }

  /**
   * 情報ダイアログを表示
   */
  showInfo(title, message) {
    dialog.showMessageBox(this.mainWindow, {
      type: "info",
      title: title,
      message: message,
      buttons: ["OK"],
    });
  }

  /**
   * エラーダイアログを表示
   */
  showError(title, message) {
    dialog.showErrorBox(title, message);
  }

  /**
   * システムトレイを破棄
   */
  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
      console.log("System tray destroyed");
    }
  }

  /**
   * トレイが作成されているか確認
   */
  isCreated() {
    return this.tray !== null;
  }

  /**
   * 変換完了通知を表示
   * 要件2.2: 変換完了通知
   */
  showConversionCompleteNotification(filename, success = true) {
    if (!Notification.isSupported()) {
      console.log("Notifications are not supported on this platform");
      return;
    }

    const notification = new Notification({
      title: success ? "変換完了" : "変換失敗",
      body: success
        ? `${filename} の変換が完了しました。`
        : `${filename} の変換に失敗しました。`,
      icon: this.getIconPath(),
      silent: false,
    });

    notification.on("click", () => {
      this.showWindow();
    });

    notification.show();
  }

  /**
   * バックグラウンド変換を実行
   * 要件2.2: バックグラウンドでの変換処理
   */
  async performBackgroundConversion(filePath, options = null) {
    try {
      const fs = require("fs").promises;
      const ImageConverterService = require("./image-converter");

      // ファイルを読み込み
      const buffer = await fs.readFile(filePath);

      // デフォルトオプション
      const conversionOptions = options || {
        preserveTransparency: true,
        autoTransparent: false,
      };

      // 変換を実行
      const result = await ImageConverterService.convertToICO(
        buffer,
        conversionOptions,
      );

      if (result.success) {
        // 保存先を決定（元のファイルと同じディレクトリ）
        const parsedPath = path.parse(filePath);
        const outputPath = path.join(parsedPath.dir, `${parsedPath.name}.ico`);

        // ICOファイルを保存
        await fs.writeFile(outputPath, result.data);

        // 成功通知を表示
        this.showConversionCompleteNotification(parsedPath.base, true);

        return {
          success: true,
          outputPath: outputPath,
        };
      } else {
        // 失敗通知を表示
        this.showConversionCompleteNotification(path.basename(filePath), false);

        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error("Background conversion error:", error);

      // 失敗通知を表示
      this.showConversionCompleteNotification(path.basename(filePath), false);

      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = TrayManager;
