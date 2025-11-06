/**
 * ICO形式生成ユーティリティ
 * 要件1.2, 9.3, 9.5: 6つのアイコンサイズ同時生成、Pillowと同等の処理精度
 *
 * ICOファイル形式の手動バイナリ生成
 * Windows ICO形式仕様に準拠
 */

const sharp = require("sharp");
const TransparencyProcessor = require("./transparency-processor");

/**
 * 標準アイコンサイズ
 * 要件1.2: 16x16、32x32、48x48、64x64、128x128、256x256
 */
const STANDARD_ICON_SIZES = [16, 32, 48, 64, 128, 256];

/**
 * ICO形式生成クラス
 */
class ICOGenerator {
  /**
   * ICOファイルを生成
   * @param {Buffer} inputBuffer - 入力画像データ
   * @param {Object} options - 生成オプション
   * @returns {Promise<Buffer>} ICOファイルデータ
   */
  static async create(inputBuffer, options = {}) {
    const {
      sizes = STANDARD_ICON_SIZES,
      preserveTransparency = true,
      autoTransparent = false,
      backgroundColor = null,
    } = options;

    try {
      // 各サイズの画像を生成
      const images = await this.generateIconImages(inputBuffer, sizes, {
        preserveTransparency,
        autoTransparent,
        backgroundColor,
      });

      // ICOファイル形式に結合
      const icoBuffer = this.combineToICO(images, sizes);

      return icoBuffer;
    } catch (error) {
      throw new Error(`Failed to create ICO file: ${error.message}`);
    }
  }

  /**
   * 各サイズのアイコン画像を生成
   * @param {Buffer} inputBuffer - 入力画像データ
   * @param {Array<number>} sizes - サイズ配列
   * @param {Object} options - オプション
   * @returns {Promise<Array<Buffer>>} PNG画像配列
   */
  static async generateIconImages(inputBuffer, sizes, options) {
    const { preserveTransparency, autoTransparent, backgroundColor } = options;

    // 自動透明化処理（要件1.4: 単色背景画像の自動背景除去）
    let processedBuffer = inputBuffer;
    if (autoTransparent && !preserveTransparency) {
      try {
        processedBuffer = await TransparencyProcessor.autoTransparentBackground(
          inputBuffer,
          10, // tolerance
        );
        console.log("Auto transparency applied successfully");
      } catch (error) {
        console.warn("Failed to apply auto transparency:", error.message);
        // エラーの場合は元の画像を使用
        processedBuffer = inputBuffer;
      }
    }

    // 透明度の保持（要件1.3: PNG、GIF、WebP画像の既存透明度保持）
    if (preserveTransparency && !autoTransparent) {
      try {
        processedBuffer =
          await TransparencyProcessor.preserveTransparency(inputBuffer);
      } catch (error) {
        console.warn("Failed to preserve transparency:", error.message);
      }
    }

    // 各サイズの画像を生成
    const images = await Promise.all(
      sizes.map(async (size) => {
        let pipeline = sharp(processedBuffer).resize(size, size, {
          fit: "contain",
          background: backgroundColor || { r: 0, g: 0, b: 0, alpha: 0 },
        });

        // 透明度の処理
        if (preserveTransparency || autoTransparent) {
          pipeline = pipeline.png({ compressionLevel: 9 });
        } else {
          pipeline = pipeline
            .flatten({
              background: backgroundColor || "#ffffff",
            })
            .png({ compressionLevel: 9 });
        }

        return await pipeline.toBuffer();
      }),
    );

    return images;
  }

