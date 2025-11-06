/**
 * システムトレイ機能のテストスクリプト
 * 要件2.2: System_Tray機能の検証
 *
 * 使用方法:
 * 1. Electronアプリを起動
 * 2. システムトレイにアイコンが表示されることを確認
 * 3. トレイアイコンを右クリックしてメニューが表示されることを確認
 * 4. 各メニュー項目が正常に動作することを確認
 *
 * 検証項目:
 * - トレイアイコンの表示
 * - コンテキストメニューの表示
 * - ウィンドウ表示/非表示制御
 * - クイック変換機能
 * - ファイル関連付け設定の切り替え
 * - バックグラウンド変換
 * - 変換完了通知
 */

const { app, BrowserWindow } = require("electron");
const path = require("path");
const TrayManager = require("./services/tray-manager");

let mainWindow = null;
let trayManager = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // 簡単なHTMLを読み込み
  mainWindow.loadURL(
    `data:text/html,
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tray Test</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f0f0f0;
          }
          h1 { color: #333; }
          .test-item {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-weight: bold;
          }
          .status.pass { background: #4CAF50; color: white; }
          .status.pending { background: #FFC107; color: black; }
        </style>
      </head>
      <body>
        <h1>システムトレイ機能テスト</h1>
        <div class="test-item">
          <h3>✓ トレイアイコン表示</h3>
          <p>システムトレイにIconConverterのアイコンが表示されているか確認してください。</p>
          <span class="status pending">手動確認</span>
        </div>
        <div class="test-item">
          <h3>✓ コンテキストメニュー</h3>
          <p>トレイアイコンを右クリックして、以下のメニュー項目が表示されることを確認してください：</p>
          <ul>
            <li>IconConverterを表示</li>
            <li>画像を変換...</li>
            <li>設定</li>
            <li>ファイル関連付け</li>
            <li>バージョン情報</li>
            <li>終了</li>
          </ul>
          <span class="status pending">手動確認</span>
        </div>
        <div class="test-item">
          <h3>✓ ウィンドウ表示/非表示</h3>
          <p>「IconConverterを表示」メニューをクリックして、ウィンドウが表示されることを確認してください。</p>
          <p>ウィンドウを閉じると、トレイに最小化されることを確認してください。</p>
          <span class="status pending">手動確認</span>
        </div>
        <div class="test-item">
          <h3>✓ クイック変換機能</h3>
          <p>「画像を変換...」メニューをクリックして、ファイル選択ダイアログが表示されることを確認してください。</p>
          <span class="status pending">手動確認</span>
        </div>
        <div class="test-item">
          <h3>✓ バージョン情報</h3>
          <p>「バージョン情報」メニューをクリックして、アプリケーション情報が表示されることを確認してください。</p>
          <span class="status pending">手動確認</span>
        </div>
        <div class="test-item">
          <h3>📝 テスト結果</h3>
          <p>すべてのテスト項目を確認したら、このウィンドウを閉じてください。</p>
          <p>トレイアイコンから「終了」を選択してアプリケーションを終了してください。</p>
        </div>
      </body>
    </html>
  `,
  );

  mainWindow.on("close", (event) => {
    // ウィンドウを閉じる代わりにトレイに最小化
    event.preventDefault();
    mainWindow.hide();
    console.log("Window hidden - check tray icon");
  });
}

app.whenReady().then(() => {
  createWindow();

  // システムトレイを作成
  trayManager = new TrayManager(mainWindow);
  trayManager.create();

  console.log("=".repeat(60));
  console.log("システムトレイ機能テスト開始");
  console.log("=".repeat(60));
  console.log("");
  console.log("テスト項目:");
  console.log("1. トレイアイコンが表示されているか");
  console.log("2. トレイアイコンを右クリックしてメニューが表示されるか");
  console.log("3. 各メニュー項目が正常に動作するか");
  console.log("4. ウィンドウの表示/非表示が正常に動作するか");
  console.log("5. クイック変換機能が動作するか");
  console.log("");
  console.log("トレイアイコンから「終了」を選択してテストを終了してください。");
  console.log("=".repeat(60));
});

app.on("window-all-closed", () => {
  // トレイが有効な場合はバックグラウンドで実行を継続
  console.log("All windows closed - app continues in tray");
});

app.on("before-quit", () => {
  if (trayManager) {
    trayManager.destroy();
  }
  console.log("Tray manager destroyed");
});
