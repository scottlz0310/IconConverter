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
 * 要件2.1: 右クリックメニューに「ICOに変換」を追加
 */
async function setWindowsFileAssociation(enabled) {
  try {
    const Registry = require("winreg");
    const execPath = process.execPath;
    const iconPath = `"${execPath}",0`;

    console.log(`Windows file association ${enabled ? "enabled" : "disabled"}`);

    // 要件1.1: サポートする画像形式
    for (const ext of SUPPORTED_EXTENSIONS) {
      // HKCUを使用（管理者権限不要）
      const regKey = new Registry({
        hive: Registry.HKCU,
        key: `\\Software\\Classes\\${ext}\\shell\\ConvertToICO`,
      });

      if (enabled) {
        // 要件2.1: 右クリックメニューに「ICOに変換」を追加（日本語対応）
        await new Promise((resolve, reject) => {
          regKey.set("", Registry.REG_SZ, "ICOに変換", (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // アイコンの設定
        await new Promise((resolve, reject) => {
          regKey.set("Icon", Registry.REG_SZ, iconPath, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        // コマンドの設定
        const commandKey = new Registry({
          hive: Registry.HKCU,
          key: `\\Software\\Classes\\${ext}\\shell\\ConvertToICO\\command`,
        });

        // 要件2.1: コマンドライン引数での起動対応
        await new Promise((resolve, reject) => {
          commandKey.set("", Registry.REG_SZ, `"${execPath}" "%1"`, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        // 関連付けを削除
        await new Promise((resolve) => {
          regKey.destroy(() => {
            // エラーを無視（キーが存在しない場合）
            resolve();
          });
        });
      }
    }

    return { success: true, platform: "win32" };
  } catch (error) {
    console.error("Failed to set Windows file association:", error);
    throw error;
  }
}

/**
 * macOS用ファイル関連付け
 * 要件5.2: macOS 12以降対応
 * 要件2.1: Finderサービスメニュー統合
 */
async function setMacFileAssociation(enabled) {
  try {
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);

    console.log(`macOS file association ${enabled ? "enabled" : "disabled"}`);

    if (enabled) {
      // Launch Servicesに登録
      // 要件5.2: Info.plist設定とLaunch Services
      try {
        await execAsync(
          `/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "${app.getPath(
            "exe",
          )}"`,
        );
        console.log("Registered with Launch Services");
      } catch (error) {
        console.warn("Failed to register with Launch Services:", error.message);
      }

      // Automatorワークフローの作成（Finderサービスメニュー用）
      await createMacServiceWorkflow();
    } else {
      // サービスワークフローを削除
      await removeMacServiceWorkflow();
    }

    return { success: true, platform: "darwin" };
  } catch (error) {
    console.error("Failed to set macOS file association:", error);
    throw error;
  }
}

/**
 * macOS Servicesメニュー用のワークフローを作成
 * 要件2.1: 右クリックメニュー統合（日本語対応）
 */
async function createMacServiceWorkflow() {
  const fs = require("fs").promises;
  const os = require("os");

  const serviceDir = path.join(os.homedir(), "Library/Services");
  const workflowPath = path.join(serviceDir, "Convert to ICO.workflow");
  const contentsPath = path.join(workflowPath, "Contents");
  const infoPlistPath = path.join(contentsPath, "Info.plist");
  const documentPath = path.join(contentsPath, "document.wflow");

  try {
    // ディレクトリ構造を作成
    await fs.mkdir(contentsPath, { recursive: true });

    // Info.plist作成
    const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSServices</key>
    <array>
        <dict>
            <key>NSMenuItem</key>
            <dict>
                <key>default</key>
                <string>ICOに変換</string>
            </dict>
            <key>NSMessage</key>
            <string>runWorkflowAsService</string>
            <key>NSSendFileTypes</key>
            <array>
                <string>public.image</string>
            </array>
        </dict>
    </array>
</dict>
</plist>`;

    await fs.writeFile(infoPlistPath, infoPlist);

    // document.wflow作成（Automatorワークフロー定義）
    const execPath = process.execPath;
    const documentWflow = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>actions</key>
    <array>
        <dict>
            <key>action</key>
            <dict>
                <key>ActionClass</key>
                <string>AMRunShellScriptAction</string>
                <key>ActionParameters</key>
                <dict>
                    <key>COMMAND_STRING</key>
                    <string>for f in "$@"
do
    "${execPath}" "$f"
done</string>
                    <key>CheckedForUserDefaultShell</key>
                    <true/>
                    <key>inputMethod</key>
                    <integer>1</integer>
                    <key>shell</key>
                    <string>/bin/bash</string>
                </dict>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;

    await fs.writeFile(documentPath, documentWflow);

    console.log("macOS service workflow created successfully");
  } catch (error) {
    console.error("Failed to create macOS service workflow:", error);
    throw error;
  }
}

/**
 * macOS Servicesメニュー用のワークフローを削除
 */
async function removeMacServiceWorkflow() {
  const fs = require("fs").promises;
  const os = require("os");

  const workflowPath = path.join(
    os.homedir(),
    "Library/Services/Convert to ICO.workflow",
  );

  try {
    await fs.rm(workflowPath, { recursive: true, force: true });
    console.log("macOS service workflow removed successfully");
  } catch (error) {
    console.warn("Failed to remove macOS service workflow:", error.message);
  }
}

/**
 * Linux用ファイル関連付け
 * 要件5.3: Ubuntu 20.04以降対応
 * 要件2.1: 右クリックメニュー統合
 */
async function setLinuxFileAssociation(enabled) {
  try {
    const fs = require("fs").promises;
    const os = require("os");
    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);

    console.log(`Linux file association ${enabled ? "enabled" : "disabled"}`);

    const desktopFile = path.join(
      os.homedir(),
      ".local/share/applications/iconconverter.desktop",
    );
    const mimeFile = path.join(
      os.homedir(),
      ".local/share/mime/packages/iconconverter.xml",
    );

    if (enabled) {
      // .desktopファイルの作成
      // 要件2.1: 右クリックメニュー統合（日本語対応）
      const execPath = process.execPath;
      const iconPath = path.join(path.dirname(execPath), "../assets/icon.png");

      const desktopContent = `[Desktop Entry]
Name=IconConverter
Name[ja]=アイコンコンバーター
Comment=Convert images to ICO format
Comment[ja]=画像をICO形式に変換
Exec=${execPath} %f
Icon=${iconPath}
Type=Application
Categories=Graphics;Photography;
MimeType=image/png;image/jpeg;image/bmp;image/gif;image/tiff;image/webp;
StartupNotify=true
Terminal=false
`;

      // ディレクトリを作成
      await fs.mkdir(path.dirname(desktopFile), { recursive: true });
      await fs.writeFile(desktopFile, desktopContent);

      // 実行権限を付与
      try {
        await execAsync(`chmod +x "${desktopFile}"`);
      } catch (error) {
        console.warn("Failed to set executable permission:", error.message);
      }

      // MIMEタイプの登録
      const mimeContent = `<?xml version="1.0" encoding="UTF-8"?>
<mime-info xmlns="http://www.freedesktop.org/standards/shared-mime-info">
    <mime-type type="application/x-iconconverter">
        <comment>IconConverter Image</comment>
        <comment xml:lang="ja">IconConverter画像</comment>
        <glob pattern="*.png"/>
        <glob pattern="*.jpg"/>
        <glob pattern="*.jpeg"/>
        <glob pattern="*.bmp"/>
        <glob pattern="*.gif"/>
        <glob pattern="*.tiff"/>
        <glob pattern="*.tif"/>
        <glob pattern="*.webp"/>
    </mime-type>
</mime-info>`;

      await fs.mkdir(path.dirname(mimeFile), { recursive: true });
      await fs.writeFile(mimeFile, mimeContent);

      // デスクトップデータベースを更新
      try {
        await execAsync("update-desktop-database ~/.local/share/applications/");
        await execAsync("update-mime-database ~/.local/share/mime/");
        console.log("Linux desktop database updated successfully");
      } catch (error) {
        console.warn("Failed to update desktop database:", error.message);
      }
    } else {
      // ファイル関連付けを削除
      try {
        await fs.unlink(desktopFile);
      } catch (error) {
        console.warn("Failed to remove desktop file:", error.message);
      }

      try {
        await fs.unlink(mimeFile);
      } catch (error) {
        console.warn("Failed to remove MIME file:", error.message);
      }

      // デスクトップデータベースを更新
      try {
        await execAsync("update-desktop-database ~/.local/share/applications/");
        await execAsync("update-mime-database ~/.local/share/mime/");
      } catch (error) {
        console.warn("Failed to update desktop database:", error.message);
      }
    }

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
