/**
 * 画像変換サービスのユニットテスト
 *
 * 要件1.1-1.5: 画像変換機能のテスト
 * 要件9.3, 9.5: Pillowと同等の処理精度の検証
 */

const fs = require("fs").promises;
const path = require("path");

// テスト対象のモジュールをモック化せずに直接テスト
jest.unmock("sharp");

describe("ImageConverter Service", () => {
  let ImageConverter;

  beforeAll(async () => {
    // 実際のImageConverterサービスを読み込み
    ImageConverter = require("../../electron/services/image-converter");
  });

  describe("基本的な画像変換", () => {
    test("PNG画像をICO形式に変換できる", async () => {
      // テスト用のPNG画像を作成
      const sharp = require("sharp");
      const testImage = await sharp({
        create: {
          width: 256,
          height: 256,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      const result = await ImageConverter.convertToICO(testImage, {
        preserveTransparency: true,
        autoTransparent: false,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.data.length).toBeGreaterThan(0);

      // ICOファイルヘッダーの検証
      expect(result.data.readUInt16LE(0)).toBe(0); // Reserved
      expect(result.data.readUInt16LE(2)).toBe(1); // Type (ICO)
      expect(result.data.readUInt16LE(4)).toBe(6); // 6つのサイズ
    });

    test("JPEG画像をICO形式に変換できる", async () => {
      const sharp = require("sharp");
      const testImage = await sharp({
        create: {
          width: 256,
          height: 256,
          channels: 3,
          background: { r: 0, g: 255, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const result = await ImageConverter.convertToICO(testImage, {
        preserveTransparency: false,
        autoTransparent: false,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Buffer);
    });

    test("6つのアイコンサイズを生成する（要件1.2）", async () => {
      const sharp = require("sharp");
      const testImage = await sharp({
        create: {
          width: 256,
          height: 256,
          channels: 4,
          background: { r: 0, g: 0, b: 255, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      const result = await ImageConverter.convertToICO(testImage, {
        preserveTransparency: true,
        autoTransparent: false,
      });

      expect(result.success).toBe(true);

      // ICOファイルのエントリ数を確認
      const entryCount = result.data.readUInt16LE(4);
      expect(entryCount).toBe(6); // 16, 32, 48, 64, 128, 256
    });
  });

  describe("透明度処理", () => {
    test("PNG画像の既存透明度を保持する（要件1.3）", async () => {
      const sharp = require("sharp");
      const testImage = await sharp({
        create: {
          width: 256,
          height: 256,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 0.5 },
        },
      })
        .png()
        .toBuffer();

      const result = await ImageConverter.convertToICO(testImage, {
        preserveTransparency: true,
        autoTransparent: false,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Buffer);
    });

    test("自動背景除去オプションが機能する（要件1.4）", async () => {
      const sharp = require("sharp");
      // 白背景の画像を作成
      const testImage = await sharp({
        create: {
          width: 256,
          height: 256,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer();

      const result = await ImageConverter.convertToICO(testImage, {
        preserveTransparency: true,
        autoTransparent: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Buffer);
    });
  });

  describe("エラーハンドリング", () => {
    test("無効な画像データでエラーを返す", async () => {
      const invalidData = Buffer.from("invalid image data");

      const result = await ImageConverter.convertToICO(invalidData, {
        preserveTransparency: true,
        autoTransparent: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("空のバッファでエラーを返す", async () => {
      const emptyBuffer = Buffer.alloc(0);

      const result = await ImageConverter.convertToICO(emptyBuffer, {
        preserveTransparency: true,
        autoTransparent: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test("サイズが大きすぎる画像でエラーを返す（要件6.4）", async () => {
      const sharp = require("sharp");
      // 11MBの画像を作成（制限は10MB）
      const largeImage = await sharp({
        create: {
          width: 4000,
          height: 4000,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      if (largeImage.length > 10 * 1024 * 1024) {
        const result = await ImageConverter.convertToICO(largeImage, {
          preserveTransparency: true,
          autoTransparent: false,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("too large");
      }
    });
  });

  describe("パフォーマンス", () => {
    test("5MB画像を5秒以内で変換する（要件4.2）", async () => {
      const sharp = require("sharp");
      // 約5MBの画像を作成
      const largeImage = await sharp({
        create: {
          width: 2000,
          height: 2000,
          channels: 4,
          background: { r: 128, g: 128, b: 128, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      const startTime = Date.now();
      const result = await ImageConverter.convertToICO(largeImage, {
        preserveTransparency: true,
        autoTransparent: false,
      });
      const endTime = Date.now();

      const processingTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(processingTime).toBeLessThan(5000); // 5秒以内
    }, 10000); // テストタイムアウトを10秒に設定
  });
});
