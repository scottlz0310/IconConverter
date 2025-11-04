# Electron化設計書

## 概要

本設計書は、WebUI版IconConverterをElectronベースのデスクトップアプリケーションに移行するための技術設計を定義します。既存のReact UIコンポーネントとPython画像処理ロジックを最大限活用しながら、ネイティブデスクトップ機能を追加し、オフライン動作、ファイルシステム統合、OS統合を実現します。

## 1. システムアーキテクチャ

### 1.1 全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                    IconConverter Electron App               │
├─────────────────────────────────────────────────────────────┤
│  Main Process (Node.js)                                     │
│  ├─ App Lifecycle Management                                │
│  ├─ Window Management                                       │
│  ├─ File System Operations                                  │
│  ├─ IPC Handlers                                           │
│  └─ Native OS Integration                                   │
├─────────────────────────────────────────────────────────────┤
│  Renderer Process (Chromium)                               │
│  ├─ React UI (既存フロントエンド再利用)                      │
│  ├─ Zustand State Management                               │
│  ├─ TanStack Query (IPC通信用に改修)                        │
│  └─ Tailwind CSS + shadcn/ui                               │
├─────────────────────────────────────────────────────────────┤
│  Preload Script (Security Bridge)                          │
│  ├─ Secure API Exposure                                    │
│  ├─ IPC Communication                                      │
│  └─ Context Isolation                                      │
├─────────────────────────────────────────────────────────────┤
│  Worker Process (Optional)                                  │
│  ├─ Heavy Image Processing                                  │
│  ├─ Background Tasks                                       │
│  └─ CPU-intensive Operations                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 プロセス間通信設計

**設計根拠**: 要件8.4に基づき、セキュアなIPC通信を実装し、contextBridgeを使用してRenderer ProcessからMain Processへの安全なアクセスを提供します。

```typescript
// IPC API定義
interface ElectronAPI {
  // ファイル操作（要件2.3, 2.4対応）
  selectImageFile(): Promise<{ path: string; buffer: ArrayBuffer; name: string } | null>;
  saveICOFile(data: ArrayBuffer, defaultName: string): Promise<string | null>;

  // 画像変換（要件1.1-1.5対応）
  convertToICO(imageData: ArrayBuffer, options: ConversionOptions): Promise<ConversionResult>;
  validateImageFile(buffer: ArrayBuffer, filename: string): Promise<ValidationResult>;

  // アプリケーション制御（要件2.2対応）
  minimizeToTray(): Promise<void>;
  showWindow(): Promise<void>;
  getAppVersion(): Promise<string>;

  // 設定管理（要件3.3対応）
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;

  // システム統合（要件2.1, 2.5対応）
  setFileAssociation(enabled: boolean): Promise<void>;
  openExternal(url: string): Promise<void>;

  // パフォーマンス監視（要件4対応）
  getMemoryUsage(): Promise<MemoryInfo>;
  getCPUUsage(): Promise<number>;
}

// 型定義
interface ConversionOptions {
  preserveTransparency: boolean;
  autoTransparent: boolean;
  backgroundColor?: string;
}

interface ConversionResult {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
  processingTime: number;
}

interface ValidationResult {
  isValid: boolean;
  format?: string;
  size?: number;
  error?: string;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fileAssociation: boolean;
  startMinimized: boolean;
  autoUpdate: boolean;
}

interface MemoryInfo {
  used: number;
  total: number;
  percentage: number;
}
```

## 2. ディレクトリ構造

### 2.1 プロジェクト構造

```
IconConverter/
├── electron/                    # Electronメインプロセス
│   ├── main.js                 # アプリケーションエントリーポイント
│   ├── preload.js              # プリロードスクリプト
│   ├── services/               # バックエンドサービス
│   │   ├── image-converter.js  # 画像変換サービス
│   │   ├── file-manager.js     # ファイル管理サービス
│   │   ├── settings-manager.js # 設定管理サービス
│   │   └── system-integration.js # OS統合サービス
│   ├── workers/                # ワーカープロセス
│   │   └── image-worker.js     # 画像処理ワーカー
│   └── utils/                  # ユーティリティ
│       ├── ico-generator.js    # ICO形式生成
│       ├── validation.js       # ファイルバリデーション
│       └── logger.js           # ログ管理
├── frontend/                   # 既存Reactフロントエンド
│   ├── src/
│   │   ├── adapters/          # 新規: API適応層
│   │   │   ├── electron-api.ts
│   │   │   └── web-api.ts
│   │   ├── components/        # 既存UIコンポーネント
│   │   ├── hooks/             # 既存カスタムフック
│   │   ├── stores/            # 既存状態管理
│   │   └── services/          # 既存サービス層
│   └── electron-dist/         # Electron用ビルド出力
├── shared/                    # 共通型定義・ユーティリティ
│   ├── types/
│   │   ├── electron-api.ts    # IPC API型定義
│   │   ├── conversion.ts      # 変換関連型
│   │   └── settings.ts        # 設定型定義
│   └── constants/
│       └── app-constants.ts   # アプリケーション定数
├── build/                     # ビルド設定
│   ├── electron-builder.json  # パッケージング設定
│   ├── notarize.js           # macOS公証設定
│   └── sign.js               # コード署名設定
└── dist-electron/            # 配布パッケージ出力
```

