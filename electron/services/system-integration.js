/**
 * システム統合サービス
 * 要件2.1, 2.5: File_Association、OS統合
 */

const { app } = require("electron");
const path = require("path");

/**
 * ファイル関連付けの設定
 * プラットフォーム別の実装
 */
async function setFileAssociation(enabled) {
  // 要件5.1-5.3: マルチプラットフォーム対応
  if (process.platform === "win32") {
    return setWindowsFileAssociation(enabled);
  } else if (process.platform === "darwin") {
    return setMacFileAssociation(enabled);
  } else if (process.platform === "linux") {
    return setLinuxFileAssociation(enabled);
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

/**
 * Windows用ファイル関連付け
 * 要件5.1: Windows 10/11対応
 */
async function setWindowsFileAssociation(enabled) {
  try {
    // Windowsレジストリ操作は管理者権限が必要な場合があるため
    // 現時点では基本的な実装のみ
    // 実際の実装はPhase 3で行う

    console.log(`Windows file association ${enabled ? "enabled" : "disabled"}`);

    // TODO: Phase 3で実装
    // - レジストリキーの作成/削除
    // - 右クリックメニューの追加
    // - アイコンの設定

    return { success: true, platform: "win32" };
  } catch (error) {
    console.error("Failed to set Windows file association:", error);
    throw error;
  }
}

/**
 * macOS用ファイル関連付け
 * 要件5.2: macOS 12以降対応
 */
async function setMacFileAssociation(enabled) {
  try {
    console.log(`macOS file association ${enabled ? "enabled" : "disabled"}`);

    // TODO: Phase 3で実装
    // - Info.plist設定
    // - Launch Services登録
    // - Finderサービスメニュー統合

    return { success: true, platform: "darwin" };
  } catch (error) {
    console.error("Failed to set macOS file association:", error);
    throw error;
  }
}

/**
 * Linux用ファイル関連付け
 * 要件5.3: Ubuntu 20.04以降対応
 */
async function setLinuxFileAssociation(enabled) {
  try {
    console.log(`Linux file association ${enabled ? "enabled" : "disabled"}`);

    // TODO: Phase 3で実装
    // - .desktopファイルの作成/削除
    // - MIMEタイプの登録
    // - デスクトップデータベースの更新

    return { success: true, platform: "linux" };
  } catch (error) {
    console.error("Failed to set Linux file association:", error);
    throw error;
  }
}

/**
 * サポートされる画像拡張子
 * 要件1.1: PNG、JPEG、BMP、GIF、TIFF、WebP対応
 */
const SUPPORTED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".bmp",
  ".gif",
  ".tiff",
  ".tif",
  ".webp",
];

module.exports = {
  setFileAssociation,
  setWindowsFileAssociation,
  setMacFileAssociation,
  setLinuxFileAssociation,
  SUPPORTED_EXTENSIONS,
};
