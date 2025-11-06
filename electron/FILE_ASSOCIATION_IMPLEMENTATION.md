# ファイル関連付け実装サマリー

## 概要

このドキュメントは、IconConverterのファイル関連付け機能の実装詳細を説明します。

## 実装内容

### 1. OS別ファイル関連付け（タスク6.1）

#### Windows (Windows 10/11)

- **実装方法**: Windowsレジストリ操作
- **使用ライブラリ**: `winreg`
- **レジストリキー**: `HKCU\Software\Classes\{拡張子}\shell\ConvertToICO`
- **特徴**:
  - 管理者権限不要（HKCUを使用）
  - 右クリックメニューに「ICOに変換」を追加
  - アイコン表示対応
  - コマンドライン引数でファイルパスを渡す

#### macOS (macOS 12以降)

- **実装方法**: Automatorワークフロー + Launch Services
- **ファイル**: `~/Library/Services/Convert to ICO.workflow`
- **特徴**:
  - Finderサービスメニューに統合
  - Info.plistでサービス定義
  - Launch Servicesに登録
  - 日本語メニュー対応

#### Linux (Ubuntu 20.04以降)

- **実装方法**: .desktopファイル + MIMEタイプ登録
- **ファイル**:
  - `~/.local/share/applications/iconconverter.desktop`
  - `~/.local/share/mime/packages/iconconverter.xml`
- **特徴**:
  - デスクトップデータベースに登録
  - MIMEタイプ関連付け
  - 日本語メニュー対応
  - 実行権限の自動設定

### 2. 右クリックメニュー統合（タスク6.2）

#### コマンドライン引数処理

- **実装場所**: `electron/main.js`
- **機能**:
  - 起動時のコマンドライン引数からファイルパスを検出
  - サポートされる拡張子のみを処理
  - レンダラープロセスにファイルパスを送信

#### シングルインスタンス制御

- **実装**: `app.requestSingleInstanceLock()`
- **動作**:
  - 既にアプリが起動している場合、新しいインスタンスは起動しない
  - 既存のウィンドウにファイルパスを送信
  - ウィンドウを前面に表示

#### macOS固有処理

- **イベント**: `app.on('open-file')`
- **動作**:
  - Finderからファイルを開く際に呼び出される
  - ウィンドウが未作成の場合は保留
  - ウィンドウ作成後にファイルを処理

#### IPC通信

- **新規チャネル**:
  - `get-pending-file`: 保留中のファイルパスを取得
  - `open-file-from-cli`: ファイルパスをレンダラーに送信（イベント）

## サポートされる画像形式

要件1.1に基づき、以下の形式をサポート:

- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)
- BMP (`.bmp`)
- GIF (`.gif`)
- TIFF (`.tiff`, `.tif`)
- WebP (`.webp`)

## 使用方法

### ファイル関連付けの有効化

```javascript
// レンダラープロセスから
await window.electronAPI.setFileAssociation(true);
```

### ファイル関連付けの無効化

```javascript
await window.electronAPI.setFileAssociation(false);
```

### コマンドライン引数からのファイル処理

```javascript
// レンダラープロセスで起動時にチェック
const pendingFile = await window.electronAPI.getPendingFile();
if (pendingFile) {
  // ファイルを処理
  console.log('Opening file:', pendingFile);
}

// イベントリスナーで継続的に監視
window.electronAPI.onOpenFileFromCLI((filePath) => {
  console.log('File opened from CLI:', filePath);
  // ファイルを処理
});
```

## セキュリティ考慮事項

1. **入力検証**:
   - ファイルパスのサニタイゼーション
   - サポートされる拡張子のみを処理
   - ファイルサイズ制限（10MB）

2. **権限**:
   - Windows: HKCU使用（管理者権限不要）
   - macOS: ユーザーディレクトリのみ
   - Linux: ユーザーディレクトリのみ

3. **プロセス分離**:
   - contextBridgeによるセキュアなAPI公開
   - IPCハンドラーでの検証

## テスト

テストファイル: `electron/services/__tests__/system-integration.test.js`

```bash
# テスト実行
npm test
```

## トラブルシューティング

### Windows

- **問題**: レジストリキーが作成されない
- **解決**: HKCUへのアクセス権限を確認

### macOS

- **問題**: サービスメニューに表示されない
- **解決**: Launch Servicesデータベースをリセット

  ```bash
  /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -kill -r -domain local -domain system -domain user
  ```

### Linux

- **問題**: デスクトップファイルが認識されない
- **解決**: デスクトップデータベースを手動更新

  ```bash
  update-desktop-database ~/.local/share/applications/
  update-mime-database ~/.local/share/mime/
  ```

## 今後の改善点

1. **Windows**: より高度なレジストリ操作（アイコンオーバーレイなど）
2. **macOS**: Quick Actionsへの統合
3. **Linux**: より多くのデスクトップ環境への対応
4. **共通**: ファイル関連付けの状態確認機能

## 関連ファイル

- `electron/services/system-integration.js`: メイン実装
- `electron/main.js`: コマンドライン引数処理
- `electron/preload.js`: IPC API公開
- `shared/types/electron-api.ts`: TypeScript型定義
- `package.json`: winreg依存関係

## 要件対応

- ✅ 要件1.1: PNG、JPEG、BMP、GIF、TIFF、WebP対応
- ✅ 要件2.1: 右クリックメニューに「ICOに変換」を追加（日本語対応）
- ✅ 要件2.5: Windows、macOS、LinuxのFile_Association統合
- ✅ 要件5.1: Windows 10/11対応
- ✅ 要件5.2: macOS 12以降対応
- ✅ 要件5.3: Ubuntu 20.04以降対応
- ✅ 要件5.4: x64とarm64アーキテクチャ対応（プラットフォーム依存なし）