### 2.2 既存コードの再利用戦略

**設計根拠**: 要件9.1, 9.4に基づき、WebUI版の既存ReactUIコンポーネントを最大限再利用し、機能パリティを維持します。

```typescript
// frontend/src/adapters/api-factory.ts
export function createImageAPI(): ImageAPI {
  if (window.electronAPI) {
    return new ElectronImageAPI();
  }
  return new WebImageAPI();
}

// frontend/src/adapters/electron-api.ts
class ElectronImageAPI implements ImageAPI {
  async convertImage(file: File, options: ConversionOptions): Promise<ConversionResult> {
    const buffer = await file.arrayBuffer();
    return window.electronAPI.convertToICO(buffer, options);
  }

  async validateFile(file: File): Promise<ValidationResult> {
    const buffer = await file.arrayBuffer();
    return window.electronAPI.validateImageFile(buffer, file.name);
  }
}

// frontend/src/adapters/web-api.ts
class WebImageAPI implements ImageAPI {
  async convertImage(file: File, options: ConversionOptions): Promise<ConversionResult> {
    // 既存のHTTP API呼び出し
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    const response = await fetch('/api/convert', {
      method: 'POST',
      body: formData
    });

    return response.json();
  }
}

// 既存のReactコンポーネントは無変更で利用
// services層でAPI呼び出しを抽象化し、環境に応じて適切なAPIを使用
```

## 3. 技術仕様

### 3.1 画像処理実装

**設計根拠**: 要件9.2, 9.3に基づき、Python画像処理ロジックをJavaScriptに移行し、Pillowと同等の処理精度を実現します。要件1.1-1.5の画像変換機能を満たします。

#### ICO生成ライブラリ

```javascript
// electron/utils/ico-generator.js
const sharp = require('sharp');

class ICOGenerator {
  static async create(inputBuffer, options = {}) {
    // 要件1.2: 6つのアイコンサイズを同時生成
    const sizes = [16, 32, 48, 64, 128, 256];
    const { preserveTransparency = true, autoTransparent = false } = options;

    // 各サイズの画像を生成
    const images = await Promise.all(
      sizes.map(async (size) => {
        let pipeline = sharp(inputBuffer).resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        });

        // 要件1.4: 自動背景除去オプション
        if (autoTransparent) {
          pipeline = await this.applyAutoTransparency(pipeline, inputBuffer);
        }

        // 要件1.3: 既存の透明度を保持
        if (preserveTransparency) {
          return pipeline.png().toBuffer();
        } else {
          return pipeline.flatten({ background: '#ffffff' }).png().toBuffer();
        }
      })
    );

    // ICOファイル形式に結合
    return this.combineToICO(images, sizes);
  }

  static async applyAutoTransparency(pipeline, originalBuffer) {
    // 要件9.2, 9.5: 既存のPythonロジックをJavaScriptに移植し、同等の精度を保持
    const { data, info } = await sharp(originalBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const bgColor = this.detectBackgroundColor(data, info);

    return pipeline.composite([{
      input: await this.createTransparencyMask(data, info, bgColor),
      blend: 'dest-in'
    }]);
  }

  static detectBackgroundColor(data, info) {
    // 四隅のピクセルから背景色を検出（既存Pythonロジックの移植）
    const { width, height, channels } = info;
    const corners = [
      0, // 左上
      (width - 1) * channels, // 右上
      (height - 1) * width * channels, // 左下
      ((height - 1) * width + (width - 1)) * channels // 右下
    ];

    const colors = corners.map(offset => ({
      r: data[offset],
      g: data[offset + 1],
      b: data[offset + 2],
      a: channels === 4 ? data[offset + 3] : 255
    }));

    // 最も頻出する色を背景色として判定
    return this.findMostCommonColor(colors);
  }

  static async createTransparencyMask(data, info, bgColor) {
    // 背景色に近いピクセルを透明にするマスクを作成
    const { width, height, channels } = info;
    const maskData = Buffer.alloc(width * height);
    const tolerance = 30; // 色の許容範囲

    for (let i = 0; i < width * height; i++) {
      const offset = i * channels;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];

      const distance = Math.sqrt(
        Math.pow(r - bgColor.r, 2) +
        Math.pow(g - bgColor.g, 2) +
        Math.pow(b - bgColor.b, 2)
      );

      maskData[i] = distance <= tolerance ? 0 : 255;
    }

    return sharp(maskData, { raw: { width, height, channels: 1 } })
      .png()
      .toBuffer();
  }

  static combineToICO(images, sizes) {
    // ICOファイル形式の手動生成
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);      // Reserved
    header.writeUInt16LE(1, 2);      // Type (1 = ICO)
    header.writeUInt16LE(images.length, 4); // Count

    const entries = [];
    const imageData = [];
    let offset = 6 + (images.length * 16);

    images.forEach((image, index) => {
      const entry = Buffer.alloc(16);
      const size = sizes[index];

      entry.writeUInt8(size === 256 ? 0 : size, 0); // Width
      entry.writeUInt8(size === 256 ? 0 : size, 1); // Height
      entry.writeUInt8(0, 2);                       // Color count
      entry.writeUInt8(0, 3);                       // Reserved
      entry.writeUInt16LE(1, 4);                    // Planes
      entry.writeUInt16LE(32, 6);                   // Bit count
      entry.writeUInt32LE(image.length, 8);         // Size
      entry.writeUInt32LE(offset, 12);              // Offset

      entries.push(entry);
      imageData.push(image);
      offset += image.length;
    });

    return Buffer.concat([header, ...entries, ...imageData]);
  }
}
```

