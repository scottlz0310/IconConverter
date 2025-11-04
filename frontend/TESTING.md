# フロントエンドテストガイド

このドキュメントでは、フロントエンドのテスト戦略と実装について説明します。

## テスト構成

### 1. ユニット・コンポーネントテスト（Vitest + React Testing Library）

**場所**: `src/components/__tests__/`, `src/services/__tests__/`

**テストフレームワーク**:
- Vitest - 高速なテストランナー
- React Testing Library - Reactコンポーネントのテスト
- @testing-library/user-event - ユーザーインタラクションのシミュレーション
- @testing-library/jest-dom - カスタムマッチャー

**テスト対象**:
- `FileUploader.test.tsx` - ファイルアップロード機能（要件2.1, 2.2, 2.3, 2.5）
- `ConversionOptions.test.tsx` - 変換オプション（要件3.1, 3.2, 3.3, 3.4, 3.5）
- `ImagePreview.test.tsx` - 画像プレビュー（要件2.4）
- `ConvertButton.test.tsx` - 変換ボタン（要件4.1, 4.2）
- `api.test.ts` - APIクライアント

**実行方法**:
```bash
# すべてのテストを実行
pnpm test:run

# ウォッチモード
pnpm test

# カバレッジレポート
pnpm test:coverage
```

### 2. E2Eテスト（Playwright）

**場所**: `e2e/`

**テストフレームワーク**:
- Playwright - クロスブラウザE2Eテスト

**テスト対象**:
- `conversion-flow.spec.ts` - 完全な変換フロー（要件2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 6.2）
- `ui-interactions.spec.ts` - UIインタラクション

**クロスブラウザテスト**:
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

**実行方法**:
```bash
# すべてのE2Eテストを実行
pnpm test:e2e

# UIモードで実行
pnpm test:e2e:ui

# ヘッドモードで実行（ブラウザを表示）
pnpm test:e2e:headed

# デバッグモード
pnpm test:e2e:debug

# 特定のブラウザでテスト
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

## テストカバレッジ

### 要件カバレッジ

| 要件 | テストタイプ | テストファイル |
|------|------------|--------------|
| 2.1 ドラッグ&ドロップ | コンポーネント, E2E | FileUploader.test.tsx, conversion-flow.spec.ts |
| 2.2 ファイル選択ボタン | コンポーネント, E2E | FileUploader.test.tsx, conversion-flow.spec.ts |
| 2.3 対応形式 | コンポーネント, E2E | FileUploader.test.tsx, conversion-flow.spec.ts |
| 2.4 画像プレビュー | コンポーネント, E2E | ImagePreview.test.tsx, conversion-flow.spec.ts |
| 2.5 ファイルサイズ制限 | コンポーネント | FileUploader.test.tsx |
| 3.1 透明化保持 | コンポーネント, E2E | ConversionOptions.test.tsx, conversion-flow.spec.ts |
| 3.2 自動背景透明化 | コンポーネント, E2E | ConversionOptions.test.tsx, conversion-flow.spec.ts |
| 3.3 相互排他（透明化保持） | コンポーネント | ConversionOptions.test.tsx |
| 3.4 相互排他（自動背景） | コンポーネント | ConversionOptions.test.tsx |
| 3.5 デフォルト値 | コンポーネント | ConversionOptions.test.tsx |
| 4.1 変換ボタン | コンポーネント, E2E | ConvertButton.test.tsx, conversion-flow.spec.ts |
| 4.2 変換処理 | コンポーネント, E2E | ConvertButton.test.tsx, conversion-flow.spec.ts |
| 6.1 レスポンシブデザイン | E2E | conversion-flow.spec.ts |
| 6.2 クロスブラウザ | E2E | conversion-flow.spec.ts |
| 6.3 アクセシビリティ | コンポーネント, E2E | 全テスト, conversion-flow.spec.ts |
| 6.4 キーボードナビゲーション | コンポーネント, E2E | 全テスト, conversion-flow.spec.ts |
| 6.5 ダークモード | E2E | conversion-flow.spec.ts |

## テスト戦略

### コンポーネントテスト

**目的**: 個々のコンポーネントの機能とロジックを検証

**アプローチ**:
- ユーザーの視点からテスト（実装の詳細ではなく、動作をテスト）
- アクセシビリティを重視（ARIAラベル、キーボード操作）
- Zustandストアをモック
- 外部依存（toast, API）をモック

**ベストプラクティス**:
- `screen.getByRole()` を優先的に使用
- `waitFor()` で非同期処理を待機
- ユーザーイベントは `userEvent` を使用

### E2Eテスト

**目的**: アプリケーション全体の統合とユーザーフローを検証

**アプローチ**:
- 実際のユーザーシナリオをテスト
- クロスブラウザ互換性を検証
- レスポンシブデザインを検証
- アクセシビリティを検証

**ベストプラクティス**:
- ページオブジェクトパターンの使用を検討
- テストデータは自動生成
- スクリーンショットとトレースを活用

## CI/CD統合

### GitHub Actions

```yaml
- name: Run unit tests
  run: pnpm test:run

- name: Run E2E tests
  run: pnpm test:e2e
```

### テスト結果

- ユニットテスト: カバレッジレポートを生成
- E2Eテスト: 失敗時にスクリーンショットとトレースを保存

## トラブルシューティング

### Vitestテストが失敗する

1. `pnpm install` で依存関係を再インストール
2. `node_modules/.vite` を削除してキャッシュをクリア
3. モックが正しく設定されているか確認

### Playwrightテストが失敗する

1. ブラウザをインストール: `pnpm exec playwright install`
2. 開発サーバーが起動しているか確認
3. `pnpm test:e2e:headed` でブラウザを表示して確認
4. `pnpm test:e2e:debug` でデバッグモードで実行
5. トレースを確認: `pnpm test:e2e:report`

詳細なトラブルシューティングは [TEST_STABILITY.md](../TEST_STABILITY.md) を参照してください。

## テスト安定化対策

以下の対策により、テストの安定性が向上しています:

- 並列実行の無効化
- タイムアウトの延長
- 明示的な待機処理
- 柔軟なセレクタ
- リトライ機能

詳細は [TEST_STABILITY.md](../TEST_STABILITY.md) を参照してください。

## 今後の改善

- [ ] カバレッジ目標: 80%以上
- [ ] ビジュアルリグレッションテストの追加
- [ ] パフォーマンステストの追加
- [ ] アクセシビリティ自動テスト（axe-core）の統合
- [ ] E2Eテスト成功率95%以上を維持
