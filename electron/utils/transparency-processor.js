/**
 * 透明化処理ユーティリティ
 * 要件1.3, 1.4, 9.2: 既存Python実装のJavaScript移植
 *
 * Python実装（iconconverter/logic.py）からの移植
 * - 四隅色検出アルゴリズム
 * - 自動背景除去
 * - 既存透明度保持
 */

const sharp = require("sharp");

/**
 * 透明化処理クラス
 */
class TransparencyProcessor {
  /**
   * 画像の四隅の色を検出して背景色を推定
   * Python実装の _detect_background_color を移植
   *
   * @param {Buffer} imageData - raw画像データ
   * @param {Object} info - 画像情報 (width, height, channels)
   * @returns {Object} 背景色 {r, g, b, a}
   */
  static detectBackgroundColor(imageData, info) {
    const { width, height, channels } = info;

    // 四隅のピクセル位置を計算
    const corners = [
      0, // 左上
      (width - 1) * channels, // 右上
      (height - 1) * width * channels, // 左下
      ((height - 1) * width + (width - 1)) * channels, // 右下
    ];

    // 各隅の色を取得
    const colors = corners.map((offset) => ({
      r: imageData[offset],
      g: imageData[offset + 1],
      b: imageData[offset + 2],
      a: channels === 4 ? imageData[offset + 3] : 255,
    }));

    // 最も頻出する色を背景色として推定
    const colorCounts = new Map();
    colors.forEach((color) => {
      const key = `${color.r},${color.g},${color.b}`;
      colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
    });

    // 最大出現回数の色を取得
    let maxCount = 0;
    let backgroundColor = colors[0];

    colorCounts.forEach((count, key) => {
      if (count > maxCount) {
        maxCount = count;
        const [r, g, b] = key.split(",").map(Number);
        backgroundColor = { r, g, b, a: 255 };
      }
    });

    return backgroundColor;
  }

  /**
   * 指定した色を透明化
   * Python実装の _make_color_transparent を移植
   *
   * @param {Buffer} imageData - raw画像データ
   * @param {Object} info - 画像情報
   * @param {Object} targetColor - 透明化する色 {r, g, b}
   * @param {number} tolerance - 色の許容範囲（デフォルト: 10）
   * @returns {Buffer} 透明化処理後の画像データ
   */
  static makeColorTransparent(imageData, info, targetColor, tolerance = 10) {
    const { width, height, channels } = info;
    const pixelCount = width * height;

    // RGBAデータを作成（元がRGBの場合はアルファチャンネルを追加）
    const outputData = Buffer.alloc(pixelCount * 4);

    for (let i = 0; i < pixelCount; i++) {
      const inputOffset = i * channels;
      const outputOffset = i * 4;

      const r = imageData[inputOffset];
      const g = imageData[inputOffset + 1];
      const b = imageData[inputOffset + 2];
      const a = channels === 4 ? imageData[inputOffset + 3] : 255;

      // 色の類似度を計算（ユークリッド距離）
      const colorDiff = Math.sqrt(
        Math.pow(r - targetColor.r, 2) +
          Math.pow(g - targetColor.g, 2) +
          Math.pow(b - targetColor.b, 2),
      );

      // 出力データに書き込み
      outputData[outputOffset] = r;
      outputData[outputOffset + 1] = g;
      outputData[outputOffset + 2] = b;

      // 類似度が閾値以下の場合は透明化
      if (colorDiff <= tolerance) {
        outputData[outputOffset + 3] = 0; // 透明
      } else {
        outputData[outputOffset + 3] = a; // 元のアルファ値を保持
      }
    }

    return outputData;
  }

  /**
   * 自動背景透明化処理
   * 要件1.4: 単色背景画像の自動背景除去
   *
   * @param {Buffer} inputBuffer - 入力画像データ
   * @param {number} tolerance - 色の許容範囲
   * @returns {Promise<Buffer>} 透明化処理後の画像
   */
  static async autoTransparentBackground(inputBuffer, tolerance = 10) {
    try {
      // 画像をraw形式で取得
      const { data, info } = await sharp(inputBuffer)
        .ensureAlpha() // アルファチャンネルを確保
        .raw()
        .toBuffer({ resolveWithObject: true });

      // 背景色を検出
      const backgroundColor = this.detectBackgroundColor(data, info);

      console.log(
        `Detected background color: RGB(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b})`,
      );

      // 背景色を透明化
      const transparentData = this.makeColorTransparent(
        data,
        info,
        backgroundColor,
        tolerance,
      );

      // 透明化したデータをPNG形式に変換
      const outputBuffer = await sharp(transparentData, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 4,
        },
      })
        .png()
        .toBuffer();

