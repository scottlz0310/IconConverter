# Electron化技術課題分析

## 1. 主要技術課題

### 1.1 Python→JavaScript移植の課題

#### 画像処理ライブラリの選択
**現状（Python）**:
- Pillow (PIL): 高性能、豊富な機能
- NumPy: 数値計算最適化

**JavaScript候補**:
1. **sharp** (Node.js)
   - ✅ 高性能（libvips基盤）
   - ✅ ICO形式サポート
   - ✅ 透明化処理対応
   - ❌ ブラウザ環境では動作不可
   - ❌ ネイティブモジュール（配布サイズ増加）

2. **jimp** (Pure JavaScript)
   - ✅ Pure JavaScript（配布簡単）
   - ✅ ブラウザ・Node.js両対応
   - ❌ ICO形式サポート限定的
   - ❌ パフォーマンス劣化

3. **canvas** + **node-canvas**
   - ✅ 柔軟な画像操作
   - ✅ ICO形式の手動実装可能
   - ❌ 複雑な実装が必要
   - ❌ ネイティブ依存

**推奨アプローチ**:
```javascript
// sharp + カスタムICO生成
const sharp = require('sharp');
const { createICO } = require('./ico-generator');

async function convertToICO(inputBuffer, options) {
  const sizes = [16, 32, 48, 64, 128, 256];
  const images = await Promise.all(
    sizes.map(size =>
      sharp(inputBuffer)
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );
  return createICO(images);
}
```

#### 透明化処理の移植
**現状（Python/Pillow）**:
```python
def auto_transparent_background(image):
    corners = [
        image.getpixel((0, 0)),
        image.getpixel((width-1, 0)),
        image.getpixel((0, height-1)),
        image.getpixel((width-1, height-1))
    ]
    # 背景色検出・透明化処理
```

**JavaScript移植案**:
```javascript
async function autoTransparentBackground(buffer) {
  const image = sharp(buffer);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  // 四隅の色を取得
  const corners = getCornerColors(data, info.width, info.height, info.channels);
  const bgColor = detectBackgroundColor(corners);

  // 透明化処理
  return await image
    .raw()
    .toColourspace('srgb')
    .toBuffer()
    .then(buffer => removeBackground(buffer, bgColor, info));
}
```

### 1.2 アーキテクチャ設計の課題

#### プロセス間通信（IPC）設計
**セキュリティ重視のIPC設計**:
```javascript
// preload.js - セキュアなAPI公開
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  convertImage: (imageData, options) =>
    ipcRenderer.invoke('convert-image', imageData, options),

  selectFile: () =>
    ipcRenderer.invoke('select-file'),

  saveFile: (data, defaultPath) =>
    ipcRenderer.invoke('save-file', data, defaultPath)
});

// main.js - メインプロセス処理
ipcMain.handle('convert-image', async (event, imageData, options) => {
  try {
    const result = await imageConverter.convert(imageData, options);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

#### ファイルシステム統合
**課題**: セキュリティとユーザビリティのバランス
```javascript
// ネイティブファイルダイアログ
async function selectImageFile() {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff', 'webp'] }
    ]
  });

  if (!result.canceled) {
    return fs.readFile(result.filePaths[0]);
  }
}

// ドラッグ&ドロップ処理
webContents.on('will-navigate', (event, navigationUrl) => {
  const parsedUrl = new URL(navigationUrl);
  if (parsedUrl.origin !== 'file://') {
    event.preventDefault();
  }
});
```

### 1.3 パフォーマンス最適化の課題

#### メモリ管理
**課題**: Electronの高メモリ使用量
```javascript
// ワーカープロセスでの画像処理
const { Worker } = require('worker_threads');

class ImageProcessor {
  constructor() {
    this.worker = new Worker('./image-worker.js');
  }

  async processImage(imageData, options) {
    return new Promise((resolve, reject) => {
      this.worker.postMessage({ imageData, options });
      this.worker.once('message', resolve);
      this.worker.once('error', reject);
    });
  }

  dispose() {
    this.worker.terminate();
  }
}
```

#### 起動時間最適化
```javascript
// 遅延ロード
const lazyRequire = (module) => {
  let cached;
  return () => {
    if (!cached) {
      cached = require(module);
    }
    return cached;
  };
};

const getSharp = lazyRequire('sharp');
const getImageProcessor = lazyRequire('./image-processor');
```

## 2. 技術選択肢の比較

### 2.1 画像処理ライブラリ比較

| ライブラリ | パフォーマンス | ICO対応 | 配布サイズ | 実装複雑度 | 推奨度 |
|------------|----------------|---------|------------|------------|--------|
| sharp | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | **推奨** |
| jimp | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 候補 |
| canvas | ⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐ | 非推奨 |

### 2.2 Electronアーキテクチャパターン

#### パターン1: モノリシック（非推奨）
```
┌─────────────────┐
│  Main Process   │
│  ├─ UI Logic    │
│  ├─ File I/O    │
│  └─ Image Proc  │
└─────────────────┘
```
- ❌ セキュリティリスク
- ❌ パフォーマンス問題
- ❌ 保守性低下

#### パターン2: 分離アーキテクチャ（推奨）
```
┌─────────────────┐    ┌─────────────────┐
│  Main Process   │◄──►│ Renderer Process│
│  ├─ App Control │    │  └─ React UI    │
│  ├─ File I/O    │    └─────────────────┘
│  └─ IPC Handler │           │
└─────────────────┘           │
         │                    │
         ▼                    ▼
