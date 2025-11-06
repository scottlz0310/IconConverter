/**
 * 画像処理サービス
 * 要件1.1, 9.2: PNG、JPEG、BMP、GIF、TIFF、WebP対応
 * sharpライブラリを使用した高性能画像処理
 */

const sharp = require("sharp");

/**
 * サポートされる画像形式
 * 要件1.1: 対応画像形式
 */
const SUPPORTED_FORMATS = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/bmp": [".bmp"],
  "image/gif": [".gif"],
  "image/tiff": [".tiff", ".tif"],
  "image/webp": [".webp"],
};

/**
 * ファイルヘッダーによるMIMEタイプ検出
 * 要件6.4: 入力ファイル検証
 */
const FILE_SIGNATURES = {
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/bmp": [0x42, 0x4d],
  "image/gif": [0x47, 0x49, 0x46, 0x38],
  "image/tiff": [0x49, 0x49, 0x2a, 0x00], // Little-endian
  "image/tiff_be": [0x4d, 0x4d, 0x00, 0x2a], // Big-endian
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF header
};

class ImageProcessor {
  /**
   * 画像メタデータを取得
   * @param {Buffer} buffer - 画像データ
   * @returns {Promise<Object>} メタデータ
   */
  static async getMetadata(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels,
        hasAlpha: metadata.hasAlpha,
        space: metadata.space,
        size: buffer.length,
      };
    } catch (error) {
      throw new Error(`Failed to read image metadata: ${error.message}`);
    }
  }

  /**
   * 画像形式を検証
   * 要件6.4: 入力ファイル検証
   * @param {Buffer} buffer - 画像データ
   * @param {string} filename - ファイル名
   * @returns {Promise<Object>} 検証結果
   */
  static async validateImage(buffer, filename) {
    try {
      // ファイルサイズチェック（10MB制限）
      if (buffer.length > 10 * 1024 * 1024) {
        return {
          isValid: false,
          error: "File size exceeds 10MB limit",
        };
      }

      if (buffer.length === 0) {
        return {
          isValid: false,
          error: "Empty file",
        };
      }

      // ファイルヘッダーによる形式検証
      const detectedFormat = this.detectFormatFromHeader(buffer);
      if (!detectedFormat) {
        return {
          isValid: false,
          error: "Unsupported file format",
        };
      }

      // sharpによる画像検証
      const metadata = await this.getMetadata(buffer);

      // サポートされる形式かチェック
      const supportedFormats = Object.keys(SUPPORTED_FORMATS);
      const mimeType = `image/${metadata.format}`;

      if (!supportedFormats.includes(mimeType)) {
        return {
          isValid: false,
          error: `Unsupported format: ${metadata.format}`,
        };
      }

      return {
        isValid: true,
        format: metadata.format,
        mimeType: mimeType,
        width: metadata.width,
        height: metadata.height,
        size: buffer.length,
        hasAlpha: metadata.hasAlpha,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Invalid image file: ${error.message}`,
      };
    }
  }

  /**
   * ファイルヘッダーから形式を検出
   * @param {Buffer} buffer - 画像データ
   * @returns {string|null} 検出された形式
   */
  static detectFormatFromHeader(buffer) {
    const header = buffer.slice(0, 16);

    for (const [format, signature] of Object.entries(FILE_SIGNATURES)) {
      if (this.matchesSignature(header, signature)) {
        return format.replace("_be", ""); // tiff_be -> tiff
      }
    }

    return null;
  }

  /**
   * ファイルヘッダーがシグネチャと一致するかチェック
   * @param {Buffer} header - ファイルヘッダー
   * @param {Array<number>} signature - シグネチャ
   * @returns {boolean} 一致するか
   */
  static matchesSignature(header, signature) {
    for (let i = 0; i < signature.length; i++) {
      if (header[i] !== signature[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * 画像をリサイズ
   * @param {Buffer} buffer - 画像データ
   * @param {number} width - 幅
   * @param {number} height - 高さ
   * @param {Object} options - オプション
   * @returns {Promise<Buffer>} リサイズされた画像
   */
  static async resize(buffer, width, height, options = {}) {
    const {
      fit = "contain",
      background = { r: 0, g: 0, b: 0, alpha: 0 },
      preserveAlpha = true,
    } = options;

    try {
      let pipeline = sharp(buffer).resize(width, height, {
        fit: fit,
        background: background,
      });

      // アルファチャンネルを保持
      if (preserveAlpha) {
        pipeline = pipeline.png();
      } else {
        pipeline = pipeline.flatten({ background: "#ffffff" }).png();
      }

      return await pipeline.toBuffer();
    } catch (error) {
      throw new Error(`Failed to resize image: ${error.message}`);
    }
  }

  /**
   * 複数サイズの画像を生成
   * 要件1.2: 6つのアイコンサイズ同時生成
   * @param {Buffer} buffer - 画像データ
   * @param {Array<number>} sizes - サイズ配列
   * @param {Object} options - オプション
   * @returns {Promise<Array<Buffer>>} リサイズされた画像配列
   */
  static async generateMultipleSizes(buffer, sizes, options = {}) {
    try {
      const images = await Promise.all(
        sizes.map((size) => this.resize(buffer, size, size, options)),
      );
      return images;
    } catch (error) {
      throw new Error(`Failed to generate multiple sizes: ${error.message}`);
    }
  }

  /**
   * 画像を特定の形式に変換
   * @param {Buffer} buffer - 画像データ
   * @param {string} format - 出力形式 ('png', 'jpeg', 'webp', etc.)
   * @param {Object} options - 変換オプション
   * @returns {Promise<Buffer>} 変換された画像
   */
  static async convert(buffer, format, options = {}) {
    try {
      let pipeline = sharp(buffer);

      switch (format.toLowerCase()) {
        case "png":
          pipeline = pipeline.png(options);
          break;
        case "jpeg":
        case "jpg":
          pipeline = pipeline.jpeg(options);
          break;
        case "webp":
          pipeline = pipeline.webp(options);
          break;
        case "tiff":
          pipeline = pipeline.tiff(options);
          break;
        default:
          throw new Error(`Unsupported output format: ${format}`);
      }

      return await pipeline.toBuffer();
    } catch (error) {
      throw new Error(`Failed to convert image: ${error.message}`);
    }
  }

  /**
   * 画像の統計情報を取得
   * @param {Buffer} buffer - 画像データ
   * @returns {Promise<Object>} 統計情報
   */
  static async getStats(buffer) {
    try {
      const stats = await sharp(buffer).stats();
      return stats;
    } catch (error) {
      throw new Error(`Failed to get image stats: ${error.message}`);
    }
  }
}

module.exports = ImageProcessor;
