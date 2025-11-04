# E2Eテストガイド

## テストの安定化対策

このディレクトリのE2Eテストは、以下の安定化対策を実装しています。

### 1. Playwright設定の最適化

- **並列実行無効化**: `fullyParallel: false` - テスト間の競合を防止
- **ワーカー数制限**: `workers: 1` - リソース競合を回避
- **タイムアウト延長**:
  - テスト全体: 30秒
  - expect: 10秒
  - アクション: 10秒
  - ナビゲーション: 30秒
- **リトライ設定**: CI環境で2回、ローカルで1回
- **トレース/ビデオ保持**: 失敗時のデバッグ用

### 2. テストコードの改善

- **明示的な待機**: `waitForLoadState('networkidle')` でページ読み込み完了を確認
- **タイムアウト指定**: 全ての`expect`に`timeout: 10000`を指定
- **待機処理追加**: 状態変更後に`waitForTimeout`で安定化
- **柔軟なセレクタ**: 複数パターンのテキストマッチング
- **force click**: 必要に応じて`{ force: true }`オプション使用

### 3. テストフィクスチャ

- **自動生成**: テスト実行前に必要な画像ファイルを自動生成
- **Base64エンコード**: 最小限のPNG画像データを使用
- **ディレクトリ作成**: `fixtures/`ディレクトリを自動作成

## テスト実行方法

```bash
# 全ブラウザでテスト実行
pnpm test:e2e

# Chromiumのみ（CI用）
pnpm test:e2e:ci

# UIモード（推奨）
pnpm test:e2e:ui

# ヘッドモード（ブラウザ表示）
pnpm test:e2e:headed

# デバッグモード
pnpm test:e2e:debug

# 特定のテストファイルのみ
pnpm exec playwright test conversion-flow.spec.ts

# 特定のテストケースのみ
pnpm exec playwright test -g "ページが正しく読み込まれる"
```

## トラブルシューティング

### テストが失敗する場合

1. **開発サーバーが起動しているか確認**
   ```bash
   # 別ターミナルで
   cd frontend
   pnpm dev
   ```

2. **ブラウザをインストール**
   ```bash
   pnpm exec playwright install
   ```

3. **ヘッドモードで確認**
   ```bash
   pnpm test:e2e:headed
   ```

4. **トレースを確認**
   ```bash
   # テスト実行後
   pnpm exec playwright show-trace test-results/.../trace.zip
   ```

5. **スクリーンショットを確認**
   - `test-results/`ディレクトリ内のスクリーンショットを確認

### タイムアウトエラーが発生する場合

- ネットワークが遅い環境では、`playwright.config.ts`のタイムアウトを延長
- `waitForTimeout`の値を増やす（ただし最小限に）

### セレクタが見つからない場合

- UIモードでセレクタを確認: `pnpm test:e2e:ui`
- Playwright Inspectorを使用: `pnpm test:e2e:debug`

## ベストプラクティス

1. **明示的な待機を使用**
   - `page.waitForLoadState('networkidle')`
   - `page.waitForSelector()`
   - `expect().toBeVisible({ timeout: 10000 })`

2. **暗黙的な待機を避ける**
   - `page.waitForTimeout()`は最小限に
   - 代わりに状態ベースの待機を使用

3. **柔軟なセレクタ**
   - 正規表現を使用: `/テキスト/i`
   - 複数パターン: `/パターン1|パターン2/i`
   - `.first()`で最初の要素を取得

4. **テストの独立性**
   - 各テストは独立して実行可能
   - `beforeEach`で初期状態にリセット

5. **デバッグ情報**
   - スクリーンショット、トレース、ビデオを活用
   - `test.step()`でテストステップを明示

## CI/CD統合

GitHub Actionsでは以下の設定を使用:

```yaml
- name: Install Playwright
  run: pnpm exec playwright install --with-deps chromium

- name: Run E2E tests
  run: pnpm test:e2e:ci
  env:
    CI: true

- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: frontend/playwright-report/
```

## 参考資料

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)
