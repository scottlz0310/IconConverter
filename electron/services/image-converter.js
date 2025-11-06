/**
 * 画像変換サービス
 * 要件1.1-1.5, 9.2, 9.3, 9.5: 画像処理ロジックの統合
 *
 * ImageProcessor、ICOGenerator、TransparencyProcessorを統合し、
 * 完全な画像変換機能を提供
 */

const ImageProcessor = require("./image-processor");
const ICOGenerator = require("../utils/ico-generator");
const TransparencyProcessor = require("../utils/transparency-processor");
const { validateImageFile: validateFile } = require("../utils/validation");

/**
 * 変換オプションのデフォルト値
 */
const DEFAULT_OPTIONS = {
  preserveTransparency: true,
  autoTransparent: false,
  backgroundColor: null,
  sizes: [16, 32, 48, 64, 128, 256],
};

/**
 * 画像変換サービスクラス
 */
class ImageConverterService {
  /**
   * 画像をICO形式に変換
   * 要件1.1-1.5: 完全な変換機能
   *
   * @param {Buffer} inputBuffer - 入力画像データ
   * @param {Object} options - 変換オプション
   * @returns {Promise<Object>} 変換結果
   */
  static async convertToICO(inputBuffer, options = {}) {
    const startTime = Date.now();

    try {
      // オプションをマージ
      const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

      // 入力画像を検証（要件6.4: 入力ファイル検証）
      const validation = await ImageProcessor.validateImage(
        inputBuffer,
        options.filename || "image",
      );

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          processingTime: Date.now() - startTime,
        };
      }

      console.log(
        `Converting image: ${validation.format}, ${validation.width}x${validation.height}, ${Math.round(validation.size / 1024)}KB`,
      );

      // ICOファイルを生成
      const icoBuffer = await ICOGenerator.create(inputBuffer, {
        sizes: mergedOptions.sizes,
        preserveTransparency: mergedOptions.preserveTransparency,
        autoTransparent: mergedOptions.autoTransparent,
        backgroundColor: mergedOptions.backgroundColor,
      });

      // 生成されたICOファイルを検証
      const icoValidation = ICOGenerator.validateICO(icoBuffer);
      if (!icoValidation.isValid) {
        return {
          success: false,
          error: `Generated ICO validation failed: ${icoValidation.error}`,
          processingTime: Date.now() - startTime,
        };
      }

      const processingTime = Date.now() - startTime;

      console.log(
        `Conversion completed: ${icoValidation.imageCount} sizes, ${Math.round(icoBuffer.length / 1024)}KB, ${processingTime}ms`,
      );

      return {
        success: true,
        data: icoBuffer,
        processingTime: processingTime,
        metadata: {
          inputFormat: validation.format,
          inputSize: validation.size,
          inputDimensions: {
            width: validation.width,
            height: validation.height,
          },
          outputSize: icoBuffer.length,
          iconCount: icoValidation.imageCount,
          preservedTransparency: mergedOptions.preserveTransparency,
          autoTransparent: mergedOptions.autoTransparent,
        },
      };
    } catch (error) {
      console.error("Conversion error:", error);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 画像ファイルを検証
   * 要件6.4, 6.5: 入力ファイル検証、悪意のあるファイルからの保護
   *
   * @param {Buffer} buffer - 画像データ
   * @param {string} filename - ファイル名
   * @returns {Promise<Object>} 検証結果
   */
  static async validateImageFile(buffer, filename) {
    try {
      // セキュリティバリデーション（ファイルヘッダー、サイズ、形式）
      const securityValidation = validateFile(buffer, filename);

      if (!securityValidation.isValid) {
        return securityValidation;
      }

      // 画像処理ライブラリによる詳細検証
      const validation = await ImageProcessor.validateImage(buffer, filename);

      if (validation.isValid) {
        // 透明度情報を追加
        const hasTransparency =
          await TransparencyProcessor.hasTransparency(buffer);
        const transparencyRatio = hasTransparency
          ? await TransparencyProcessor.calculateTransparencyRatio(buffer)
          : 0;

        return {
          ...validation,
          format: securityValidation.format, // セキュリティ検証で確認された形式を使用
          hasTransparency,
          transparencyRatio: Math.round(transparencyRatio * 100) / 100,
        };
      }

      return validation;
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * 画像のプレビューを生成
   * 要件1.5: 変換前の画像プレビュー表示
   *
   * @param {Buffer} buffer - 画像データ
   * @param {number} maxSize - 最大サイズ（デフォルト: 512）
   * @returns {Promise<Object>} プレビューデータ
   */
  static async generatePreview(buffer, maxSize = 512) {
    try {
      const metadata = await ImageProcessor.getMetadata(buffer);

      // アスペクト比を保持してリサイズ
      let width = metadata.width;
      let height = metadata.height;

      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const previewBuffer = await ImageProcessor.resize(buffer, width, height, {
        fit: "inside",
        preserveAlpha: true,
      });

      // Base64エンコード
      const base64 = previewBuffer.toString("base64");
      const dataUrl = `data:image/png;base64,${base64}`;

      return {
        success: true,
        dataUrl,
        width,
        height,
        originalWidth: metadata.width,
        originalHeight: metadata.height,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 背景色を検出
   *
   * @param {Buffer} buffer - 画像データ
   * @returns {Promise<Object>} 背景色情報
   */
  static async detectBackgroundColor(buffer) {
    try {
      const backgroundColor =
        await TransparencyProcessor.detectBackgroundColorAdvanced(buffer);

      return {
        success: true,
        color: backgroundColor,
        hex: `#${backgroundColor.r.toString(16).padStart(2, "0")}${backgroundColor.g.toString(16).padStart(2, "0")}${backgroundColor.b.toString(16).padStart(2, "0")}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * バッチ変換（複数ファイル）
   *
   * @param {Array<Object>} files - ファイル配列 [{buffer, filename}]
   * @param {Object} options - 変換オプション
   * @returns {Promise<Array<Object>>} 変換結果配列
   */
  static async convertBatch(files, options = {}) {
    const results = [];

    for (const file of files) {
      const result = await this.convertToICO(file.buffer, {
        ...options,
        filename: file.filename,
      });

      results.push({
        filename: file.filename,
        ...result,
      });
    }

    return results;
  }

  /**
   * パフォーマンス統計を取得
   * 要件4.2: 5MB画像を5秒以内で処理
   *
   * @param {Buffer} buffer - テスト用画像データ
   * @returns {Promise<Object>} パフォーマンス統計
   */
  static async getPerformanceStats(buffer) {
    const stats = {
      fileSize: buffer.length,
      fileSizeMB: Math.round((buffer.length / 1024 / 1024) * 100) / 100,
    };

    try {
      // 検証時間
      const validationStart = Date.now();
      await ImageProcessor.validateImage(buffer, "test.png");
      stats.validationTime = Date.now() - validationStart;

      // 変換時間
      const conversionStart = Date.now();
      const result = await this.convertToICO(buffer);
      stats.conversionTime = Date.now() - conversionStart;

      stats.success = result.success;
      stats.totalTime = stats.validationTime + stats.conversionTime;

      // パフォーマンス評価
      if (stats.fileSizeMB >= 5) {
        stats.meetsRequirement = stats.conversionTime <= 5000; // 5秒以内
        stats.requirement = "5MB画像を5秒以内で処理";
      }

      return stats;
    } catch (error) {
      return {
        ...stats,
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = ImageConverterService;
