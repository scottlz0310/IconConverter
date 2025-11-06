/**
 * 画像処理機能のテストスクリプト
 *
 * 使用方法:
 * node electron/test-image-processing.js <画像ファイルパス>
 */

const fs = require("fs");
const path = require("path");
const ImageProcessor = require("./services/image-processor");
const ICOGenerator = require("./utils/ico-generator");
const TransparencyProcessor = require("./utils/transparency-processor");
const ImageConverterService = require("./services/image-converter");

async function testImageProcessing(imagePath) {
  console.log("=".repeat(60));
  console.log("画像処理機能テスト");
  console.log("=".repeat(60));
  console.log();

  try {
    // 画像ファイルを読み込み
    console.log(`📁 画像ファイル読み込み: ${imagePath}`);
    const imageBuffer = fs.readFileSync(imagePath);
    console.log(
      `   ファイルサイズ: ${Math.round(imageBuffer.length / 1024)}KB`,
    );
    console.log();

    // 1. 画像検証テスト
    console.log("1️⃣  画像検証テスト");
    console.log("-".repeat(60));
    const validation = await ImageProcessor.validateImage(
      imageBuffer,
      path.basename(imagePath),
    );
    console.log("   検証結果:", validation.isValid ? "✅ 有効" : "❌ 無効");
    if (validation.isValid) {
      console.log(`   形式: ${validation.format}`);
      console.log(`   サイズ: ${validation.width}x${validation.height}`);
      console.log(`   透明度: ${validation.hasAlpha ? "あり" : "なし"}`);
    } else {
      console.log(`   エラー: ${validation.error}`);
      return;
    }
    console.log();

    // 2. メタデータ取得テスト
    console.log("2️⃣  メタデータ取得テスト");
    console.log("-".repeat(60));
    const metadata = await ImageProcessor.getMetadata(imageBuffer);
    console.log(`   形式: ${metadata.format}`);
    console.log(`   サイズ: ${metadata.width}x${metadata.height}`);
    console.log(`   チャンネル数: ${metadata.channels}`);
    console.log(`   透明度: ${metadata.hasAlpha ? "あり" : "なし"}`);
    console.log(`   色空間: ${metadata.space}`);
    console.log();

    // 3. 透明度チェックテスト
    console.log("3️⃣  透明度チェックテスト");
    console.log("-".repeat(60));
    const hasTransparency =
      await TransparencyProcessor.hasTransparency(imageBuffer);
    console.log(`   透明度: ${hasTransparency ? "あり" : "なし"}`);
    if (hasTransparency) {
      const transparencyRatio =
        await TransparencyProcessor.calculateTransparencyRatio(imageBuffer);
      console.log(
        `   透明ピクセル割合: ${Math.round(transparencyRatio * 100)}%`,
      );
    }
    console.log();

    // 4. 背景色検出テスト
    console.log("4️⃣  背景色検出テスト");
    console.log("-".repeat(60));
    const bgColorResult =
      await ImageConverterService.detectBackgroundColor(imageBuffer);
    if (bgColorResult.success) {
      const { r, g, b } = bgColorResult.color;
      console.log(`   背景色: RGB(${r}, ${g}, ${b})`);
      console.log(`   HEX: ${bgColorResult.hex}`);
    } else {
      console.log(`   エラー: ${bgColorResult.error}`);
    }
    console.log();

    // 5. ICO変換テスト（透明度保持）
    console.log("5️⃣  ICO変換テスト（透明度保持）");
    console.log("-".repeat(60));
    const startTime1 = Date.now();
    const result1 = await ImageConverterService.convertToICO(imageBuffer, {
      preserveTransparency: true,
      autoTransparent: false,
    });
    const time1 = Date.now() - startTime1;

    if (result1.success) {
      console.log(`   ✅ 変換成功`);
      console.log(`   処理時間: ${time1}ms`);
      console.log(`   出力サイズ: ${Math.round(result1.data.length / 1024)}KB`);
      console.log(`   アイコン数: ${result1.metadata.iconCount}`);

      // ファイルに保存
      const outputPath1 = imagePath.replace(/\.[^.]+$/, "_preserve.ico");
      fs.writeFileSync(outputPath1, result1.data);
      console.log(`   保存先: ${outputPath1}`);
    } else {
      console.log(`   ❌ 変換失敗: ${result1.error}`);
    }
    console.log();

    // 6. ICO変換テスト（自動透明化）
    console.log("6️⃣  ICO変換テスト（自動透明化）");
    console.log("-".repeat(60));
    const startTime2 = Date.now();
    const result2 = await ImageConverterService.convertToICO(imageBuffer, {
      preserveTransparency: false,
      autoTransparent: true,
    });
    const time2 = Date.now() - startTime2;

    if (result2.success) {
      console.log(`   ✅ 変換成功`);
      console.log(`   処理時間: ${time2}ms`);
      console.log(`   出力サイズ: ${Math.round(result2.data.length / 1024)}KB`);
      console.log(`   アイコン数: ${result2.metadata.iconCount}`);

      // ファイルに保存
      const outputPath2 = imagePath.replace(/\.[^.]+$/, "_auto.ico");
      fs.writeFileSync(outputPath2, result2.data);
      console.log(`   保存先: ${outputPath2}`);
    } else {
      console.log(`   ❌ 変換失敗: ${result2.error}`);
    }
    console.log();

    // 7. ICO検証テスト
    if (result1.success) {
      console.log("7️⃣  ICO検証テスト");
      console.log("-".repeat(60));
      const icoValidation = ICOGenerator.validateICO(result1.data);
      console.log(
        `   検証結果: ${icoValidation.isValid ? "✅ 有効" : "❌ 無効"}`,
      );
      if (icoValidation.isValid) {
        console.log(`   画像数: ${icoValidation.imageCount}`);
        console.log(
          `   ファイルサイズ: ${Math.round(icoValidation.fileSize / 1024)}KB`,
        );

        // 画像情報を抽出
        const imageInfo = ICOGenerator.extractImageInfo(result1.data);
        console.log("   含まれるサイズ:");
        imageInfo.forEach((info, index) => {
          console.log(
            `     ${index + 1}. ${info.width}x${info.height} (${info.bitCount}bit, ${Math.round(info.size / 1024)}KB)`,
          );
        });
      } else {
        console.log(`   エラー: ${icoValidation.error}`);
      }
      console.log();
    }

    // 8. パフォーマンス統計
    console.log("8️⃣  パフォーマンス統計");
    console.log("-".repeat(60));
    const perfStats =
      await ImageConverterService.getPerformanceStats(imageBuffer);
    console.log(`   ファイルサイズ: ${perfStats.fileSizeMB}MB`);
    console.log(`   検証時間: ${perfStats.validationTime}ms`);
    console.log(`   変換時間: ${perfStats.conversionTime}ms`);
    console.log(`   合計時間: ${perfStats.totalTime}ms`);
    if (perfStats.meetsRequirement !== undefined) {
      console.log(
        `   要件達成: ${perfStats.meetsRequirement ? "✅" : "❌"} (${perfStats.requirement})`,
      );
    }
    console.log();

    console.log("=".repeat(60));
    console.log("✅ すべてのテストが完了しました");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ テスト中にエラーが発生しました:", error);
    console.error(error.stack);
  }
}

// コマンドライン引数から画像パスを取得
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "使用方法: node electron/test-image-processing.js <画像ファイルパス>",
  );
  console.error("例: node electron/test-image-processing.js test-image.png");
  process.exit(1);
}

const imagePath = args[0];
if (!fs.existsSync(imagePath)) {
  console.error(`エラー: ファイルが見つかりません: ${imagePath}`);
  process.exit(1);
}

// テスト実行
testImageProcessing(imagePath).catch((error) => {
  console.error("予期しないエラー:", error);
  process.exit(1);
});