### 3.2 セキュリティ実装

**設計根拠**: 要件6.2, 6.4, 6.5に基づき、最小限のシステム権限で実行し、入力ファイルの検証と悪意のあるファイルからの保護を実装します。

#### プリロードスクリプト

```javascript
// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// セキュアなAPI公開（要件8.4: セキュアなIPC通信）
contextBridge.exposeInMainWorld('electronAPI', {
  // ファイル操作（要件2.3: Native_Dialog使用、サニタイズ済み）
  selectImageFile: () => ipcRenderer.invoke('select-image-file'),
  saveICOFile: (data, defaultName) =>
    ipcRenderer.invoke('save-ico-file', data, sanitizeFilename(defaultName)),

  // 画像変換（要件6.4: 入力ファイル検証、バリデーション付き）
  convertToICO: (imageData, options) =>
    ipcRenderer.invoke('convert-to-ico', validateImageData(imageData), options),
  validateImageFile: (buffer, filename) =>
    ipcRenderer.invoke('validate-image-file', validateImageData(buffer), filename),

  // アプリケーション制御（要件2.2: System_Tray機能）
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  showWindow: () => ipcRenderer.invoke('show-window'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 設定管理（要件3.3: ローカル設定保存）
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // システム統合（要件2.1, 2.5: File_Association）
  setFileAssociation: (enabled) => ipcRenderer.invoke('set-file-association', enabled),

  // イベントリスナー（一方向のみ）
  onUpdateAvailable: (callback) =>
    ipcRenderer.on('update-available', callback),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on('update-downloaded', callback),
});

// 入力サニタイゼーション（要件6.4, 6.5: セキュリティ検証）
function sanitizeFilename(filename) {
  return filename.replace(/[<>:"/\\|?*]/g, '_').substring(0, 255);
}

function validateImageData(data) {
  if (!(data instanceof ArrayBuffer)) {
    throw new Error('Invalid image data format');
  }
  if (data.byteLength > 10 * 1024 * 1024) { // 10MB制限
    throw new Error('Image file too large');
  }
  if (data.byteLength === 0) {
    throw new Error('Empty file');
  }
  return data;
}

// 許可されたMIMEタイプ（要件1.1: サポート形式）
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/bmp',
  'image/gif',
  'image/tiff',
  'image/webp'
];

function validateMimeType(buffer, filename) {
  // ファイルヘッダーによるMIME type検証
  const header = new Uint8Array(buffer.slice(0, 16));

  // PNG: 89 50 4E 47
  if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
    return 'image/jpeg';
  }

  // その他の形式も同様に検証...

  throw new Error('Unsupported file format');
}
```

#### メインプロセスセキュリティ

```javascript
// electron/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// セキュリティ設定（要件6.2: 最小限のシステム権限）
app.whenReady().then(() => {
  // セキュアなウィンドウ作成（要件8.4: セキュアなIPC通信）
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,           // Node.js統合無効
      contextIsolation: true,           // コンテキスト分離有効
      enableRemoteModule: false,        // リモートモジュール無効
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,                   // 画像処理のためサンドボックス無効
      webSecurity: true,                // Webセキュリティ有効
    },
    show: false, // 準備完了まで非表示（要件4.1: 起動時間最適化）
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  // CSP設定
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob:; " +
          "connect-src 'none';"
        ]
      }
    });
  });

  // 外部ナビゲーション防止
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });

  // 新しいウィンドウ作成防止
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});
```

### 3.3 パフォーマンス最適化

**設計根拠**: 要件4に基づき、起動時間3秒以内、変換処理5秒以内、メモリ使用量200MB未満、CPU使用量5%未満を実現します。

#### 遅延ロード実装

