# 自動更新機能実装サマリー

## 概要

electron-updaterを使用した自動更新機能を実装しました。GitHub Releasesと連携し、セキュアな検証付きで更新を配信します。

## 実装内容

### 1. UpdateManagerサービス (`electron/services/updater.js`)

自動更新機能を管理する中核サービスです。

#### 主要機能

1. **自動更新チェック**
   - 起動時（5秒後）に自動チェック
   - 4時間ごとに定期的にチェック
   - 開発環境では無効化

2. **更新ダイアログ**
   - 更新利用可能ダイアログ（日本語対応）
   - 更新準備完了ダイアログ
   - ダウンロードエラーダイアログ

3. **バックグラウンドダウンロード**
   - ユーザーの確認後にダウンロード開始
   - 進捗状況をレンダラープロセスに通知
   - ダウンロード完了後に再起動を促す

4. **手動更新チェック**
   - メニューから手動で更新をチェック可能
   - 最新バージョン使用時は通知を表示

5. **バージョンスキップ機能**
   - 特定バージョンをスキップ可能
   - 設定はローカルに保存

#### セキュリティ機能

- **セキュアな検証**: electron-updaterの署名検証機能を使用
- **GitHub Releases連携**: 公式リリースからのみ更新を取得
- **手動ダウンロード制御**: ユーザーの明示的な承認が必要

### 2. main.jsの統合

UpdateManagerをメインプロセスに統合しました。

```javascript
// UpdateManagerの初期化
updateManager = new UpdateManager(mainWindow);

// アプリ終了時のクリーンアップ
app.on("before-quit", async () => {
  if (updateManager) {
    updateManager.destroy();
    updateManager = null;
  }
});
```

### 3. IPCハンドラー

レンダラープロセスから更新機能を制御するためのIPCハンドラーを追加しました。

- `check-for-updates`: 手動更新チェック
- `get-current-version`: 現在のバージョン取得
- `download-update`: 更新のダウンロード開始
- `install-update`: 更新のインストールと再起動

### 4. preload.jsのAPI公開

セキュアなAPIをレンダラープロセスに公開しました。

```javascript
contextBridge.exposeInMainWorld("electronAPI", {
  // 自動更新機能
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  getCurrentVersion: () => ipcRenderer.invoke("get-current-version"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),

  // イベントリスナー
  onUpdateAvailable: (callback) => { /* ... */ },
  onUpdateDownloaded: (callback) => { /* ... */ },
  onUpdateDownloading: (callback) => { /* ... */ },
  onUpdateProgress: (callback) => { /* ... */ },
});
```

### 5. TypeScript型定義

`shared/types/electron-api.ts`に更新関連の型定義を追加しました。

```typescript
export interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

export interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

export interface ElectronAPI {
  // 自動更新機能
  checkForUpdates(): Promise<{ success: boolean; error?: string }>;
  getCurrentVersion(): Promise<string>;
  downloadUpdate(): Promise<{ success: boolean; error?: string }>;
  installUpdate(): Promise<{ success: boolean; error?: string }>;

  // イベントリスナー
  onUpdateAvailable(callback: (info: UpdateInfo) => void): void;
  onUpdateDownloaded(callback: (info: UpdateInfo) => void): void;
  onUpdateDownloading(callback: (info: UpdateInfo) => void): void;
  onUpdateProgress(callback: (progress: UpdateProgress) => void): void;
}
```

## 使用方法

### フロントエンドからの使用例

```typescript
// 手動更新チェック
const checkUpdates = async () => {
  const result = await window.electronAPI?.checkForUpdates();
  if (result?.success) {
    console.log('更新チェックを開始しました');
  }
};

// 更新イベントのリスニング
useEffect(() => {
  if (!window.electronAPI) return;

  // 更新が利用可能になったとき
  window.electronAPI.onUpdateAvailable((info) => {
    console.log(`新しいバージョン ${info.version} が利用可能です`);
  });

  // ダウンロード進捗
  window.electronAPI.onUpdateProgress((progress) => {
    console.log(`ダウンロード進捗: ${progress.percent}%`);
  });

  // 更新がダウンロードされたとき
  window.electronAPI.onUpdateDownloaded((info) => {
    console.log(`バージョン ${info.version} のダウンロードが完了しました`);
  });

  return () => {
    window.electronAPI.removeUpdateAvailableListener();
    window.electronAPI.removeUpdateProgressListener();
    window.electronAPI.removeUpdateDownloadedListener();
  };
}, []);
```