┌─────────────────┐    ┌─────────────────┐
│ Worker Process  │    │ Preload Script  │
│ └─ Image Proc   │    │ └─ Secure API   │
└─────────────────┘    └─────────────────┘
```
- ✅ セキュリティ確保
- ✅ パフォーマンス最適化
- ✅ 保守性向上

## 3. 実装戦略

### 3.1 段階的移行アプローチ

#### Phase 1: 最小限プロトタイプ
```javascript
// 基本的なElectronアプリ
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 既存React UIを読み込み
  win.loadFile('dist/index.html');
}
```

#### Phase 2: 画像処理統合
```javascript
// 画像処理サービス
class ElectronImageService {
  async convertToICO(filePath, options) {
    const inputBuffer = await fs.readFile(filePath);

    // バリデーション（既存ロジック移植）
    await this.validateImage(inputBuffer);

    // 変換処理
    const icoBuffer = await this.processImage(inputBuffer, options);

    return icoBuffer;
  }
}
```

### 3.2 既存コード再利用戦略

#### React UIの完全再利用
```javascript
// vite.config.js - Electron向け設定
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: ['electron']
    }
  },
  define: {
    'process.env.ELECTRON': JSON.stringify(true)
  }
});
```

#### API層の抽象化
```typescript
// services/api-adapter.ts
interface ImageAPI {
  convertImage(file: File, options: ConversionOptions): Promise<Blob>;
}

class WebAPI implements ImageAPI {
  async convertImage(file: File, options: ConversionOptions): Promise<Blob> {
    // 既存のHTTP API呼び出し
  }
}

class ElectronAPI implements ImageAPI {
  async convertImage(file: File, options: ConversionOptions): Promise<Blob> {
    // Electron IPC呼び出し
    const result = await window.electronAPI.convertImage(
      await file.arrayBuffer(),
      options
    );
    return new Blob([result.data]);
  }
}

// 環境に応じて切り替え
export const imageAPI: ImageAPI =
  window.electronAPI ? new ElectronAPI() : new WebAPI();
```

## 4. パッケージング・配布戦略

### 4.1 electron-builder設定
```json
{
  "build": {
    "appId": "com.iconconverter.app",
    "productName": "IconConverter",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "node_modules/**/*"
    ],
    "mac": {
      "category": "public.app-category.graphics-design",
      "target": [
        { "target": "dmg", "arch": ["x64", "arm64"] },
        { "target": "zip", "arch": ["x64", "arm64"] }
      ]
    },
    "win": {
      "target": [
        { "target": "nsis", "arch": ["x64"] },
        { "target": "portable", "arch": ["x64"] }
      ]
    },
    "linux": {
      "target": [
        { "target": "AppImage", "arch": ["x64"] },
        { "target": "deb", "arch": ["x64"] },
        { "target": "rpm", "arch": ["x64"] }
      ]
    }
  }
}
```

### 4.2 自動更新機能
```javascript
const { autoUpdater } = require('electron-updater');

// 更新チェック
autoUpdater.checkForUpdatesAndNotify();

// 更新イベント処理
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Update available',
    message: 'A new version is available. It will be downloaded in the background.',
    buttons: ['OK']
  });
});
```

## 5. 品質保証戦略

### 5.1 テスト戦略
```javascript
// Electronアプリのテスト
const { Application } = require('spectron');

describe('IconConverter Electron App', () => {
  let app;

  beforeEach(async () => {
    app = new Application({
      path: './dist-electron/IconConverter.exe'
    });
    await app.start();
  });

  afterEach(async () => {
    if (app && app.isRunning()) {
      await app.stop();
    }
  });

  it('should launch successfully', async () => {
    const windowCount = await app.client.getWindowCount();
    expect(windowCount).toBe(1);
  });
});
```

### 5.2 パフォーマンス監視
```javascript
// パフォーマンス測定
const { performance } = require('perf_hooks');

class PerformanceMonitor {
  static measureConversion(fn) {
    return async (...args) => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();

      console.log(`Conversion took ${end - start} milliseconds`);
      return result;
    };
  }
}
```

## 6. 推奨実装ロードマップ

### Week 1-2: 技術検証
- [ ] Electron + React統合プロトタイプ
- [ ] sharp vs jimp パフォーマンステスト
- [ ] ICO生成ライブラリの実装・検証

### Week 3-4: コア機能実装
- [ ] IPC通信設計・実装
- [ ] 画像処理ロジック移植
- [ ] ファイルシステム統合

### Week 5-6: デスクトップ機能
- [ ] システムトレイ実装
- [ ] ファイル関連付け
- [ ] ネイティブダイアログ

### Week 7-8: パッケージング
- [ ] electron-builder設定
- [ ] クロスプラットフォームビルド
- [ ] 自動更新機能

### Week 9-10: 品質保証
- [ ] パフォーマンス最適化
- [ ] セキュリティ監査
- [ ] 配布テスト

この技術課題分析を基に、次回の実装時に効率的にElectron化を進めることができます。