```javascript
// electron/services/lazy-loader.js
class LazyLoader {
  constructor() {
    this.modules = new Map();
  }

  async load(moduleName) {
    if (!this.modules.has(moduleName)) {
      const startTime = Date.now();
      const module = await this.loadModule(moduleName);
      const loadTime = Date.now() - startTime;
      console.log(`Module ${moduleName} loaded in ${loadTime}ms`);
      this.modules.set(moduleName, module);
    }
    return this.modules.get(moduleName);
  }

  async loadModule(moduleName) {
    switch (moduleName) {
      case 'sharp':
        // 要件4.1: 起動時間最適化のため遅延ロード
        return require('sharp');
      case 'image-converter':
        return require('./image-converter');
      case 'file-validator':
        return require('./file-validator');
      default:
        throw new Error(`Unknown module: ${moduleName}`);
    }
  }

  // メモリ使用量監視（要件4.3対応）
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      used: Math.round(usage.heapUsed / 1024 / 1024), // MB
      total: Math.round(usage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100)
    };
  }
}

const lazyLoader = new LazyLoader();

// 使用例
ipcMain.handle('convert-to-ico', async (event, imageData, options) => {
  const sharp = await lazyLoader.load('sharp');
  const converter = await lazyLoader.load('image-converter');

  return converter.convertToICO(imageData, options);
});
```

#### ワーカープロセス実装

**設計根拠**: 要件8.5に基づき、画像処理をワーカープロセスに分離し、メインプロセスのブロッキングを防止します。

```javascript
// electron/workers/image-worker.js
const { parentPort } = require('worker_threads');
const sharp = require('sharp');
const { ICOGenerator } = require('../utils/ico-generator');

parentPort.on('message', async ({ id, imageData, options }) => {
  const startTime = Date.now();

  try {
    // 要件4.2: 5MB画像を5秒以内で処理
    const result = await ICOGenerator.create(Buffer.from(imageData), options);
    const processingTime = Date.now() - startTime;

    parentPort.postMessage({
      id,
      success: true,
      data: result,
      processingTime,
      memoryUsage: process.memoryUsage()
    });
  } catch (error) {
    parentPort.postMessage({
      id,
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime
    });
  }
});

// メインプロセスでの使用
const { Worker } = require('worker_threads');

class ImageWorkerPool {
  constructor(size = 2) {
    this.workers = [];
    this.queue = [];
    this.nextId = 0;
    this.activeJobs = new Map();

    for (let i = 0; i < size; i++) {
      this.createWorker();
    }
  }

  createWorker() {
    const worker = new Worker(path.join(__dirname, 'workers/image-worker.js'));
    worker.on('message', this.handleWorkerMessage.bind(this));
    worker.on('error', this.handleWorkerError.bind(this));
    this.workers.push({ worker, busy: false });
  }

  async processImage(imageData, options) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const job = { id, imageData, options, resolve, reject, startTime: Date.now() };

      this.activeJobs.set(id, job);
      this.queue.push(job);
      this.processQueue();

      // 要件4.2: タイムアウト設定（10秒）
      setTimeout(() => {
        if (this.activeJobs.has(id)) {
          this.activeJobs.delete(id);
          reject(new Error('Processing timeout'));
        }
      }, 10000);
    });
  }

  handleWorkerMessage({ id, success, data, error, processingTime, memoryUsage }) {
    const job = this.activeJobs.get(id);
    if (!job) return;

    this.activeJobs.delete(id);

    // パフォーマンス監視ログ
    console.log(`Image processing completed: ${processingTime}ms, Memory: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);

    if (success) {
      job.resolve({ data, processingTime });
    } else {
      job.reject(new Error(error));
    }

    // ワーカーを利用可能状態に戻す
    const worker = this.workers.find(w => w.worker === job.worker);
    if (worker) worker.busy = false;

    this.processQueue();
  }

  processQueue() {
    if (this.queue.length === 0) return;

    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;

    const job = this.queue.shift();
    availableWorker.busy = true;
    job.worker = availableWorker.worker;

    availableWorker.worker.postMessage({
      id: job.id,
      imageData: job.imageData,
      options: job.options
    });
  }
}
```

## 4. システム統合機能

### 4.1 ファイル関連付け

**設計根拠**: 要件2.1, 2.5に基づき、Windows、macOS、LinuxでのFile_Associationを実装し、右クリックメニューからの起動を可能にします。

```javascript
// electron/services/system-integration.js
const { app } = require('electron');
const path = require('path');

class SystemIntegration {
  static async setFileAssociation(enabled) {
    // 要件5.1-5.3: マルチプラットフォーム対応
    if (process.platform === 'win32') {
      return this.setWindowsFileAssociation(enabled);
    } else if (process.platform === 'darwin') {
      return this.setMacFileAssociation(enabled);
    } else if (process.platform === 'linux') {
      return this.setLinuxFileAssociation(enabled);
    }
  }

