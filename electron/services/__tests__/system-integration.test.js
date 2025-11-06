/**
 * システム統合サービスのテスト
 * 要件2.1, 2.5: File_Association機能のテスト
 */

const {
  setFileAssociation,
  SUPPORTED_EXTENSIONS,
} = require("../system-integration");

describe("System Integration Service", () => {
  describe("SUPPORTED_EXTENSIONS", () => {
    it("should include all required image formats", () => {
      // 要件1.1: PNG、JPEG、BMP、GIF、TIFF、WebP対応
      expect(SUPPORTED_EXTENSIONS).toContain(".png");
      expect(SUPPORTED_EXTENSIONS).toContain(".jpg");
      expect(SUPPORTED_EXTENSIONS).toContain(".jpeg");
      expect(SUPPORTED_EXTENSIONS).toContain(".bmp");
      expect(SUPPORTED_EXTENSIONS).toContain(".gif");
      expect(SUPPORTED_EXTENSIONS).toContain(".tiff");
      expect(SUPPORTED_EXTENSIONS).toContain(".tif");
      expect(SUPPORTED_EXTENSIONS).toContain(".webp");
    });

    it("should have at least 8 supported extensions", () => {
      expect(SUPPORTED_EXTENSIONS.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe("setFileAssociation", () => {
    it("should be a function", () => {
      expect(typeof setFileAssociation).toBe("function");
    });

    it("should return a promise", () => {
      const result = setFileAssociation(false);
      expect(result).toBeInstanceOf(Promise);
    });

    // プラットフォーム固有のテストは実際の環境でのみ実行可能
    // ここでは基本的な構造のみをテスト
  });
});
