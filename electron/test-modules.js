/**
 * モジュールロードテスト
 * 実装したモジュールが正しくロードできるか確認
 */

console.log("=".repeat(60));
console.log("モジュールロードテスト");
console.log("=".repeat(60));
console.log();

try {
  // 1. sharp
  console.log("1️⃣  sharp ライブラリ");
  const sharp = require("sharp");
  console.log("   ✅ ロード成功");
  console.log(`   バージョン: ${sharp.versions.vips}`);
  console.log();

  // 2. ImageProcessor
  console.log("2️⃣  ImageProcessor");
  const ImageProcessor = require("./services/image-processor");
  console.log("   ✅ ロード成功");
  console.log(
    `   メソッド: ${Object.getOwnPropertyNames(ImageProcessor)
      .filter((m) => typeof ImageProcessor[m] === "function")
      .join(", ")}`,
  );
  console.log();

  // 3. ICOGenerator
  console.log("3️⃣  ICOGenerator");
  const ICOGenerator = require("./utils/ico-generator");
  console.log("   ✅ ロード成功");
  console.log(
    `   メソッド: ${Object.getOwnPropertyNames(ICOGenerator)
      .filter((m) => typeof ICOGenerator[m] === "function")
      .join(", ")}`,
  );
  console.log();

  // 4. TransparencyProcessor
  console.log("4️⃣  TransparencyProcessor");
  const TransparencyProcessor = require("./utils/transparency-processor");
  console.log("   ✅ ロード成功");
  console.log(
    `   メソッド: ${Object.getOwnPropertyNames(TransparencyProcessor)
      .filter((m) => typeof TransparencyProcessor[m] === "function")
      .join(", ")}`,
  );
  console.log();

  // 5. ImageConverterService
  console.log("5️⃣  ImageConverterService");
  const ImageConverterService = require("./services/image-converter");
  console.log("   ✅ ロード成功");
  console.log(
    `   メソッド: ${Object.getOwnPropertyNames(ImageConverterService)
      .filter((m) => typeof ImageConverterService[m] === "function")
      .join(", ")}`,
  );
  console.log();

  // 6. 簡単な機能テスト
  console.log("6️⃣  簡単な機能テスト");
  console.log("   テスト用の小さな画像を生成...");

  // 100x100の赤い画像を生成
  sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 },
    },
  })
    .png()
    .toBuffer()
    .then(async (buffer) => {
      console.log(`   ✅ テスト画像生成成功 (${buffer.length} bytes)`);

      // メタデータ取得テスト
      const metadata = await ImageProcessor.getMetadata(buffer);
      console.log(
        `   ✅ メタデータ取得成功: ${metadata.width}x${metadata.height}, ${metadata.format}`,
      );

      // ICO変換テスト
      const result = await ImageConverterService.convertToICO(buffer, {
        sizes: [16, 32, 48],
        preserveTransparency: true,
      });

      if (result.success) {
        console.log(
          `   ✅ ICO変換成功: ${result.metadata.iconCount}個のアイコン, ${Math.round(result.data.length / 1024)}KB, ${result.processingTime}ms`,
        );
      } else {
        console.log(`   ❌ ICO変換失敗: ${result.error}`);
      }

      console.log();
      console.log("=".repeat(60));
      console.log("✅ すべてのモジュールが正常にロードされました");
      console.log("=".repeat(60));
    })
    .catch((error) => {
      console.error("   ❌ テスト失敗:", error.message);
      process.exit(1);
    });
} catch (error) {
  console.error("❌ モジュールロードエラー:", error.message);
  console.error(error.stack);
  process.exit(1);
}