## 更新フロー

1. **自動チェック**
   - アプリ起動5秒後に自動チェック
   - 4時間ごとに定期チェック

2. **更新検出**
   - 新しいバージョンが見つかった場合、ダイアログを表示
   - ユーザーは「今すぐダウンロード」「後で」「スキップ」を選択可能

3. **ダウンロード**
   - バックグラウンドでダウンロード
   - 進捗状況をリアルタイムで表示

4. **インストール**
   - ダウンロード完了後、再起動を促すダイアログを表示
   - ユーザーは「今すぐ再起動」「次回起動時」を選択可能

5. **再起動とインストール**
   - アプリを再起動して更新を適用
   - 次回起動時を選択した場合は、次回起動時に自動適用

## 設定

### package.jsonの設定

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "iconconverter",
      "repo": "iconconverter"
    }
  }
}
```

### GitHub Releasesとの連携

1. GitHubでリリースを作成
2. electron-builderでビルドしたファイルをアップロード
3. アプリが自動的に新しいリリースを検出

## セキュリティ

### 実装されているセキュリティ機能

1. **署名検証**
   - electron-updaterが自動的に署名を検証
   - 改ざんされたファイルは拒否

2. **HTTPS通信**
   - GitHub Releasesとの通信はHTTPSで暗号化

3. **ユーザー確認**
   - ダウンロード前にユーザーの明示的な承認が必要
   - 自動ダウンロードは無効化

4. **開発環境での無効化**
   - 開発環境では更新チェックを無効化
   - 誤った更新を防止

## テスト

### 単体テスト

`electron/services/__tests__/updater.test.js`に基本的なテストを実装しました。

```bash
# テストの実行
npm test -- updater.test.js
```

### 手動テスト

1. **開発環境でのテスト**

   ```bash
   npm run dev
   ```

   - 更新チェックが無効化されることを確認

2. **プロダクションビルドでのテスト**

   ```bash
   npm run build
   npm start
   ```

   - 更新チェックが動作することを確認

3. **手動更新チェックのテスト**
   - メニューから「更新をチェック」を選択
   - ダイアログが表示されることを確認

## トラブルシューティング

### 更新が検出されない

1. **GitHub Releasesの確認**
   - リリースが公開されているか確認
   - ファイルが正しくアップロードされているか確認

2. **バージョン番号の確認**
   - package.jsonのバージョンが正しいか確認
   - セマンティックバージョニングに従っているか確認

3. **ネットワーク接続の確認**
   - インターネット接続を確認
   - ファイアウォール設定を確認

### ダウンロードエラー

1. **ログの確認**
   - electron-logのログファイルを確認
   - エラーメッセージを確認

2. **ディスク容量の確認**
   - 十分なディスク容量があるか確認

3. **権限の確認**
   - 書き込み権限があるか確認

## 今後の改善案

1. **差分更新**
   - 完全なファイルではなく差分のみをダウンロード
   - ダウンロード時間とサイズを削減

2. **ロールバック機能**
   - 更新に問題があった場合に前のバージョンに戻す
   - 安全性の向上

3. **更新履歴の表示**
   - 過去の更新履歴を表示
   - リリースノートの詳細表示

4. **ベータチャンネル**
   - ベータ版の更新チャンネルを追加
   - 早期アクセスユーザー向け

## 要件対応

### 要件6.3: セキュアな検証付き自動更新機能

✅ electron-updaterの署名検証機能を使用
✅ GitHub Releasesとの連携
✅ HTTPS通信による暗号化

### 要件10.2: electron-updaterの統合

✅ electron-updaterを統合
✅ GitHub Releasesとの連携
✅ 更新通知UIの実装（日本語対応）
✅ バックグラウンド更新ダウンロード
✅ 更新確認ダイアログ
✅ 安全な再起動処理
✅ 手動更新チェック機能

## まとめ

自動更新機能の実装が完了しました。以下の機能が利用可能です：

- ✅ 自動更新チェック（起動時・定期的）
- ✅ 手動更新チェック
- ✅ バックグラウンドダウンロード
- ✅ 進捗表示
- ✅ 安全な再起動とインストール
- ✅ バージョンスキップ機能
- ✅ 日本語対応のUI
- ✅ セキュアな検証
- ✅ GitHub Releases連携

フロントエンドから`window.electronAPI`を通じて更新機能を制御できます。
