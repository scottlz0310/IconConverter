/**
 * Electron API型定義
 * レンダラープロセスからアクセス可能なElectron APIの型定義
 */

/**
 * 変換オプション
 */
export interface ConversionOptions {
  /** 透明度を保持するか */
  preserveTransparency: boolean;
  /** 自動背景除去を適用するか */
  autoTransparent: boolean;
  /** 背景色（自動背景除去を使用しない場合） */
  backgroundColor?: string;
  /** 生成するアイコンサイズ（デフォルト: [16, 32, 48, 64, 128, 256]） */
  sizes?: number[];
}

/**
 * 変換結果
 */
export interface ConversionResult {
  /** 変換成功フラグ */
  success: boolean;
  /** ICOファイルデータ（成功時） */
  data?: ArrayBuffer;
  /** エラーメッセージ（失敗時） */
  error?: string;
  /** 処理時間（ミリ秒） */
  processingTime: number;
  /** メタデータ（成功時） */
  metadata?: ConversionMetadata;
}

/**
 * 変換メタデータ
 */
export interface ConversionMetadata {
  /** 入力画像形式 */
  inputFormat: string;
  /** 入力ファイルサイズ（バイト） */
  inputSize: number;
  /** 入力画像サイズ */
  inputDimensions: {
    width: number;
    height: number;
  };
  /** 出力ファイルサイズ（バイト） */
  outputSize: number;
  /** 生成されたアイコン数 */
  iconCount: number;
  /** 透明度保持フラグ */
  preservedTransparency: boolean;
  /** 自動背景除去フラグ */
  autoTransparent: boolean;
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  /** バリデーション成功フラグ */
  isValid: boolean;
  /** 画像形式（MIMEタイプ） */
  format?: string;
  /** ファイルサイズ（バイト） */
  size?: number;
  /** 画像幅 */
  width?: number;
  /** 画像高さ */
  height?: number;
  /** 透明度を持つか */
  hasTransparency?: boolean;
  /** 透明度の割合（0-1） */
  transparencyRatio?: number;
  /** エラーメッセージ（失敗時） */
  error?: string;
}

/**
 * ファイル選択結果
 */
export interface FileSelectResult {
  /** ファイルパス */
  path: string;
  /** ファイルデータ */
  buffer: ArrayBuffer;
  /** ファイル名 */
  name: string;
}

/**
 * アプリケーション設定
 */
export interface AppSettings {
  /** テーマ */
  theme: "light" | "dark" | "system";
  /** 言語 */
  language: string;
  /** ファイル関連付け有効フラグ */
  fileAssociation: boolean;
  /** 最小化起動フラグ */
  startMinimized: boolean;
  /** 自動更新有効フラグ */
  autoUpdate: boolean;
}

/**
 * メモリ使用量情報
 */
export interface MemoryInfo {
  /** 使用中のメモリ（MB） */
  used: number;
  /** 総メモリ（MB） */
  total: number;
  /** 使用率（%） */
  percentage: number;
  /** RSS（Resident Set Size）（MB） */
  rss: number;
}

/**
 * CPU使用量情報
 */
export interface CPUInfo {
  /** ユーザーCPU時間（マイクロ秒） */
  user: number;
  /** システムCPU時間（マイクロ秒） */
  system: number;
  /** 使用率（%、概算） */
  percentage: number;
}

/**
 * 更新情報
 */
export interface UpdateInfo {
  /** バージョン */
  version: string;
  /** リリース日 */
  releaseDate?: string;
  /** リリースノート */
  releaseNotes?: string;
}

/**
 * 更新進捗情報
 */
export interface UpdateProgress {
  /** 進捗率（%） */
  percent: number;
  /** 転送済みバイト数 */
  transferred: number;
  /** 総バイト数 */
  total: number;
  /** 転送速度（バイト/秒） */
  bytesPerSecond: number;
}

/**
 * Electron API
 * window.electronAPI として公開される
 */
export interface ElectronAPI {
  // アプリケーション情報
  /** アプリケーションバージョンを取得 */
  getAppVersion(): Promise<string>;

