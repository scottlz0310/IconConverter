/**
 * ファイルバリデーションユーティリティ
 * 要件6.4, 6.5: 入力ファイル検証、悪意のあるファイルからの保護
 */

/**
 * サポートされる画像形式のMIMEタイプ
 * 要件1.1: PNG、JPEG、BMP、GIF、TIFF、WebP対応
 */
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/bmp",
  "image/gif",
  "image/tiff",
  "image/webp",
];

/**
 * ファイルサイズ制限（10MB）
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * ファイル名のサニタイゼーション
 * パストラバーサル対策
 */
function sanitizeFilename(filename) {
  if (typeof filename !== "string") {
    throw new Error("Invalid filename type");
  }

  // 危険な文字を除去
  const sanitized = filename
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\.\./g, "_")
    .replace(/^\.+/, "")
    .substring(0, 255)
    .trim();

  // 空文字、アンダースコアのみ、ドットのみ、またはそれらの組み合わせを拒否
  if (sanitized.length === 0 || /^[_.]+$/.test(sanitized)) {
    throw new Error("Invalid filename");
  }

  return sanitized;
}

/**
 * ファイルヘッダーによるMIMEタイプ検証
 * 拡張子だけでなくファイルの実際の内容を検証
 */
function detectMimeType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 16) {
    return null;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // BMP: 42 4D
  if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
    return "image/bmp";
  }

  // GIF: 47 49 46 38 (GIF8)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }

  // TIFF (Little Endian): 49 49 2A 00
  if (
    buffer[0] === 0x49 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x2a &&
    buffer[3] === 0x00
  ) {
    return "image/tiff";
  }

  // TIFF (Big Endian): 4D 4D 00 2A
  if (
    buffer[0] === 0x4d &&
    buffer[1] === 0x4d &&
    buffer[2] === 0x00 &&
    buffer[3] === 0x2a
  ) {
    return "image/tiff";
  }

  // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF...WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * 拡張子からMIMEタイプを推測
 */
function getMimeTypeFromExtension(filename) {
  const ext = filename.toLowerCase().split(".").pop();

  const mimeMap = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    bmp: "image/bmp",
    gif: "image/gif",
    tif: "image/tiff",
    tiff: "image/tiff",
    webp: "image/webp",
  };

  return mimeMap[ext] || null;
}

/**
 * ファイルの包括的なバリデーション
 */
function validateImageFile(buffer, filename) {
  const result = {
    isValid: false,
    format: null,
    size: 0,
    error: null,
  };

  try {
    // バッファの検証
    if (!Buffer.isBuffer(buffer)) {
      result.error = "Invalid buffer format";
      return result;
    }

    // ファイルサイズの検証
    result.size = buffer.length;
    if (result.size === 0) {
      result.error = "Empty file";
      return result;
    }

    if (result.size > MAX_FILE_SIZE) {
      result.error = `File size exceeds limit (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`;
      return result;
    }

    // ファイル名のサニタイゼーション
    try {
      sanitizeFilename(filename);
    } catch (error) {
      result.error = error.message;
      return result;
    }

    // MIMEタイプの検証（ファイルヘッダー）
    const detectedMimeType = detectMimeType(buffer);
    if (!detectedMimeType) {
      result.error = "Unsupported file format (unable to detect)";
      return result;
    }

    // 許可されたMIMEタイプかチェック
    if (!ALLOWED_MIME_TYPES.includes(detectedMimeType)) {
      result.error = `Unsupported file format: ${detectedMimeType}`;
      return result;
    }

    // 拡張子とファイルヘッダーの整合性チェック
    const extensionMimeType = getMimeTypeFromExtension(filename);
    if (extensionMimeType && extensionMimeType !== detectedMimeType) {
      // 警告: 拡張子とファイル内容が一致しない
      console.warn(
        `File extension mismatch: ${filename} (expected ${extensionMimeType}, got ${detectedMimeType})`,
      );
    }

    // すべての検証をパス
    result.isValid = true;
    result.format = detectedMimeType;
    result.error = null;
  } catch (error) {
    result.error = error.message;
  }

  return result;
}

/**
 * パストラバーサル攻撃の検出
 */
function detectPathTraversal(filePath) {
  const normalized = filePath.replace(/\\/g, "/");

  // 危険なパターンを検出
  const dangerousPatterns = [
    /\.\./, // 親ディレクトリへの参照
    /^\/+/, // 絶対パス
    /^[a-zA-Z]:\//, // Windowsの絶対パス
    /~\//, // ホームディレクトリ
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  return false;
}

/**
 * 安全なファイルパスの検証
 */
function validateFilePath(filePath) {
  if (typeof filePath !== "string" || filePath.length === 0) {
    throw new Error("Invalid file path");
  }

  if (detectPathTraversal(filePath)) {
    throw new Error("Path traversal detected");
  }

  return true;
}

module.exports = {
  sanitizeFilename,
  detectMimeType,
  getMimeTypeFromExtension,
  validateImageFile,
  validateFilePath,
  detectPathTraversal,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
};
