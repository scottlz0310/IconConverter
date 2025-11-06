# IconConverter Electron テストガイド

## 概要

このドキュメントは、IconConverter Electronアプリケーションのテスト実装の完全ガイドです。

## 実装完了したテスト

### ✅ タスク12.1: Electronアプリテストの実装

**実装内容**:

1. **Jest設定** - ユニットテスト用のフレームワーク
2. **Electronモジュールモック** - テスト環境でのElectron API模擬
3. **基本機能テスト** - 画像変換、ファイル操作の自動テスト
4. **UI操作テスト** - Playwrightを使用したE2Eテスト
5. **アクセシビリティテスト** - WCAG 2.1 AA準拠の検証

**要件対応**:

- ✅ 要件7.3: WCAG 2.1 AAアクセシビリティ標準準拠
- ✅ 要件7.4: キーボードナビゲーションサポート

### ✅ タスク12.2: パフォーマンステスト

**実装内容**:

1. **起動時間測定** - 目標3秒以内
2. **変換処理時間測定** - 5MB画像を5秒以内
3. **メモリ使用量測定** - 目標200MB以下
4. **CPU使用量測定** - 目標5%未満

**要件対応**:

- ✅ 要件4.1: 起動時間3秒以内
- ✅ 要件4.2: 5MB画像を5秒以内で変換
- ✅ 要件4.3: メモリ使用量200MB以下
- ✅ 要件4.4: CPU使用量5%未満

## テスト実行方法

### 1. すべてのテストを実行

```bash
npm test
```

または統合スクリプトを使用:

```bash
./tests/run-all-tests.sh
```

### 2. 個別のテストスイート

#### ユニットテスト

```bash
npm run test:unit
```

**対象**:

- 画像変換ロジック
- ファイルバリデーション
- メモリ管理
- システム統合

#### E2Eテスト

```bash
# 通常実行
npm run test:e2e

# UIモード（推奨）
npm run test:e2e:ui

# ブラウザ表示モード
npm run test:e2e:headed

# デバッグモード
npm run test:e2e:debug
```

**対象**:

- アプリケーション起動
- ファイル選択・保存
- ドラッグ&ドロップ
- 画像プレビュー

#### アクセシビリティテスト

```bash
npm run test:accessibility
```

**検証項目**:

- WCAG 2.1 AA準拠
- キーボードナビゲーション
- スクリーンリーダー対応
- 色のコントラスト
- ARIAロール

#### パフォーマンステスト

```bash
npm run test:performance
```

**測定項目**:

- 起動時間
- 変換処理時間
- メモリ使用量
- CPU使用率

## テスト結果の確認

### カバレッジレポート

```bash
npm run test:unit -- --coverage
```

レポートは `coverage/electron/` に生成されます。

### E2Eテストレポート

テスト実行後、`test-results/` ディレクトリに結果が保存されます。

HTMLレポートを表示:

```bash
npm run test:e2e:report
```

### パフォーマンステスト結果

結果は `test-results/performance-results.json` に保存されます。

## ディレクトリ構造

```
tests/
├── setup/
│   └── jest.setup.js              # Jest共通設定
├── mocks/
│   └── electron.mock.js           # Electronモジュールモック
├── unit/
│   └── image-converter.test.js    # ユニットテスト
├── e2e/
│   ├── app-launch.spec.js         # 起動テスト
│   ├── file-operations.spec.js    # ファイル操作テスト
│   └── accessibility.accessibility.spec.js  # アクセシビリティテスト
├── performance/
│   └── performance-test.js        # パフォーマンステスト
├── run-all-tests.sh               # 統合テストスクリプト
├── verify-test-setup.js           # セットアップ検証
├── README.md                      # 詳細ガイド（英語）
└── TEST_IMPLEMENTATION_SUMMARY.md # 実装サマリー
```

## CI/CD統合

GitHub Actionsで自動実行されます:

- **トリガー**: Push、Pull Request
- **実行環境**: Ubuntu, Windows, macOS
- **テストスイート**: すべて
- **レポート**: 自動生成・アップロード

ワークフローファイル: `.github/workflows/electron-tests.yml`

## 成功基準

### 機能テスト

- ✅ すべてのユニットテストが合格
- ✅ すべてのE2Eテストが合格
- ✅ コードカバレッジ70%以上

### アクセシビリティテスト

- ✅ WCAG 2.1 AA違反0件
- ✅ キーボードナビゲーション動作確認
- ✅ スクリーンリーダー対応確認

### パフォーマンステスト

- ✅ 起動時間 < 3秒
- ✅ 変換時間 < 5秒（5MB画像）
- ✅ メモリ使用量 < 200MB
- ✅ CPU使用率 < 5%

## トラブルシューティング

### Electronアプリが起動しない

```bash
# 依存関係を再インストール
npm install

# Electronを再ビルド
npm run postinstall
```

### Playwrightのブラウザが見つからない

```bash
# Playwrightブラウザをインストール
npx playwright install
```

### テストがタイムアウトする

設定ファイルのタイムアウト値を調整:

- `jest.config.js`: `testTimeout`
- `playwright.config.js`: `timeout`

### モジュールが見つからない

```bash
# すべての依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

## 次のステップ

### 1. テストの実行確認

```bash
# セットアップ検証
node tests/verify-test-setup.js

# ユニットテスト実行
npm run test:unit

# E2EテストをUIモードで確認
npm run test:e2e:ui
```

### 2. カバレッジの確認

```bash
npm run test:unit -- --coverage
```

カバレッジレポートをブラウザで開く:

```bash
open coverage/electron/index.html  # macOS
xdg-open coverage/electron/index.html  # Linux
start coverage/electron/index.html  # Windows
```

### 3. パフォーマンスの測定

```bash
npm run test:performance
```

結果を確認:

```bash
cat test-results/performance-results.json
```

### 4. CI/CDの確認

GitHub Actionsでテストが自動実行されることを確認:

1. コードをプッシュ
2. GitHub Actionsタブで実行状況を確認
3. テスト結果とレポートを確認

## 参考資料

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Electron Testing Guide](https://www.electronjs.org/docs/latest/tutorial/automated-testing)

## サポート

問題が発生した場合:

1. `tests/README.md` の詳細ガイドを確認
2. `tests/TEST_IMPLEMENTATION_SUMMARY.md` の実装詳細を確認
3. GitHub Issuesで報告

---

**実装完了日**: 2024年11月6日
**バージョン**: 1.0.0
**ステータス**: ✅ 完了