      return outputBuffer;
    } catch (error) {
      throw new Error(`Failed to apply auto transparency: ${error.message}`);
    }
  }

  /**
   * 既存の透明度を保持しながら画像を処理
   * 要件1.3: PNG、GIF、WebP画像の既存透明度保持
   *
   * @param {Buffer} inputBuffer - 入力画像データ
   * @returns {Promise<Buffer>} 処理後の画像
   */
  static async preserveTransparency(inputBuffer) {
    try {
      // メタデータを取得して透明度の有無を確認
      const metadata = await sharp(inputBuffer).metadata();

      if (metadata.hasAlpha) {
        // 既に透明度がある場合はそのまま保持
        return await sharp(inputBuffer).png({ compressionLevel: 9 }).toBuffer();
      } else {
        // 透明度がない場合はアルファチャンネルを追加
        return await sharp(inputBuffer)
          .ensureAlpha()
          .png({ compressionLevel: 9 })
          .toBuffer();
      }
    } catch (error) {
      throw new Error(`Failed to preserve transparency: ${error.message}`);
    }
  }

  /**
   * 透明度を削除（背景色で塗りつぶし）
   *
   * @param {Buffer} inputBuffer - 入力画像データ
   * @param {string} backgroundColor - 背景色（デフォルト: 白）
   * @returns {Promise<Buffer>} 処理後の画像
   */
  static async removeTransparency(inputBuffer, backgroundColor = "#ffffff") {
    try {
      return await sharp(inputBuffer)
        .flatten({ background: backgroundColor })
        .png()
        .toBuffer();
    } catch (error) {
      throw new Error(`Failed to remove transparency: ${error.message}`);
    }
  }

  /**
   * 画像に透明度があるかチェック
   *
   * @param {Buffer} inputBuffer - 入力画像データ
   * @returns {Promise<boolean>} 透明度の有無
   */
  static async hasTransparency(inputBuffer) {
    try {
      const metadata = await sharp(inputBuffer).metadata();
      return metadata.hasAlpha || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * 透明ピクセルの割合を計算
   *
   * @param {Buffer} inputBuffer - 入力画像データ
   * @returns {Promise<number>} 透明ピクセルの割合（0-1）
   */
  static async calculateTransparencyRatio(inputBuffer) {
    try {
      const { data, info } = await sharp(inputBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { width, height, channels } = info;
      const pixelCount = width * height;
      let transparentCount = 0;

      for (let i = 0; i < pixelCount; i++) {
        const alphaOffset = i * channels + 3;
        if (data[alphaOffset] < 128) {
          // 半透明以下を透明とみなす
          transparentCount++;
        }
      }

      return transparentCount / pixelCount;
    } catch (error) {
      throw new Error(
        `Failed to calculate transparency ratio: ${error.message}`,
      );
    }
  }

  /**
   * エッジ検出による背景色推定（高度な手法）
   *
   * @param {Buffer} inputBuffer - 入力画像データ
   * @returns {Promise<Object>} 背景色 {r, g, b}
   */
  static async detectBackgroundColorAdvanced(inputBuffer) {
    try {
      const { data, info } = await sharp(inputBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { width, height, channels } = info;

      // 画像の外周ピクセルをサンプリング
      const edgeColors = [];

      // 上辺
      for (let x = 0; x < width; x++) {
        const offset = x * channels;
        edgeColors.push({
          r: data[offset],
          g: data[offset + 1],
          b: data[offset + 2],
        });
      }

      // 下辺
      for (let x = 0; x < width; x++) {
        const offset = ((height - 1) * width + x) * channels;
        edgeColors.push({
          r: data[offset],
          g: data[offset + 1],
          b: data[offset + 2],
        });
      }

      // 左辺
      for (let y = 1; y < height - 1; y++) {
        const offset = y * width * channels;
        edgeColors.push({
          r: data[offset],
          g: data[offset + 1],
          b: data[offset + 2],
        });
      }

      // 右辺
      for (let y = 1; y < height - 1; y++) {
        const offset = (y * width + (width - 1)) * channels;
        edgeColors.push({
          r: data[offset],
          g: data[offset + 1],
          b: data[offset + 2],
        });
      }

      // 最も頻出する色を計算
      const colorCounts = new Map();
      edgeColors.forEach((color) => {
        const key = `${color.r},${color.g},${color.b}`;
        colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
      });

      let maxCount = 0;
      let backgroundColor = { r: 255, g: 255, b: 255 };

      colorCounts.forEach((count, key) => {
        if (count > maxCount) {
          maxCount = count;
          const [r, g, b] = key.split(",").map(Number);
          backgroundColor = { r, g, b };
        }
      });

      return backgroundColor;
    } catch (error) {
      throw new Error(`Failed to detect background color: ${error.message}`);
    }
  }
}

module.exports = TransparencyProcessor;
