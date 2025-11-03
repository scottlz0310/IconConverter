# E2Eテスト

Playwrightを使用したエンドツーエンドテストです。

## テストの実行

### すべてのテストを実行

```bash
pnpm test:e2e
```

### UIモードで実行

```bash
pnpm test:e2e:ui
```

### ヘッドモードで実行（ブラウザを表示）

```bash
pnpm test:e2e:headed
```

### デバッグモード

```bash
pnpm test:e2e:debug
```

### 特定のブラウザでテスト

```bash
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

## テストファイル

- `conversion-flow.spec.ts`: 完全な変換フローのテスト
- `ui-interactions.spec.ts`: UIインタラクションのテスト

## 前提条件

- フロントエンド開発サーバーが起動している（`pnpm dev`）
- バックエンドサーバーが起動している（完全な変換フローのテストの場合）

## テストフィクスチャ

テスト用の画像ファイルは `e2e/fixtures/` ディレクトリに自動生成されます。

## クロスブラウザテスト

以下のブラウザでテストが実行されます：

- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## CI/CD

CI環境では、すべてのブラウザでテストが実行され、失敗時にはスクリーンショットとトレースが保存されます。