  static async setWindowsFileAssociation(enabled) {
    // 要件5.1: Windows 10/11対応
    const Registry = require('winreg');
    // 要件1.1: サポートする画像形式
    const extensions = ['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.tiff', '.webp'];

    for (const ext of extensions) {
      const regKey = new Registry({
        hive: Registry.HKCU,
        key: `\\Software\\Classes\\${ext}\\shell\\ConvertToICO`
      });

      if (enabled) {
        // 要件2.1: 右クリックメニューに「ICOに変換」を追加
        await regKey.set('', Registry.REG_SZ, 'ICOに変換');
        await regKey.set('Icon', Registry.REG_SZ, `"${process.execPath}",0`);

        const commandKey = new Registry({
          hive: Registry.HKCU,
          key: `\\Software\\Classes\\${ext}\\shell\\ConvertToICO\\command`
        });
        await commandKey.set('', Registry.REG_SZ,
          `"${process.execPath}" "%1"`);
      } else {
        await regKey.destroy().catch(() => {}); // エラーを無視
      }
    }
  }

  static async setMacFileAssociation(enabled) {
    // 要件5.2: macOS 12以降対応
    // macOS: Info.plistでの設定 + Launch Services登録
    if (enabled) {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      try {
        // Launch Servicesに登録
        await execAsync(`/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "${app.getPath('exe')}"`);

        // Finderサービスメニューに追加（Automatorワークフロー経由）
        await this.createMacServiceWorkflow();
      } catch (error) {
        console.error('Failed to set macOS file association:', error);
      }
    }
  }

  static async createMacServiceWorkflow() {
    // macOS Servicesメニュー用のワークフローを作成
    const fs = require('fs').promises;
    const os = require('os');
    const serviceDir = path.join(os.homedir(), 'Library/Services');
    const workflowPath = path.join(serviceDir, 'Convert to ICO.workflow');

    // Automatorワークフローの設定ファイルを作成
    // （実装詳細は省略）
  }

  static async setLinuxFileAssociation(enabled) {
    // 要件5.3: Ubuntu 20.04以降対応
    // Linux: .desktop ファイルの作成/削除
    const fs = require('fs').promises;
    const os = require('os');
    const desktopFile = path.join(os.homedir(), '.local/share/applications/iconconverter.desktop');
    const mimeFile = path.join(os.homedir(), '.local/share/mime/packages/iconconverter.xml');

    if (enabled) {
      // .desktopファイルの作成
      const desktopContent = `[Desktop Entry]
Name=IconConverter
Name[ja]=アイコンコンバーター
Comment=Convert images to ICO format
Comment[ja]=画像をICO形式に変換
Exec=${process.execPath} %f
Icon=${path.join(__dirname, '../assets/icon.png')}
Type=Application
Categories=Graphics;Photography;
MimeType=image/png;image/jpeg;image/bmp;image/gif;image/tiff;image/webp;
StartupNotify=true
`;

      await fs.mkdir(path.dirname(desktopFile), { recursive: true });
      await fs.writeFile(desktopFile, desktopContent);

      // 実行権限を付与
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      await execAsync(`chmod +x "${desktopFile}"`);
      await execAsync('update-desktop-database ~/.local/share/applications/');

    } else {
      await fs.unlink(desktopFile).catch(() => {});
      await fs.unlink(mimeFile).catch(() => {});
    }
  }
}
```

### 4.2 システムトレイ

**設計根拠**: 要件2.2に基づき、System_Trayでのバックグラウンド実行を実装し、ユーザーの利便性を向上させます。

```javascript
// electron/services/tray-manager.js
const { Tray, Menu, nativeImage, dialog } = require('electron');
const path = require('path');

class TrayManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.tray = null;
  }

  create() {
    const iconPath = path.join(__dirname, '../assets/tray-icon.png');
    const icon = nativeImage.createFromPath(iconPath);

    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'IconConverterを表示',
        click: () => this.showWindow()
      },
      {
        label: '画像を変換...',
        click: () => this.quickConvert()
      },
      { type: 'separator' },
      {
        label: '設定',
        click: () => this.showSettings()
      },
      {
        label: 'ファイル関連付け',
        type: 'checkbox',
        checked: false, // 設定から読み込み
        click: (menuItem) => this.toggleFileAssociation(menuItem.checked)
      },
      { type: 'separator' },
      {
        label: 'バージョン情報',
        click: () => this.showAbout()
      },
      {
        label: '終了',
        click: () => app.quit()
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('IconConverter - 画像をICOに変換');

    // ダブルクリックでウィンドウ表示
    this.tray.on('double-click', () => this.showWindow());
  }

  showWindow() {
    this.mainWindow.show();
    this.mainWindow.focus();
  }

  async quickConvert() {
    // 要件2.3: Native_Dialogを使用したファイル選択
    const result = await dialog.showOpenDialog(this.mainWindow, {
      title: '変換する画像を選択',
      properties: ['openFile'],
      filters: [
        {
          name: '画像ファイル',
          extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff', 'webp']
        },
        { name: 'すべてのファイル', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      // クイック変換処理
      this.showWindow();
      this.mainWindow.webContents.send('quick-convert', result.filePaths[0]);
    }
  }

  async toggleFileAssociation(enabled) {
    // 要件2.1, 2.5: ファイル関連付けの切り替え
    const SystemIntegration = require('./system-integration');
    try {
      await SystemIntegration.setFileAssociation(enabled);

      // 設定を保存
      const settings = await this.getSettings();
      settings.fileAssociation = enabled;
      await this.saveSettings(settings);

    } catch (error) {
      console.error('Failed to toggle file association:', error);

      // エラーダイアログを表示
      dialog.showErrorBox(
        'ファイル関連付けエラー',
        'ファイル関連付けの設定に失敗しました。管理者権限が必要な場合があります。'
      );
    }
  }

  showAbout() {
    const { app } = require('electron');
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'IconConverterについて',
      message: 'IconConverter',
      detail: `バージョン: ${app.getVersion()}\n画像をICO形式に変換するデスクトップアプリケーション`,
      buttons: ['OK']
    });
  }
}
```

## 5. 配布・更新戦略

### 5.1 electron-builder設定

```json
{
  "build": {
    "appId": "com.iconconverter.app",
    "productName": "IconConverter",
    "copyright": "Copyright © 2024 IconConverter Team",
    "directories": {
      "output": "dist-electron",
      "buildResources": "build"
    },
    "files": [
      "electron/**/*",
      "frontend/electron-dist/**/*",
      "shared/**/*",
      "node_modules/**/*",
      "!node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
      "!node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
      "!node_modules/*.d.ts",
      "!node_modules/.bin",
      "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
      "!.editorconfig",
      "!**/._*",
      "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
      "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
      "!**/{appveyor.yml,.travis.yml,circle.yml}",
      "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
    ],
    "extraResources": [
      {
        "from": "assets/",
        "to": "assets/",
        "filter": ["**/*"]
      }
    ],
    "mac": {
      "category": "public.app-category.graphics-design",
      "icon": "build/icon.icns",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist",
      "target": [
        {
          "target": "dmg",
          "arch": ["x64", "arm64"]
        },
        {
          "target": "zip",
          "arch": ["x64", "arm64"]
        }
      ]
    },
    "win": {
      "icon": "build/icon.ico",
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ]
    },
    "linux": {
      "icon": "build/icon.png",
      "category": "Graphics",
      "target": [
        {
          "target": "AppImage",
          "arch": ["x64"]
        },
        {
          "target": "deb",
          "arch": ["x64"]
        },
        {
          "target": "rpm",
          "arch": ["x64"]
        }
      ]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "publish": {
      "provider": "github",
      "owner": "iconconverter",
      "repo": "iconconverter"
    }
  }
}
```

### 5.2 自動更新実装

**設計根拠**: 要件6.3, 10.2に基づき、セキュアな検証付きのAuto_Update機能を実装し、electron-updaterを使用します。

```javascript
// electron/services/updater.js
const { autoUpdater } = require('electron-updater');
const { dialog, app } = require('electron');

class UpdateManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.setupAutoUpdater();
  }

  setupAutoUpdater() {
    // 要件6.3: セキュアな検証付き自動更新
    autoUpdater.autoDownload = false; // 手動ダウンロード制御
    autoUpdater.autoInstallOnAppQuit = true;

    // 開発環境では更新チェックを無効化
    if (process.env.NODE_ENV === 'development') {
      autoUpdater.updateConfigPath = null;
      return;
    }

    // 更新チェック間隔（4時間）
    this.checkForUpdates();
    setInterval(() => {
      this.checkForUpdates();
    }, 4 * 60 * 60 * 1000);

    // 更新イベント処理
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info.version);
      this.showUpdateAvailableDialog(info);
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('Update not available');
    });

    autoUpdater.on('error', (error) => {
      console.error('Update error:', error);
      // エラーは静かに処理（ユーザーに通知しない）
    });

    autoUpdater.on('download-progress', (progressObj) => {
      const message = `ダウンロード中: ${Math.round(progressObj.percent)}%`;
      this.mainWindow.webContents.send('update-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded');
      this.showUpdateReadyDialog(info);
    });
  }

  async checkForUpdates() {
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }

  async showUpdateAvailableDialog(info) {
    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'アップデートが利用可能',
      message: `新しいバージョン ${info.version} が利用可能です。`,
      detail: 'ダウンロードしますか？',
      buttons: ['今すぐダウンロード', '後で', 'スキップ'],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      // ダウンロード開始
      autoUpdater.downloadUpdate();
    } else if (result.response === 2) {
      // このバージョンをスキップ
      // 設定に保存して次回チェック時に無視
    }
  }

  async showUpdateReadyDialog(info) {
    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'アップデート準備完了',
      message: `バージョン ${info.version} のインストール準備が完了しました。`,
      detail: 'アプリケーションを再起動してアップデートを適用します。',
      buttons: ['今すぐ再起動', '次回起動時'],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      // 即座に再起動してインストール
      autoUpdater.quitAndInstall(false, true);
    }
    // response === 1 の場合は次回起動時に自動インストール
  }

  // 手動更新チェック（メニューから呼び出し）
  async manualCheckForUpdates() {
    try {
      const result = await autoUpdater.checkForUpdates();
      if (!result || !result.updateInfo) {
        dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: '更新チェック',
          message: '最新バージョンを使用しています。',
          buttons: ['OK']
        });
      }
    } catch (error) {
      dialog.showErrorBox(
        '更新チェックエラー',
        'アップデートの確認に失敗しました。インターネット接続を確認してください。'
      );
    }
  }
}
```

## 6. 開発・ビルドワークフロー

### 6.1 開発環境セットアップ

```json
{
  "scripts": {
    "electron:dev": "concurrently \"npm run frontend:dev\" \"wait-on http://localhost:5173 && electron electron/main.js\"",
    "electron:build": "npm run frontend:build:electron && electron-builder",
    "electron:build:all": "npm run frontend:build:electron && electron-builder --mac --win --linux",
    "frontend:dev": "cd frontend && npm run dev",
    "frontend:build:electron": "cd frontend && npm run build:electron",
    "test:electron": "jest --config jest.electron.config.js",
    "package": "electron-builder --publish=never",
    "publish": "electron-builder --publish=always"
  }
}
```

### 6.2 CI/CD設定

**設計根拠**: 要件10.3, 10.4, 10.5に基づき、GitHub Actionsを使用した自動化CI/CDを実装し、Code_Signing付きでマルチプラットフォームビルドを行います。

```yaml
# .github/workflows/electron-build.yml
name: Electron Build and Release

on:
  push:
    tags: ['v*']
  pull_request:
    branches: [main]

