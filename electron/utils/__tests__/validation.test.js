/**
 * バリデーション機能のテスト
 * 要件6.4, 6.5: 入力ファイル検証、悪意のあるファイルからの保護
 */

const {
  sanitizeFilename,
  detectMimeType,
  getMimeTypeFromExtension,
  validateImageFile,
  validateFilePath,
  detectPathTraversal,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} = require("../validation");

describe("Validation Utilities", () => {
  describe("sanitizeFilename", () => {
    test("should remove dangerous characters", () => {
      expect(sanitizeFilename('test<>:"/\\|?*.png')).toBe("test_________.png");
    });

    test("should handle path traversal attempts", () => {
      expect(sanitizeFilename("../../../etc/passwd")).toBe("______etc_passwd");
    });

    test("should limit filename length", () => {
      const longName = "a".repeat(300) + ".png";
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    test("should throw error for invalid input", () => {
      expect(() => sanitizeFilename(null)).toThrow("Invalid filename type");
      expect(() => sanitizeFilename(123)).toThrow("Invalid filename type");
    });

    test("should throw error for empty filename", () => {
      expect(() => sanitizeFilename("...")).toThrow("Invalid filename");
    });
  });

  describe("detectMimeType", () => {
    test("should detect PNG format", () => {
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
      ]);
      expect(detectMimeType(pngHeader)).toBe("image/png");
    });

    test("should detect JPEG format", () => {
      const jpegHeader = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
      ]);
      expect(detectMimeType(jpegHeader)).toBe("image/jpeg");
    });

    test("should detect BMP format", () => {
      const bmpHeader = Buffer.from([
        0x42, 0x4d, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
      ]);
      expect(detectMimeType(bmpHeader)).toBe("image/bmp");
    });

    test("should detect GIF format", () => {
      const gifHeader = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
      ]);
      expect(detectMimeType(gifHeader)).toBe("image/gif");
    });

    test("should detect TIFF format (Little Endian)", () => {
      const tiffHeader = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
      ]);
      expect(detectMimeType(tiffHeader)).toBe("image/tiff");
    });

    test("should detect TIFF format (Big Endian)", () => {
      const tiffHeader = Buffer.from([
        0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
      ]);
      expect(detectMimeType(tiffHeader)).toBe("image/tiff");
    });

    test("should detect WebP format", () => {
      const webpHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
        0x00, 0x00, 0x00, 0x00,
      ]);
      expect(detectMimeType(webpHeader)).toBe("image/webp");
    });

    test("should return null for unknown format", () => {
      const unknownHeader = Buffer.from([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
      ]);
      expect(detectMimeType(unknownHeader)).toBeNull();
    });

    test("should return null for too short buffer", () => {
      const shortBuffer = Buffer.from([0x89, 0x50]);
      expect(detectMimeType(shortBuffer)).toBeNull();
    });
  });

  describe("getMimeTypeFromExtension", () => {
    test("should return correct MIME type for PNG", () => {
      expect(getMimeTypeFromExtension("test.png")).toBe("image/png");
      expect(getMimeTypeFromExtension("test.PNG")).toBe("image/png");
    });

    test("should return correct MIME type for JPEG", () => {
      expect(getMimeTypeFromExtension("test.jpg")).toBe("image/jpeg");
      expect(getMimeTypeFromExtension("test.jpeg")).toBe("image/jpeg");
    });

    test("should return null for unsupported extension", () => {
      expect(getMimeTypeFromExtension("test.txt")).toBeNull();
      expect(getMimeTypeFromExtension("test.exe")).toBeNull();
    });
  });

  describe("validateImageFile", () => {
    test("should validate valid PNG file", () => {
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const buffer = Buffer.concat([pngHeader, Buffer.alloc(1000)]);

      const result = validateImageFile(buffer, "test.png");

      expect(result.isValid).toBe(true);
      expect(result.format).toBe("image/png");
      expect(result.size).toBe(buffer.length);
      expect(result.error).toBeNull();
    });

    test("should reject empty file", () => {
      const buffer = Buffer.alloc(0);

      const result = validateImageFile(buffer, "test.png");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Empty file");
    });

    test("should reject file exceeding size limit", () => {
      const largeBuffer = Buffer.alloc(MAX_FILE_SIZE + 1);

      const result = validateImageFile(largeBuffer, "test.png");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("exceeds limit");
    });

    test("should reject unsupported format", () => {
      const unknownBuffer = Buffer.from([
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
      ]);

      const result = validateImageFile(unknownBuffer, "test.png");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Unsupported file format");
    });

    test("should reject invalid buffer", () => {
      const result = validateImageFile("not a buffer", "test.png");

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Invalid buffer format");
    });

    test("should reject invalid filename", () => {
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const buffer = Buffer.concat([pngHeader, Buffer.alloc(100)]);

      const result = validateImageFile(buffer, "...");

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid filename");
    });
  });

  describe("detectPathTraversal", () => {
    test("should detect parent directory references", () => {
      expect(detectPathTraversal("../file.png")).toBe(true);
      expect(detectPathTraversal("../../file.png")).toBe(true);
      expect(detectPathTraversal("dir/../file.png")).toBe(true);
    });

    test("should detect absolute paths", () => {
      expect(detectPathTraversal("/etc/passwd")).toBe(true);
      expect(detectPathTraversal("//server/share")).toBe(true);
    });

    test("should detect Windows absolute paths", () => {
      expect(detectPathTraversal("C:/Windows/System32")).toBe(true);
      expect(detectPathTraversal("D:/file.png")).toBe(true);
    });

    test("should detect home directory references", () => {
      expect(detectPathTraversal("~/file.png")).toBe(true);
    });

    test("should allow safe relative paths", () => {
      expect(detectPathTraversal("file.png")).toBe(false);
      expect(detectPathTraversal("dir/file.png")).toBe(false);
      expect(detectPathTraversal("dir/subdir/file.png")).toBe(false);
    });
  });

  describe("validateFilePath", () => {
    test("should validate safe file paths", () => {
      expect(() => validateFilePath("file.png")).not.toThrow();
      expect(() => validateFilePath("dir/file.png")).not.toThrow();
    });

    test("should reject path traversal attempts", () => {
      expect(() => validateFilePath("../file.png")).toThrow(
        "Path traversal detected",
      );
      expect(() => validateFilePath("/etc/passwd")).toThrow(
        "Path traversal detected",
      );
    });

    test("should reject invalid input", () => {
      expect(() => validateFilePath("")).toThrow("Invalid file path");
      expect(() => validateFilePath(null)).toThrow("Invalid file path");
      expect(() => validateFilePath(123)).toThrow("Invalid file path");
    });
  });

  describe("ALLOWED_MIME_TYPES", () => {
    test("should include all supported formats", () => {
      expect(ALLOWED_MIME_TYPES).toContain("image/png");
      expect(ALLOWED_MIME_TYPES).toContain("image/jpeg");
      expect(ALLOWED_MIME_TYPES).toContain("image/bmp");
      expect(ALLOWED_MIME_TYPES).toContain("image/gif");
      expect(ALLOWED_MIME_TYPES).toContain("image/tiff");
      expect(ALLOWED_MIME_TYPES).toContain("image/webp");
    });

    test("should have correct length", () => {
      expect(ALLOWED_MIME_TYPES).toHaveLength(6);
    });
  });

  describe("MAX_FILE_SIZE", () => {
    test("should be 10MB", () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });
});
