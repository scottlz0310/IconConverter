/**
 * ファイル管理サービス
 * 要件2.3, 2.4: Native_Dialog、ドラッグ&ドロップ、ファイルシステム統合
 */

const { dialog, app } = require("electron");
const fs = require("fs").promises;
const path = require("path");
const { validateFilePath, sanitizeFilename } = require("../utils/validation");

/**
 * ファイル管理サービスクラス
 */
class FileManager {
  /**
   * 画像ファイル選択ダイアログを表示
   * 要件2.3: OS標準のネイティブファイルダイアログ
   *
   * @param {BrowserWindow} window - 親ウィンドウ
   * @returns {Promise<Object|null>} ファイル情報またはnull
   */
  static async selectImageFile(window) {
    try {
      const result = await dialog.showOpenDialog(window, {
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

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const filePath = result.filePaths[0];

      // パストラバーサル対策
      validateFilePath(filePath);

      const buffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);

      return {
        path: filePath,
        buffer: buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        ),
        name: fileName,
        size: buffer.length,
      };
    } catch (error) {
      console.error("Failed to select image file:", error);
      throw error;
    }
  }

  /**
   * 複数の画像ファイルを選択
   *
   * @param {BrowserWindow} window - 親ウィンドウ
   * @returns {Promise<Array<Object>>} ファイル情報配列
   */
  static async selectMultipleImageFiles(window) {
    try {
      const result = await dialog.showOpenDialog(window, {
        title: "変換する画像を選択",
        properties: ["openFile", "multiSelections"],
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
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return [];
      }

      const files = [];
      for (const filePath of result.filePaths) {
        try {
          validateFilePath(filePath);
          const buffer = await fs.readFile(filePath);
          const fileName = path.basename(filePath);

          files.push({
            path: filePath,
            buffer: buffer.buffer.slice(
              buffer.byteOffset,
              buffer.byteOffset + buffer.byteLength,
            ),
            name: fileName,
            size: buffer.length,
          });
        } catch (error) {
          console.error(`Failed to read file ${filePath}:`, error);
          // エラーが発生したファイルはスキップ
        }
      }

      return files;
    } catch (error) {
      console.error("Failed to select multiple image files:", error);
      throw error;
    }
  }

  /**
   * ICOファイル保存ダイアログを表示
   * 要件2.3: OS標準のネイティブファイルダイアログ
   *
   * @param {BrowserWindow} window - 親ウィンドウ
   * @param {ArrayBuffer|Buffer} data - ICOファイルデータ
   * @param {string} defaultName - デフォルトファイル名
   * @returns {Promise<string|null>} 保存先パスまたはnull
   */
  static async saveICOFile(window, data, defaultName = "icon.ico") {
    try {
      // ファイル名のサニタイゼーション
      const sanitizedName = sanitizeFilename(defaultName);

      // 拡張子が.icoでない場合は追加
      const fileName = sanitizedName.toLowerCase().endsWith(".ico")
        ? sanitizedName
        : `${sanitizedName}.ico`;

      const result = await dialog.showSaveDialog(window, {
        title: "ICOファイルを保存",
        defaultPath: fileName,
        filters: [
          { name: "ICOファイル", extensions: ["ico"] },
          { name: "すべてのファイル", extensions: ["*"] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return null;
      }

      const savePath = result.filePath;

      // パストラバーサル対策
      validateFilePath(savePath);

      const buffer = Buffer.from(data);
      await fs.writeFile(savePath, buffer);

      console.log(`ICO file saved: ${savePath} (${buffer.length} bytes)`);

      return savePath;
    } catch (error) {
      console.error("Failed to save ICO file:", error);
      throw error;
    }
  }

  /**
   * ドラッグ&ドロップされたファイルを処理
   * 要件2.4: デスクトップからのドラッグ&ドロップ対応
   *
   * @param {string} filePath - ドロップされたファイルパス
   * @returns {Promise<Object|null>} ファイル情報またはnull
   */
  static async handleDroppedFile(filePath) {
    try {
      // パストラバーサル対策
      validateFilePath(filePath);

      // ファイルの存在確認
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new Error("Not a file");
      }

      // 拡張子チェック
      const ext = path.extname(filePath).toLowerCase();
      const allowedExtensions = [
        ".png",
        ".jpg",
        ".jpeg",
        ".bmp",
        ".gif",
        ".tiff",
        ".tif",
        ".webp",
      ];

      if (!allowedExtensions.includes(ext)) {
        throw new Error(`Unsupported file extension: ${ext}`);
      }

      const buffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);

      return {
        path: filePath,
        buffer: buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        ),
        name: fileName,
        size: buffer.length,
      };
    } catch (error) {
      console.error("Failed to handle dropped file:", error);
      return null;
    }
  }

  /**
   * 最近使用したファイルのリストを取得
   *
   * @returns {Promise<Array<string>>} ファイルパス配列
   */
  static async getRecentFiles() {
    try {
      const recentFilesPath = path.join(
        app.getPath("userData"),
        "recent-files.json",
      );

      try {
        const data = await fs.readFile(recentFilesPath, "utf8");
        const recentFiles = JSON.parse(data);

        // 存在するファイルのみを返す
        const existingFiles = [];
        for (const filePath of recentFiles) {
          try {
            await fs.access(filePath);
            existingFiles.push(filePath);
          } catch {
            // ファイルが存在しない場合はスキップ
          }
        }

        return existingFiles;
      } catch {
        // ファイルが存在しない場合は空配列を返す
        return [];
      }
    } catch (error) {
      console.error("Failed to get recent files:", error);
      return [];
    }
  }

  /**
   * 最近使用したファイルのリストに追加
   *
   * @param {string} filePath - ファイルパス
   * @param {number} maxCount - 最大保存数（デフォルト: 10）
   */
  static async addRecentFile(filePath, maxCount = 10) {
    try {
      validateFilePath(filePath);

      const recentFilesPath = path.join(
        app.getPath("userData"),
        "recent-files.json",
      );
      let recentFiles = await this.getRecentFiles();

      // 既存のエントリを削除
      recentFiles = recentFiles.filter((f) => f !== filePath);

      // 先頭に追加
      recentFiles.unshift(filePath);

      // 最大数を超えた分を削除
      if (recentFiles.length > maxCount) {
        recentFiles = recentFiles.slice(0, maxCount);
      }

      await fs.writeFile(
        recentFilesPath,
        JSON.stringify(recentFiles, null, 2),
        "utf8",
      );
    } catch (error) {
      console.error("Failed to add recent file:", error);
    }
  }

  /**
   * 最近使用したファイルのリストをクリア
   */
  static async clearRecentFiles() {
    try {
      const recentFilesPath = path.join(
        app.getPath("userData"),
        "recent-files.json",
      );
      await fs.writeFile(recentFilesPath, JSON.stringify([], null, 2), "utf8");
    } catch (error) {
      console.error("Failed to clear recent files:", error);
    }
  }

  /**
   * ディレクトリ選択ダイアログを表示
   *
   * @param {BrowserWindow} window - 親ウィンドウ
   * @param {string} title - ダイアログタイトル
   * @returns {Promise<string|null>} ディレクトリパスまたはnull
   */
  static async selectDirectory(window, title = "フォルダを選択") {
    try {
      const result = await dialog.showOpenDialog(window, {
        title,
        properties: ["openDirectory"],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const dirPath = result.filePaths[0];
      validateFilePath(dirPath);

      return dirPath;
    } catch (error) {
      console.error("Failed to select directory:", error);
      throw error;
    }
  }

  /**
   * ファイルをゴミ箱に移動
   *
   * @param {string} filePath - ファイルパス
   * @returns {Promise<boolean>} 成功フラグ
   */
  static async moveToTrash(filePath) {
    try {
      validateFilePath(filePath);
      const { shell } = require("electron");
      await shell.trashItem(filePath);
      return true;
    } catch (error) {
      console.error("Failed to move file to trash:", error);
      return false;
    }
  }

  /**
   * ファイルをエクスプローラー/Finderで表示
   *
   * @param {string} filePath - ファイルパス
   */
  static showInFolder(filePath) {
    try {
      validateFilePath(filePath);
      const { shell } = require("electron");
      shell.showItemInFolder(filePath);
    } catch (error) {
      console.error("Failed to show file in folder:", error);
    }
  }
}

module.exports = FileManager;
