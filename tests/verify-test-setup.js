/**
 * テストセットアップ検証スクリプト
 *
 * すべてのテスト依存関係とファイルが正しく設定されているか確認
 */

const fs = require("fs");
const path = require("path");

console.log("=".repeat(50));
console.log("テストセットアップ検証");
console.log("=".repeat(50));
console.log("");

let allChecksPass = true;

/**
 * ファイルの存在確認
 */
function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  const status = exists ? "✓" : "✗";
  console.log(`${status} ${description}: ${filePath}`);
  if (!exists) allChecksPass = false;
  return exists;
}

/**
 * ディレクトリの存在確認
 */
function checkDirectoryExists(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  const status = exists ? "✓" : "✗";
  console.log(`${status} ${description}: ${dirPath}`);
  if (!exists) allChecksPass = false;
  return exists;
}

/**
 * package.jsonのスクリプト確認
 */
function checkPackageScripts() {
  console.log("\n--- package.json スクリプト確認 ---");

  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const requiredScripts = [
    "test",
    "test:unit",
    "test:e2e",
    "test:accessibility",
    "test:performance",
  ];

  requiredScripts.forEach((script) => {
    const exists = packageJson.scripts && packageJson.scripts[script];
    const status = exists ? "✓" : "✗";
    console.log(`${status} スクリプト: ${script}`);
    if (!exists) allChecksPass = false;
  });
}

/**
 * 依存関係の確認
 */
function checkDependencies() {
  console.log("\n--- 依存関係確認 ---");

  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const requiredDeps = [
    "jest",
    "@playwright/test",
    "playwright",
    "axe-core",
    "axe-playwright",
  ];

  requiredDeps.forEach((dep) => {
    const exists =
      (packageJson.dependencies && packageJson.dependencies[dep]) ||
      (packageJson.devDependencies && packageJson.devDependencies[dep]);
    const status = exists ? "✓" : "✗";
    console.log(`${status} 依存関係: ${dep}`);
    if (!exists) allChecksPass = false;
  });
}

// メイン検証
console.log("--- 設定ファイル確認 ---");
checkFileExists("jest.config.js", "Jest設定");
checkFileExists("playwright.config.js", "Playwright設定");
checkFileExists("tests/setup/jest.setup.js", "Jestセットアップ");
checkFileExists("tests/mocks/electron.mock.js", "Electronモック");

console.log("\n--- テストディレクトリ確認 ---");
checkDirectoryExists("tests/unit", "ユニットテスト");
checkDirectoryExists("tests/e2e", "E2Eテスト");
checkDirectoryExists("tests/performance", "パフォーマンステスト");

console.log("\n--- テストファイル確認 ---");
checkFileExists("tests/unit/image-converter.test.js", "画像変換テスト");
checkFileExists("tests/e2e/app-launch.spec.js", "起動テスト");
checkFileExists("tests/e2e/file-operations.spec.js", "ファイル操作テスト");
checkFileExists(
  "tests/e2e/accessibility.accessibility.spec.js",
  "アクセシビリティテスト",
);
checkFileExists(
  "tests/performance/performance-test.js",
  "パフォーマンステスト",
);

console.log("\n--- ドキュメント確認 ---");
checkFileExists("tests/README.md", "テストガイド");
checkFileExists("tests/TEST_IMPLEMENTATION_SUMMARY.md", "実装サマリー");

console.log("\n--- CI/CD確認 ---");
checkFileExists(".github/workflows/electron-tests.yml", "GitHub Actions");

checkPackageScripts();
checkDependencies();

// 結果サマリー
console.log("\n" + "=".repeat(50));
if (allChecksPass) {
  console.log("✓ すべてのチェックが合格しました！");
  console.log("=".repeat(50));
  console.log("\n次のステップ:");
  console.log("1. npm test を実行してテストを確認");
  console.log("2. npm run test:e2e:ui でE2EテストをUIモードで確認");
  console.log("3. npm run test:accessibility でアクセシビリティを検証");
  console.log("4. npm run test:performance でパフォーマンスを測定");
  process.exit(0);
} else {
  console.log("✗ 一部のチェックが失敗しました");
  console.log("=".repeat(50));
  console.log("\n不足しているファイルや設定を確認してください。");
  process.exit(1);
}
