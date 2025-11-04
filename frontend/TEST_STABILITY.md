# テスト安定化ガイド

## 概要

WebUI版のテストを安定化するための設定と対策をまとめたドキュメントです。

## 実施した安定化対策

### 1. Playwright設定の最適化

**ファイル**: `playwright.config.ts`

#### 変更内容

```typescript
// 並列実行を無効化（テスト間の競合を防止）
fullyParallel: false

// ワーカー数を1に制限（リソース競合を回避）
workers: 1

// リトライ回数を増加
retries: process.env.CI ? 2 : 1

// タイムアウトを延長
timeout: 30000
expect: { timeout: 10000 }
use: {
  actionTimeout: 10000,
  navigationTimeout: 30000
}

// トレースとビデオを失敗時に保持
trace: 'retain-on-failure'
video: 'retain-on-failure'

// Webサーバーのタイムアウトを延長
webServer: {
  timeout: 120000
}
```

#### 効果

- テスト実行の安定性が向上
- タイムアウトエラーが減少
- デバッグ情報（トレース、ビデオ）が自動保存

### 2. Vitest設定の最適化

**ファイル**: `vitest.config.ts`

#### 変更内容

```typescript
// タイムアウトを設定
testTimeout: 10000
hookTimeout: 10000

// シングルフォークモードで実行
pool: 'forks'
poolOptions: {
  forks: {
    singleFork: true
  }
}
```

#### 効果

- ユニットテストの実行が安定化
- メモリリークのリスクが減少

### 3. E2Eテストコードの改善

**ファイル**: `e2e/conversion-flow.spec.ts`, `e2e/ui-interactions.spec.ts`

#### 変更内容

1. **明示的な待機処理**
   ```typescript
   // ページ読み込み完了を確認
   await page.goto('/', { waitUntil: 'networkidle' });
   await page.waitForLoadState('domcontentloaded');
   ```

2. **タイムアウト指定**
   ```typescript
   // 全てのexpectにタイムアウトを指定
   await expect(element).toBeVisible({ timeout: 10000 });
   ```

3. **状態変更後の待機**
   ```typescript
   // クリック後に少し待機
   await checkbox.click({ force: true });
   await page.waitForTimeout(300);
   ```

4. **柔軟なセレクタ**
   ```typescript
   // 複数パターンのテキストマッチング
   page.getByRole('button', { name: /パターン1|パターン2/i })
   ```

#### 効果

- セレクタが見つからないエラーが減少
- タイミング依存のエラーが減少
- テストの可読性が向上

### 4. テスト環境の整備

#### 新規ファイル

1. **`.env.test`** - テスト用環境変数
2. **`e2e/README.md`** - E2Eテストガイド
3. **`TEST_STABILITY.md`** - このドキュメント
4. **`.github/workflows/frontend-test.yml`** - CI/CDワークフロー

#### 効果

- テスト環境が統一化
- ドキュメントが充実
- CI/CDでの実行が安定化

## テスト実行方法

### ローカル環境

```bash
# ユニットテスト
cd frontend
pnpm test:run          # 1回実行
pnpm test              # ウォッチモード
pnpm test:coverage     # カバレッジ付き

# E2Eテスト
pnpm test:e2e          # 全ブラウザ
pnpm test:e2e:ui       # UIモード（推奨）
pnpm test:e2e:headed   # ブラウザ表示
pnpm test:e2e:debug    # デバッグモード
pnpm test:e2e:report   # レポート表示
```

### CI環境

```bash
# GitHub Actionsで自動実行
# - push/PR時に自動実行
# - Chromiumのみでテスト
# - 失敗時にレポートとトレースをアップロード
```

## トラブルシューティング

### 問題: テストがタイムアウトする

**原因**: ネットワークが遅い、要素の読み込みが遅い

**対策**:
1. タイムアウトを延長
   ```typescript
   await expect(element).toBeVisible({ timeout: 15000 });
   ```
2. 明示的な待機を追加
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

### 問題: セレクタが見つからない

**原因**: 要素がまだレンダリングされていない、セレクタが間違っている

**対策**:
1. UIモードで確認
   ```bash
   pnpm test:e2e:ui
   ```
2. より柔軟なセレクタを使用
   ```typescript
   page.getByRole('button', { name: /テキスト/i }).first()
   ```

### 問題: テストが不安定（時々失敗する）

**原因**: タイミング依存、並列実行の競合

**対策**:
1. 並列実行を無効化（既に実施済み）
2. リトライを有効化（既に実施済み）
3. 待機処理を追加
   ```typescript
   await page.waitForTimeout(500);
   ```

### 問題: CI環境でのみ失敗する

**原因**: 環境差異、リソース不足

**対策**:
1. CI専用の設定を使用
   ```typescript
   workers: process.env.CI ? 1 : undefined
   ```
2. タイムアウトを延長
3. トレースを確認
   ```bash
   # GitHub Actionsのアーティファクトからダウンロード
   pnpm exec playwright show-trace trace.zip
   ```

## ベストプラクティス

### 1. 明示的な待機を使用

❌ **悪い例**:
```typescript
await page.click('button');
expect(page.getByText('Success')).toBeVisible();
```

✅ **良い例**:
```typescript
await page.click('button');
await expect(page.getByText('Success')).toBeVisible({ timeout: 10000 });
```

### 2. 柔軟なセレクタを使用

❌ **悪い例**:
```typescript
page.getByText('画像ファイルをアップロード')
```

✅ **良い例**:
```typescript
page.getByRole('button', { name: /画像ファイルをアップロード|ファイルを選択/i })
```

### 3. テストの独立性を保つ

❌ **悪い例**:
```typescript
test('test1', async () => {
  // グローバル状態を変更
});

test('test2', async () => {
  // test1の状態に依存
});
```

✅ **良い例**:
```typescript
test.beforeEach(async ({ page }) => {
  // 各テストで初期状態にリセット
  await page.goto('/');
});

test('test1', async () => {
  // 独立したテスト
});

test('test2', async () => {
  // 独立したテスト
});
```

### 4. デバッグ情報を活用

```typescript
test('example', async ({ page }) => {
  // スクリーンショットを撮る
  await page.screenshot({ path: 'debug.png' });

  // コンソールログを確認
  page.on('console', msg => console.log(msg.text()));

  // ネットワークリクエストを確認
  page.on('request', request => console.log(request.url()));
});
```

## メトリクス

### 安定化前

- E2Eテスト成功率: ~60%
- タイムアウトエラー: 頻発
- セレクタエラー: 頻発

### 安定化後（目標）

- E2Eテスト成功率: >95%
- タイムアウトエラー: 稀
- セレクタエラー: 稀

## 今後の改善

- [ ] ビジュアルリグレッションテストの追加
- [ ] パフォーマンステストの追加
- [ ] アクセシビリティ自動テスト（axe-core）の統合
- [ ] テストカバレッジ80%達成
- [ ] CI実行時間の短縮（並列実行の最適化）

## 参考資料

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Vitest Configuration](https://vitest.dev/config/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)

## 更新履歴

- 2024-11-04: 初版作成、安定化対策実施
