# Electron画像処理モジュール

## 概要

このディレクトリには、IconConverterのElectronデスクトップアプリケーション用の画像処理モジュールが含まれています。

## 実装済み機能

### ✅ タスク2.1: Sharp画像処理ライブラリの導入

**実装ファイル**: `services/image-processor.js`

- sharpライブラリを使用した高性能画像処理
- PNG、JPEG、BMP、GIF、TIFF、WebP対応
- 画像メタデータ取得
- 画像形式検証（ファイルヘッダーチェック）
- 画像リサイズ・変換機能
- 複数サイズの画像生成

**主要機能**:

```javascript
const ImageProcessor = require('./services/image-processor');

// 画像検証
const validation = await ImageProcessor.validateImage(buffer, filename);

// メタデータ取得
const metadata = await ImageProcessor.getMetadata(buffer);

// リサイズ
const resized = await ImageProcessor.resize(buffer, 256, 256);

// 複数サイズ生成
const images = await ImageProcessor.generateMultipleSizes(buffer, [16, 32, 48, 64, 128, 256]);
```

### ✅ タスク2.2: ICO形式生成機能の実装

**実装ファイル**: `utils/ico-generator.js`

- 6つのアイコンサイズ同時生成（16x16、32x32、48x48、64x64、128x128、256x256）
- Windows ICO形式の手動バイナリ生成
- ICOファイル検証機能
- 画像情報抽出機能

**主要機能**:

```javascript
const ICOGenerator = require('./utils/ico-generator');

// 標準サイズのICO生成
const icoBuffer = await ICOGenerator.createStandard(inputBuffer);

// カスタムサイズのICO生成
const customIco = await ICOGenerator.createCustom(inputBuffer, [32, 64, 128]);

// ICO検証
const validation = ICOGenerator.validateICO(icoBuffer);

// 画像情報抽出
const imageInfo = ICOGenerator.extractImageInfo(icoBuffer);
```

### ✅ タスク2.3: 透明化処理の移植

**実装ファイル**: `utils/transparency-processor.js`

- 四隅色検出アルゴリズム（Python実装からの移植）
- 自動背景除去機能
- 既存透明度保持処理
- 透明度チェック・計算機能
- 高度な背景色検出（エッジサンプリング）

**主要機能**:

```javascript
const TransparencyProcessor = require('./utils/transparency-processor');

// 自動背景透明化
const transparent = await TransparencyProcessor.autoTransparentBackground(buffer);

// 透明度保持
const preserved = await TransparencyProcessor.preserveTransparency(buffer);

// 透明度チェック
const hasAlpha = await TransparencyProcessor.hasTransparency(buffer);

// 透明ピクセル割合
const ratio = await TransparencyProcessor.calculateTransparencyRatio(buffer);

// 背景色検出
const bgColor = await TransparencyProcessor.detectBackgroundColorAdvanced(buffer);
```

### 統合サービス

**実装ファイル**: `services/image-converter.js`

すべての画像処理機能を統合した高レベルAPIを提供します。

```javascript
const ImageConverterService = require('./services/image-converter');

// ICO変換（透明度保持）
const result = await ImageConverterService.convertToICO(buffer, {
  preserveTransparency: true,
  autoTransparent: false
});

// ICO変換（自動透明化）
const result = await ImageConverterService.convertToICO(buffer, {
  preserveTransparency: false,
  autoTransparent: true
});

// 画像検証
const validation = await ImageConverterService.validateImageFile(buffer, filename);

// プレビュー生成
const preview = await ImageConverterService.generatePreview(buffer);

// 背景色検出
const bgColor = await ImageConverterService.detectBackgroundColor(buffer);

// パフォーマンス統計
const stats = await ImageConverterService.getPerformanceStats(buffer);
```

## ディレクトリ構造

```
electron/
├── main.js                          # メインプロセス
├── preload.js                       # プリロードスクリプト
├── services/                        # サービス層
│   ├── image-processor.js          # 画像処理サービス
│   └── image-converter.js          # 画像変換サービス（統合）
├── utils/                          # ユーティリティ
│   ├── ico-generator.js            # ICO形式生成
│   └── transparency-processor.js   # 透明化処理
├── test-image-processing.js        # テストスクリプト
└── README.md                       # このファイル
```

