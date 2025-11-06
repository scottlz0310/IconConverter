/**
 * 画像API適応層
 * 要件9.1, 9.4: WebUI版との機能パリティ維持
 * ElectronとWeb環境の両方で動作する抽象化レイヤー
 */

import {
  isElectron,
  getElectronAPI,
  type ConversionOptions,
  type ConversionResult,
  type ValidationResult,
} from '@/utils/electron';

/**
 * 画像API インターフェース
 */
export interface ImageAPI {
  convertImage(file: File, options: ConversionOptions): Promise<Blob>;
  validateFile(file: File): Promise<ValidationResult>;
  selectFile(): Promise<File | null>;
  saveFile(blob: Blob, filename: string): Promise<void>;
}

/**
 * Electron環境用の画像API実装
 * 要件3.3: IPC通信エラーハンドリングの実装
 */
class ElectronImageAPI implements ImageAPI {
  async convertImage(file: File, options: ConversionOptions): Promise<Blob> {
    try {
      const electronAPI = getElectronAPI();
      const buffer = await file.arrayBuffer();

      const result: ConversionResult = await electronAPI.convertToICO(buffer, options);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Conversion failed');
      }

      return new Blob([result.data], { type: 'image/x-icon' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Conversion failed';
      throw new Error(`画像変換に失敗しました: ${message}`);
    }
  }

  async validateFile(file: File): Promise<ValidationResult> {
    try {
      const electronAPI = getElectronAPI();
      const buffer = await file.arrayBuffer();

      return await electronAPI.validateImageFile(buffer, file.name);
    } catch (error) {
      console.error('File validation error:', error);
      return {
        isValid: false,
        error: 'ファイルの検証に失敗しました',
      };
    }
  }

  async selectFile(): Promise<File | null> {
    try {
      const electronAPI = getElectronAPI();
      const result = await electronAPI.selectImageFile();

      if (!result) {
        return null;
      }

      // ArrayBufferからFileオブジェクトを作成
      const blob = new Blob([result.buffer]);
      return new File([blob], result.name, { type: this.getMimeType(result.name) });
    } catch (error) {
      console.error('File selection error:', error);
      throw new Error('ファイルの選択に失敗しました');
    }
  }

  async saveFile(blob: Blob, filename: string): Promise<void> {
    try {
      const electronAPI = getElectronAPI();
      const buffer = await blob.arrayBuffer();

      const savedPath = await electronAPI.saveICOFile(buffer, filename);

      if (!savedPath) {
        throw new Error('File save cancelled');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('cancelled')) {
        throw error;
      }
      console.error('File save error:', error);
      throw new Error('ファイルの保存に失敗しました');
    }
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      bmp: 'image/bmp',
      gif: 'image/gif',
      tiff: 'image/tiff',
      webp: 'image/webp',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}

/**
 * Web環境用の画像API実装（既存のHTTP API）
 */
class WebImageAPI implements ImageAPI {
  private readonly baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }

  async convertImage(file: File, options: ConversionOptions): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('preserve_transparency', String(options.preserveTransparency));
    formData.append('auto_transparent', String(options.autoTransparent));
    if (options.backgroundColor) {
      formData.append('background_color', options.backgroundColor);
    }

    const response = await fetch(`${this.baseURL}/api/convert`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Conversion failed' }));
      throw new Error(error.detail || 'Conversion failed');
    }

    return response.blob();
  }

  async validateFile(file: File): Promise<ValidationResult> {
    // 基本的なクライアント側バリデーション
    const validTypes = [
      'image/png',
      'image/jpeg',
      'image/bmp',
      'image/gif',
      'image/tiff',
      'image/webp',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Unsupported file format',
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds 10MB limit',
      };
    }

    return {
      isValid: true,
      format: file.type,
      size: file.size,
    };
  }

  async selectFile(): Promise<File | null> {
    // Web環境では input[type="file"] を使用
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/bmp,image/gif,image/tiff,image/webp';

      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0] || null;
        resolve(file);
      };

      input.oncancel = () => {
        resolve(null);
      };

      input.click();
    });
  }

  async saveFile(blob: Blob, filename: string): Promise<void> {
    // Web環境ではダウンロードリンクを使用
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * 環境に応じた画像APIを作成
 */
export function createImageAPI(): ImageAPI {
  if (isElectron()) {
    return new ElectronImageAPI();
  }
  return new WebImageAPI();
}

/**
 * シングルトンインスタンス
 */
export const imageAPI = createImageAPI();
