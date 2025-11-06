# Electronアプリケーションテストガイド

## 概要

このディレクトリには、IconConverter Electronアプリケーションの包括的なテストスイートが含まれています。

## テストの種類

### 1. ユニットテスト（Jest）

**場所**: `tests/unit/`, `electron/**/__tests__/`

**実行方法**:

```bash
npm run test:unit
```

**対象**:

- 画像変換ロジック
- ファイルバリデーション
- IPC通信ハンドラー
- ユーティリティ関数

**要件カバレッジ**:

- 要件1.1-1.5: 画像変換機能
- 要件6.4-6.5: セキュリティ検証
- 要件9.3, 9.5: 処理精度

### 2. E2Eテスト（Playwright）

**場所**: `tests/e2e/`

**実行方法**:

```bash
# すべてのE2Eテスト
npm run test:e2e

# UIモード
npm run test:e2e:ui

# ヘッドモード（ブラウザ表示）
npm run test:e2e:headed

# デバッグモード
npm run test:e2e:debug
```

**対象**:

- アプリケーション起動
- ファイル操作
- UI操作
- ウィンドウ管理

**要件カバレッジ**:

- 要件2.3-2.4: ファイルシステム統合
- 要件4.1: 起動時間
- 要件7.1: UI一貫性

### 3. アクセシビリティテスト

**場所**: `tests/e2e/*.accessibility.spec.js`

**実行方法**:

```bash
npm run test:accessibility
```

**対象**:

- WCAG 2.1 AA準拠
- キーボードナビゲーション
- スクリーンリーダー対応
- 色のコントラスト
- ARIAロール

**要件カバレッジ**:

- 要件7.3: WCAG 2.1 AA準拠
- 要件7.4: キーボードナビゲーション

### 4. パフォーマンステスト

**場所**: `tests/performance/`

**実行方法**:

```bash
npm run test:performance
```

**測定項目**:

- 起動時間（目標: 3秒以内）
- 変換処理時間（目標: 5MB画像を5秒以内）
- メモリ使用量（目標: 200MB以下）
- CPU使用率（目標: 5%未満）

**要件カバレッジ**:

- 要件4.1: 起動時間
- 要件4.2: 変換処理時間
- 要件4.3: メモリ使用量
- 要件4.4: CPU使用率

## テスト実行

### すべてのテストを実行

```bash
npm test
```

### 個別のテストスイートを実行

```bash
# ユニットテストのみ
npm run test:unit

# E2Eテストのみ
npm run test:e2e

# アクセシビリティテストのみ
npm run test:accessibility

# パフォーマンステストのみ
npm run test:performance
```

### カバレッジレポート

```bash
npm run test:unit -- --coverage
```

カバレッジレポートは `coverage/electron/` に生成されます。

## テスト結果

### 成功基準

すべてのテストが以下の基準を満たす必要があります:

#### 機能テスト

- ✓ すべてのユニットテストが合格
- ✓ すべてのE2Eテストが合格
- ✓ コードカバレッジ70%以上

#### アクセシビリティテスト

- ✓ WCAG 2.1 AA違反0件
- ✓ キーボードナビゲーション動作確認
- ✓ スクリーンリーダー対応確認

#### パフォーマンステスト

- ✓ 起動時間 < 3秒
- ✓ 変換時間 < 5秒（5MB画像）
- ✓ メモリ使用量 < 200MB
- ✓ CPU使用率 < 5%

## CI/CD統合

GitHub Actionsでの自動テスト実行:

```yaml
- name: Run tests
  run: |
    npm run test:unit
    npm run test:e2e
    npm run test:accessibility
    npm run test:performance
```

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

`playwright.config.js` または `jest.config.js` のタイムアウト設定を調整してください。

## テストの追加

### 新しいユニットテストを追加

1. `tests/unit/` または `electron/**/__tests__/` に `.test.js` ファイルを作成
2. Jestのテスト構文を使用
3. `npm run test:unit` で実行

### 新しいE2Eテストを追加

1. `tests/e2e/` に `.spec.js` ファイルを作成
2. Playwrightのテスト構文を使用
3. `npm run test:e2e` で実行

### 新しいアクセシビリティテストを追加

1. `tests/e2e/` に `.accessibility.spec.js` ファイルを作成
2. `axe-playwright` を使用
3. `@accessibility` タグを追加
4. `npm run test:accessibility` で実行

## ベストプラクティス

1. **テストの独立性**: 各テストは他のテストに依存しない
2. **クリーンアップ**: `afterEach` でリソースをクリーンアップ
3. **明確なアサーション**: 何をテストしているか明確に
4. **適切なタイムアウト**: 必要に応じてタイムアウトを調整
5. **モックの使用**: 外部依存を適切にモック化

## 参考資料

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