  // ウィンドウ制御
  /** ウィンドウを表示 */
  showWindow(): Promise<void>;
  /** システムトレイに最小化 */
  minimizeToTray(): Promise<void>;
  /** バックグラウンドで変換を実行 */
  backgroundConvert(
    filePath: string,
    options?: ConversionOptions,
  ): Promise<{ success: boolean; outputPath?: string; error?: string }>;

  // ファイル操作
  /** 画像ファイルを選択 */
  selectImageFile(): Promise<FileSelectResult | null>;
  /** 複数の画像ファイルを選択 */
  selectMultipleImageFiles(): Promise<FileSelectResult[]>;
  /** ICOファイルを保存 */
  saveICOFile(data: ArrayBuffer, defaultName: string): Promise<string | null>;
  /** ドロップされたファイルを処理 */
  handleDroppedFile(filePath: string): Promise<FileSelectResult | null>;
  /** 最近使用したファイルを取得 */
  getRecentFiles(): Promise<string[]>;
  /** 最近使用したファイルをクリア */
  clearRecentFiles(): Promise<{ success: boolean }>;
  /** ファイルをエクスプローラー/Finderで表示 */
  showInFolder(filePath: string): Promise<{ success: boolean }>;

  // 画像変換
  /** 画像をICO形式に変換 */
  convertToICO(
    imageData: ArrayBuffer,
    options: ConversionOptions,
  ): Promise<ConversionResult>;
  /** 画像ファイルを検証 */
  validateImageFile(
    buffer: ArrayBuffer,
    filename: string,
  ): Promise<ValidationResult>;

  // 設定管理
  /** 設定を取得 */
  getSettings(): Promise<AppSettings>;
  /** 設定を保存 */
  saveSettings(settings: AppSettings): Promise<{ success: boolean }>;

  // システム統合
  /** ファイル関連付けを設定 */
  setFileAssociation(enabled: boolean): Promise<{ success: boolean }>;

  // パフォーマンス監視
  /** メモリ使用量を取得 */
  getMemoryUsage(): Promise<MemoryInfo>;
  /** CPU使用量を取得 */
  getCPUUsage(): Promise<CPUInfo>;

  // コマンドライン引数からのファイル取得
  /** 保留中のファイルパスを取得（コマンドライン引数から） */
  getPendingFile(): Promise<string | null>;

  // イベントリスナー
  /** 更新が利用可能になったときのコールバック */
  onUpdateAvailable(callback: (info: UpdateInfo) => void): void;
  /** 更新がダウンロードされたときのコールバック */
  onUpdateDownloaded(callback: (info: UpdateInfo) => void): void;
  /** クイック変換が要求されたときのコールバック */
  onQuickConvert(callback: (filePath: string) => void): void;
  /** 更新進捗のコールバック */
  onUpdateProgress(callback: (progress: UpdateProgress) => void): void;
  /** コマンドライン引数からファイルを開くときのコールバック */
  onOpenFileFromCLI(callback: (filePath: string) => void): void;

  // イベントリスナーの削除
  /** 更新利用可能リスナーを削除 */
  removeUpdateAvailableListener(): void;
  /** 更新ダウンロード完了リスナーを削除 */
  removeUpdateDownloadedListener(): void;
  /** クイック変換リスナーを削除 */
  removeQuickConvertListener(): void;
  /** 更新進捗リスナーを削除 */
  removeUpdateProgressListener(): void;
  /** コマンドライン引数からのファイルオープンリスナーを削除 */
  removeOpenFileFromCLIListener(): void;
}

/**
 * Electron環境情報
 * window.electronEnv として公開される
 */
export interface ElectronEnv {
  /** Electron環境かどうか */
  isElectron: boolean;
  /** プラットフォーム */
  platform: string;
  /** Node.jsバージョン */
  nodeVersion: string;
  /** Chromeバージョン */
  chromeVersion: string;
  /** Electronバージョン */
  electronVersion: string;
}

/**
 * グローバルウィンドウオブジェクトの拡張
 */
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    electronEnv?: ElectronEnv;
  }
}

export {};