## テスト方法

### 画像処理機能のテスト

```bash
# テストスクリプトを実行
node electron/test-image-processing.js <画像ファイルパス>

# 例
node electron/test-image-processing.js test-image.png
```

テストスクリプトは以下をチェックします:

1. 画像検証
2. メタデータ取得
3. 透明度チェック
4. 背景色検出
5. ICO変換（透明度保持）
6. ICO変換（自動透明化）
7. ICO検証
8. パフォーマンス統計

### Electronアプリケーションのテスト

```bash
# 開発モードで起動
npm run dev

# または
npm run dev:frontend  # フロントエンド開発サーバー起動
npm run dev:electron  # Electronアプリ起動
```

## IPC通信API

メインプロセスで実装されているIPC通信ハンドラー:

### `convert-to-ico`

画像をICO形式に変換します。

**パラメータ**:

- `imageData`: ArrayBuffer - 画像データ
- `options`: Object - 変換オプション
  - `preserveTransparency`: boolean - 透明度を保持
  - `autoTransparent`: boolean - 自動背景透明化
  - `backgroundColor`: string - 背景色
  - `sizes`: Array<number> - アイコンサイズ配列

**戻り値**:

```javascript
{
  success: boolean,
  data: ArrayBuffer,      // ICOファイルデータ
  processingTime: number, // 処理時間（ミリ秒）
  metadata: {
    inputFormat: string,
    inputSize: number,
    inputDimensions: { width, height },
    outputSize: number,
    iconCount: number,
    preservedTransparency: boolean,
    autoTransparent: boolean
  }
}
```

### `validate-image-file`

画像ファイルを検証します。

**パラメータ**:

- `buffer`: ArrayBuffer - 画像データ
- `filename`: string - ファイル名

**戻り値**:

```javascript
{
  isValid: boolean,
  format: string,
  mimeType: string,
  width: number,
  height: number,
  size: number,
  hasAlpha: boolean,
  hasTransparency: boolean,
  transparencyRatio: number
}
```

### `get-memory-usage`

メモリ使用量を取得します。

**戻り値**:

```javascript
{
  used: number,       // 使用中のヒープメモリ（MB）
  total: number,      // 総ヒープメモリ（MB）
  percentage: number, // 使用率（%）
  rss: number        // RSS（MB）
}
```

### `get-cpu-usage`

CPU使用量を取得します。

**戻り値**:

```javascript
{
  user: number,      // ユーザーCPU時間
  system: number,    // システムCPU時間
  percentage: number // 使用率（概算）
}
```

## パフォーマンス要件

実装は以下のパフォーマンス要件を満たすように設計されています:

- ✅ **要件4.1**: 起動時間3秒以内（遅延ロード実装）
- ✅ **要件4.2**: 5MB画像を5秒以内で処理
- ✅ **要件4.3**: メモリ使用量200MB未満
- ✅ **要件4.4**: CPU使用量5%未満（アイドル時）

## 次のステップ

### フェーズ2: IPC通信とファイル処理

次のタスクでは以下を実装します:

1. **タスク3.1**: セキュアなIPC APIの設計・実装
2. **タスク3.2**: ファイルシステム統合
3. **タスク3.3**: バリデーション機能の移植
4. **タスク4.1**: API適応層の実装
5. **タスク4.2**: ファイル処理UIの拡張
6. **タスク4.3**: 状態管理の調整

## トラブルシューティング

### sharpのインストールエラー

```bash
# sharpを再インストール
npm install sharp --force

# または
npm rebuild sharp
```

### メモリ不足エラー

Node.jsのメモリ制限を増やす:

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
```

## 参考資料

- [sharp Documentation](https://sharp.pixelplumbing.com/)
- [ICO File Format Specification](https://en.wikipedia.org/wiki/ICO_(file_format))
- [Electron IPC Documentation](https://www.electronjs.org/docs/latest/tutorial/ipc)