jobs:
  build:
    strategy:
      matrix:
        # 要件5.1-5.3, 10.4: Windows、macOS、Linux対応
        os: [ubuntu-latest, windows-latest, macos-latest]
        # 要件5.4: x64とarm64アーキテクチャサポート
        arch: [x64, arm64]
        exclude:
          # Linux arm64は除外（必要に応じて追加）
          - os: ubuntu-latest
            arch: arm64

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          # 要件8.2: Node.js v20 LTS使用
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build frontend for Electron
        run: npm run frontend:build:electron

      - name: Run tests
        run: |
          npm run test:backend
          npm run test:frontend
          npm run test:electron

      # 要件6.1: Code_Signing設定
      - name: Setup code signing (Windows)
        if: matrix.os == 'windows-latest'
        run: |
          echo "${{ secrets.WINDOWS_CERTIFICATE }}" | base64 --decode > certificate.p12
        env:
          WINDOWS_CERTIFICATE: ${{ secrets.WINDOWS_CERTIFICATE }}

      - name: Setup code signing (macOS)
        if: matrix.os == 'macos-latest'
        run: |
          echo "${{ secrets.MACOS_CERTIFICATE }}" | base64 --decode > certificate.p12
          security create-keychain -p "${{ secrets.KEYCHAIN_PASSWORD }}" build.keychain
          security import certificate.p12 -k build.keychain -P "${{ secrets.CERTIFICATE_PASSWORD }}" -T /usr/bin/codesign
          security list-keychains -s build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p "${{ secrets.KEYCHAIN_PASSWORD }}" build.keychain
        env:
          MACOS_CERTIFICATE: ${{ secrets.MACOS_CERTIFICATE }}
          CERTIFICATE_PASSWORD: ${{ secrets.CERTIFICATE_PASSWORD }}
          KEYCHAIN_PASSWORD: ${{ secrets.KEYCHAIN_PASSWORD }}

      - name: Build Electron app
        run: npm run electron:build -- --${{ matrix.arch }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # Windows Code Signing
          CSC_LINK: certificate.p12
          CSC_KEY_PASSWORD: ${{ secrets.CERTIFICATE_PASSWORD }}
          # macOS Code Signing & Notarization
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_ID_PASS: ${{ secrets.APPLE_ID_PASS }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          # 要件11.2: 配布パッケージサイズ制限
          ELECTRON_BUILDER_COMPRESSION_LEVEL: 9

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: electron-app-${{ matrix.os }}-${{ matrix.arch }}
          path: dist-electron/
          retention-days: 30

  # 要件10.5: 自動リリース公開
  release:
    needs: build
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')

    steps:
      - uses: actions/checkout@v4

      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: dist-electron/

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: dist-electron/**/*
          generate_release_notes: true
          draft: false
          prerelease: ${{ contains(github.ref, 'beta') || contains(github.ref, 'alpha') }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 7. アクセシビリティとUI一貫性

**設計根拠**: 要件7に基づき、WebUI版との一貫性を保ちながら、アクセシビリティ標準に準拠したインターフェースを実装します。

### 7.1 UI一貫性の維持

```typescript
// frontend/src/adapters/platform-adapter.ts
export class PlatformAdapter {
  static isElectron(): boolean {
    return window.electronAPI !== undefined;
  }

  static getFilePickerOptions(): FilePickerOptions {
    if (this.isElectron()) {
      // 要件2.3: Native_Dialog使用
      return {
        useNativeDialog: true,
        multiple: false,
        accept: 'image/*'
      };
    } else {
      // Web版の既存動作
      return {
        useNativeDialog: false,
        multiple: false,
        accept: '.png,.jpg,.jpeg,.bmp,.gif,.tiff,.webp'
      };
    }
  }
}
```

### 7.2 アクセシビリティ実装

```typescript
// frontend/src/components/AccessibleFileUploader.tsx
export const AccessibleFileUploader: React.FC = () => {
  const { isElectron } = usePlatform();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="画像ファイルを選択またはドラッグ&ドロップ"
      aria-describedby="file-upload-help"
      onKeyDown={handleKeyDown} // 要件7.4: キーボードナビゲーション
      className="focus:ring-2 focus:ring-blue-500" // フォーカス表示
    >
      {/* ファイルアップロードUI */}
      <p id="file-upload-help" className="sr-only">
        PNG、JPEG、BMP、GIF、TIFF、WebP形式の画像ファイルをアップロードできます
      </p>
    </div>
  );
};
```

### 7.3 国際化対応

```typescript
// frontend/src/i18n/index.ts
export const i18n = {
  ja: {
    'app.title': 'IconConverter',
    'file.select': 'ファイルを選択',
    'convert.start': '変換開始',
    'error.fileSize': 'ファイルサイズが大きすぎます'
  },
  en: {
    'app.title': 'IconConverter',
    'file.select': 'Select File',
    'convert.start': 'Start Conversion',
    'error.fileSize': 'File size is too large'
  }
};
```

## 8. パフォーマンス監視と最適化

**設計根拠**: 要件4に基づき、パフォーマンス目標を達成するための監視と最適化機能を実装します。

### 8.1 パフォーマンス監視

```javascript
// electron/services/performance-monitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      startupTime: 0,
      conversionTimes: [],
      memoryUsage: [],
      cpuUsage: []
    };
  }

  recordStartupTime(time) {
    this.metrics.startupTime = time;
    // 要件4.1: 3秒以内の起動時間チェック
    if (time > 3000) {
      console.warn(`Startup time exceeded target: ${time}ms`);
    }
  }

  recordConversionTime(time, fileSize) {
    this.metrics.conversionTimes.push({ time, fileSize });
    // 要件4.2: 5MB画像を5秒以内で処理チェック
    if (fileSize >= 5 * 1024 * 1024 && time > 5000) {
      console.warn(`Conversion time exceeded target: ${time}ms for ${fileSize} bytes`);
    }
  }

  monitorMemoryUsage() {
    setInterval(() => {
      const usage = process.memoryUsage();
      const usageMB = Math.round(usage.heapUsed / 1024 / 1024);

      this.metrics.memoryUsage.push(usageMB);

      // 要件4.3: 200MB未満のメモリ使用量チェック
      if (usageMB > 200) {
        console.warn(`Memory usage exceeded target: ${usageMB}MB`);
        // ガベージコレクションを促進
        if (global.gc) {
          global.gc();
        }
      }
    }, 30000); // 30秒間隔
  }
}
```

## 9. エラーハンドリングと復旧

### 9.1 包括的エラーハンドリング

```javascript
// electron/services/error-handler.js
class ErrorHandler {
  static setupGlobalHandlers() {
    // 未処理の例外をキャッチ
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.logError(error);
      // アプリケーションを安全に終了
      app.quit();
    });

    // 未処理のPromise拒否をキャッチ
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.logError(reason);
    });
  }

  static async logError(error) {
    // エラーログをファイルに保存
    const fs = require('fs').promises;
    const path = require('path');
    const { app } = require('electron');

    const logDir = path.join(app.getPath('userData'), 'logs');
    await fs.mkdir(logDir, { recursive: true });

    const logFile = path.join(logDir, 'error.log');
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ${error.stack || error.message}\n`;

    await fs.appendFile(logFile, logEntry);
  }
}
```

この包括的な設計書により、要件定義書で定められたすべての機能要件と非機能要件を満たすElectronアプリケーションを構築できます。既存のWebUI版の品質を保ちながら、デスクトップアプリケーションとしての利便性と機能を追加し、マルチプラットフォーム対応とセキュリティを確保します。