  /**
   * PNG画像をICOファイル形式に結合
   * Windows ICO形式仕様に準拠した手動バイナリ生成
   *
   * ICO形式構造:
   * - ICONDIR (6 bytes): ヘッダー
   * - ICONDIRENTRY[] (16 bytes × 画像数): ディレクトリエントリ
   * - Image Data: 各画像のPNGデータ
   *
   * @param {Array<Buffer>} images - PNG画像配列
   * @param {Array<number>} sizes - サイズ配列
   * @returns {Buffer} ICOファイルデータ
   */
  static combineToICO(images, sizes) {
    // ICONDIRヘッダー (6 bytes)
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // Reserved (must be 0)
    header.writeUInt16LE(1, 2); // Type (1 = ICO, 2 = CUR)
    header.writeUInt16LE(images.length, 4); // Number of images

    // ICONDIRENTRYエントリ配列 (16 bytes × 画像数)
    const entries = [];
    let offset = 6 + images.length * 16; // ヘッダー + エントリ配列のサイズ

    images.forEach((image, index) => {
      const entry = Buffer.alloc(16);
      const size = sizes[index];

      // サイズが256の場合は0として記録（ICO形式の仕様）
      entry.writeUInt8(size === 256 ? 0 : size, 0); // Width
      entry.writeUInt8(size === 256 ? 0 : size, 1); // Height
      entry.writeUInt8(0, 2); // Color palette (0 = no palette)
      entry.writeUInt8(0, 3); // Reserved (must be 0)
      entry.writeUInt16LE(1, 4); // Color planes (1)
      entry.writeUInt16LE(32, 6); // Bits per pixel (32 for RGBA)
      entry.writeUInt32LE(image.length, 8); // Image data size
      entry.writeUInt32LE(offset, 12); // Image data offset

      entries.push(entry);
      offset += image.length;
    });

    // すべてのバッファを結合
    return Buffer.concat([header, ...entries, ...images]);
  }

  /**
   * ICOファイルを検証
   * @param {Buffer} icoBuffer - ICOファイルデータ
   * @returns {Object} 検証結果
   */
  static validateICO(icoBuffer) {
    try {
      if (icoBuffer.length < 6) {
        return {
          isValid: false,
          error: "File too small to be a valid ICO",
        };
      }

      // ヘッダー検証
      const reserved = icoBuffer.readUInt16LE(0);
      const type = icoBuffer.readUInt16LE(2);
      const count = icoBuffer.readUInt16LE(4);

      if (reserved !== 0) {
        return {
          isValid: false,
          error: "Invalid ICO header: reserved field must be 0",
        };
      }

      if (type !== 1) {
        return {
          isValid: false,
          error: "Invalid ICO header: type must be 1",
        };
      }

      if (count === 0 || count > 20) {
        return {
          isValid: false,
          error: `Invalid ICO header: image count must be 1-20, got ${count}`,
        };
      }

      // エントリ検証
      const expectedSize = 6 + count * 16;
      if (icoBuffer.length < expectedSize) {
        return {
          isValid: false,
          error: "File too small for declared image count",
        };
      }

      return {
        isValid: true,
        imageCount: count,
        fileSize: icoBuffer.length,
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error.message}`,
      };
    }
  }

  /**
   * ICOファイルから画像情報を抽出
   * @param {Buffer} icoBuffer - ICOファイルデータ
   * @returns {Array<Object>} 画像情報配列
   */
  static extractImageInfo(icoBuffer) {
    const count = icoBuffer.readUInt16LE(4);
    const images = [];

    for (let i = 0; i < count; i++) {
      const entryOffset = 6 + i * 16;
      const entry = icoBuffer.slice(entryOffset, entryOffset + 16);

      const width = entry.readUInt8(0) || 256;
      const height = entry.readUInt8(1) || 256;
      const colorCount = entry.readUInt8(2);
      const planes = entry.readUInt16LE(4);
      const bitCount = entry.readUInt16LE(6);
      const size = entry.readUInt32LE(8);
      const offset = entry.readUInt32LE(12);

      images.push({
        width,
        height,
        colorCount,
        planes,
        bitCount,
        size,
        offset,
      });
    }

    return images;
  }

  /**
   * 標準サイズのICOファイルを生成（簡易版）
   * @param {Buffer} inputBuffer - 入力画像データ
   * @returns {Promise<Buffer>} ICOファイルデータ
   */
  static async createStandard(inputBuffer) {
    return this.create(inputBuffer, {
      sizes: STANDARD_ICON_SIZES,
      preserveTransparency: true,
      autoTransparent: false,
    });
  }

  /**
   * カスタムサイズのICOファイルを生成
   * @param {Buffer} inputBuffer - 入力画像データ
   * @param {Array<number>} sizes - カスタムサイズ配列
   * @returns {Promise<Buffer>} ICOファイルデータ
   */
  static async createCustom(inputBuffer, sizes) {
    // サイズを検証
    const validSizes = sizes.filter((size) => size > 0 && size <= 256);
    if (validSizes.length === 0) {
      throw new Error("No valid sizes provided");
    }

    return this.create(inputBuffer, {
      sizes: validSizes,
      preserveTransparency: true,
      autoTransparent: false,
    });
  }
}

module.exports = ICOGenerator;
