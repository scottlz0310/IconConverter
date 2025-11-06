# システムトレイ機能実装ドキュメント

## 概要

IconConverterのシステムトレイ機能は、要件2.2に基づいて実装されています。この機能により、アプリケーションをバックグラウンドで実行し、システムトレイから素早くアクセスできます。

## 実装内容

### 1. システムトレイの基本機能

#### 1.1 トレイアイコンとコンテキストメニュー

- **トレイアイコン**: プラットフォームに応じて最適なサイズに自動調整
  - Windows: 16x16
  - macOS: 16x16
  - Linux: 22x22

- **コンテキストメニュー項目**:
  - IconConverterを表示
  - 画像を変換...
  - 設定
  - ファイル関連付け（チェックボックス）
  - バージョン情報
  - 終了

#### 1.2 ウィンドウ表示/非表示制御

- ウィンドウを閉じると、トレイに最小化（Windows/Linux）
- トレイアイコンをダブルクリックでウィンドウを表示
- メニューから「IconConverterを表示」でウィンドウを表示

#### 1.3 バックグラウンド実行

- すべてのウィンドウが閉じられても、トレイが有効な場合はアプリケーションが実行を継続
- macOSでは標準的な動作に従い、ウィンドウを閉じてもアプリケーションは終了しない

### 2. クイック変換機能

#### 2.1 トレイからの直接ファイル選択

```javascript
// トレイメニューから「画像を変換...」を選択
async quickConvert() {
  const result = await dialog.showOpenDialog({
    title: "変換する画像を選択",
    properties: ["openFile"],
    filters: [
      {
        name: "画像ファイル",
        extensions: ["png", "jpg", "jpeg", "bmp", "gif", "tiff", "tif", "webp"],
      },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    // ウィンドウを表示してファイルを処理
    this.showWindow();
    this.mainWindow.webContents.send("quick-convert", result.filePaths[0]);
  }
}
```

#### 2.2 バックグラウンドでの変換処理

```javascript
async performBackgroundConversion(filePath, options) {
  // ファイルを読み込み
  const buffer = await fs.readFile(filePath);

  // 変換を実行
  const result = await ImageConverterService.convertToICO(buffer, options);

  if (result.success) {
    // 元のファイルと同じディレクトリに保存
    const outputPath = path.join(
      path.dirname(filePath),
      `${path.basename(filePath, path.extname(filePath))}.ico`,
    );
    await fs.writeFile(outputPath, result.data);

    // 成功通知を表示
    this.showConversionCompleteNotification(path.basename(filePath), true);
  }
}
```

#### 2.3 変換完了通知

- Electron Notificationを使用してネイティブ通知を表示
- 通知をクリックするとウィンドウが表示される
- 成功/失敗に応じて異なるメッセージを表示

```javascript
showConversionCompleteNotification(filename, success = true) {
  const notification = new Notification({
    title: success ? "変換完了" : "変換失敗",
    body: success
      ? `${filename} の変換が完了しました。`
      : `${filename} の変換に失敗しました。`,
    icon: this.getIconPath(),
  });

  notification.on("click", () => {
    this.showWindow();
  });

  notification.show();
}
```

### 3. ファイル関連付け設定の切り替え

トレイメニューから直接ファイル関連付けを有効/無効にできます：

```javascript
async toggleFileAssociation(enabled) {
  // システム統合サービスを使用
  await SystemIntegration.setFileAssociation(enabled);

  // 設定を保存
  const settings = await this.getSettings();
  settings.fileAssociation = enabled;
  await this.saveSettings(settings);

  // メニューを更新
  await this.updateContextMenu(settings);
}
```

## API仕様

### IPC API

#### `minimize-to-tray`

ウィンドウをシステムトレイに最小化します。

```typescript
window.electronAPI.minimizeToTray(): Promise<void>
```

#### `background-convert`

バックグラウンドで画像変換を実行します。

```typescript
window.electronAPI.backgroundConvert(
  filePath: string,
  options?: ConversionOptions
): Promise<{
  success: boolean;
  outputPath?: string;
  error?: string;
}>
```

### イベント

#### `quick-convert`

トレイメニューから「画像を変換...」が選択されたときに発火します。

```typescript
window.electronAPI.onQuickConvert((filePath: string) => {
  // ファイルパスを受け取って処理
});
```

## 使用方法

### 基本的な使用

```javascript
// main.js
const TrayManager = require("./services/tray-manager");

let trayManager = null;

app.whenReady().then(() => {
  createWindow();

  // システムトレイを作成
  trayManager = new TrayManager(mainWindow);
  trayManager.create();
});

app.on("before-quit", () => {
  // クリーンアップ
  if (trayManager) {
    trayManager.destroy();
  }
});
```

### フロントエンドからの使用

```typescript
// React コンポーネント
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // クイック変換イベントをリッスン
    if (window.electronAPI) {
      window.electronAPI.onQuickConvert((filePath) => {
        console.log('Quick convert requested for:', filePath);
        // ファイルを処理
      });

      return () => {
        window.electronAPI.removeQuickConvertListener();
      };
    }
  }, []);

  const handleMinimizeToTray = async () => {
    if (window.electronAPI) {
      await window.electronAPI.minimizeToTray();
    }
  };

  return (
    <div>
      <button onClick={handleMinimizeToTray}>
        トレイに最小化
      </button>
    </div>
  );
}
```

## テスト

### 手動テスト

テストスクリプトを使用して機能を検証できます：

```bash
# テストスクリプトを実行
npm run test:tray
```

または、package.jsonに以下を追加：

```json
{
  "scripts": {
    "test:tray": "electron electron/test-tray.js"
  }
}
```

### テスト項目

1. **トレイアイコン表示**
   - システムトレイにアイコンが表示されるか
   - アイコンのサイズが適切か

2. **コンテキストメニュー**
   - 右クリックでメニューが表示されるか
   - すべてのメニュー項目が表示されるか
   - 日本語が正しく表示されるか

3. **ウィンドウ制御**
   - ウィンドウを閉じるとトレイに最小化されるか
   - トレイから再表示できるか
   - ダブルクリックで表示されるか

4. **クイック変換**
   - ファイル選択ダイアログが表示されるか
   - ファイルを選択すると処理が開始されるか

5. **通知**
   - 変換完了時に通知が表示されるか
   - 通知をクリックするとウィンドウが表示されるか

6. **ファイル関連付け**
   - チェックボックスの状態が保存されるか
   - 設定が正しく適用されるか

## プラットフォーム固有の動作

### Windows

- ウィンドウを閉じるとトレイに最小化
- トレイアイコンを右クリックでメニュー表示
- トレイアイコンをダブルクリックでウィンドウ表示

### macOS

- ウィンドウを閉じてもアプリケーションは終了しない
- トレイアイコンをクリックでメニュー表示
- Dockアイコンをクリックでウィンドウ表示

### Linux

- Windowsと同様の動作
- デスクトップ環境によって動作が異なる場合がある

## トラブルシューティング

### トレイアイコンが表示されない

- アイコンファイルのパスが正しいか確認
- プラットフォームがシステムトレイをサポートしているか確認
- デスクトップ環境の設定を確認（Linux）

### 通知が表示されない

- `Notification.isSupported()` で通知がサポートされているか確認
- システムの通知設定を確認
- アプリケーションの通知権限を確認

### メニューが日本語で表示されない

- システムのロケール設定を確認
- フォントが日本語をサポートしているか確認

## 今後の拡張

- [ ] トレイアイコンのアニメーション（変換中）
- [ ] 複数ファイルの一括変換
- [ ] 変換履歴の表示
- [ ] カスタムショートカットキー
- [ ] トレイメニューのカスタマイズ

## 参考資料

- [Electron Tray API](https://www.electronjs.org/docs/latest/api/tray)
- [Electron Notification API](https://www.electronjs.org/docs/latest/api/notification)
- [Electron Menu API](https://www.electronjs.org/docs/latest/api/menu)
