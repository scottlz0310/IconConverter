# セキュリティチェックリスト

このドキュメントは、Image to ICO Converter WebUIアプリケーションのセキュリティチェックリストです。

**最終更新**: 2025年11月3日

---

## 1. OWASP Top 10 (2021) チェックリスト

### A01:2021 - Broken Access Control（アクセス制御の不備）

- [x] 認証・認可が不要なパブリックツールとして設計
- [x] 一時ファイルは処理後に自動削除
- [x] ユーザー間でのファイル共有なし
- [x] ファイルパストラバーサル対策実装済み

**状態**: ✅ 対応済み

### A02:2021 - Cryptographic Failures（暗号化の失敗）

- [x] 機密データの保存なし
- [x] ユーザーデータの永続化なし
- [x] 画像ファイルは一時的に処理されるのみ

**状態**: ✅ 該当なし

### A03:2021 - Injection（インジェクション）

- [x] Pydanticによる厳格な入力バリデーション
- [x] ファイル形式の3層検証（MIME type + 拡張子 + Pillow検証）
- [x] SQLインジェクション: データベース未使用
- [x] コマンドインジェクション: 外部コマンド実行なし
- [x] パストラバーサル: tempfileモジュールによる安全なパス生成

**実装箇所**:
- `backend/services/validation.py`
- `backend/models.py`

**状態**: ✅ 対応済み

### A04:2021 - Insecure Design（安全でない設計）

- [x] クリーンアーキテクチャによる責務分離
- [x] サービス層でのビジネスロジック分離
- [x] エラーハンドリングの一元化
- [x] セキュリティを考慮した設計

**状態**: ✅ 対応済み

### A05:2021 - Security Misconfiguration（セキュリティ設定ミス）

- [x] CORS設定の適切な構成（環境変数で管理）
- [x] 開発環境と本番環境の分離
- [x] デバッグモードの適切な管理
- [x] セキュリティヘッダーの設定
- [x] 環境変数による設定の外部化
- [x] .env.exampleによるテンプレート提供
- [x] .gitignoreによる.envの除外

**実装箇所**:
- `backend/main.py`: CORS設定、セキュリティヘッダー
- `backend/.env.example`
- `frontend/.env.example`
- `frontend/nginx.conf`

**状態**: ✅ 対応済み

### A06:2021 - Vulnerable and Outdated Components（脆弱で古いコンポーネント）

- [x] 定期的な依存関係の更新
- [x] Safety/pnpm auditによる自動スキャン
- [x] Renovateによる自動更新PR
- [x] 最新の安定版パッケージ使用

**検証結果**:
- バックエンド: 脆弱性0件（Safety 3.6.2）
- フロントエンド: 脆弱性0件（pnpm audit）

**状態**: ✅ 対応済み

### A07:2021 - Identification and Authentication Failures（識別と認証の失敗）

- [x] 認証機能なし（パブリックツール）
- [x] ユーザーアカウントなし

**状態**: ✅ 該当なし

### A08:2021 - Software and Data Integrity Failures（ソフトウェアとデータの整合性の失敗）

- [x] ロックファイルによる依存関係の固定（uv.lock, pnpm-lock.yaml）
- [x] CI/CDでの自動テスト
- [x] バージョン管理による変更追跡

**状態**: ✅ 対応済み

### A09:2021 - Security Logging and Monitoring Failures（セキュリティログとモニタリングの失敗）

- [x] 構造化ログ（JSON形式）
- [x] リクエストIDによるトレーシング
- [x] エラーログの記録
- [x] ヘルスチェックエンドポイント
- [x] リクエスト/レスポンスのログ記録

**実装箇所**:
- `backend/main.py`: ロギングミドルウェア
- `backend/routers/health.py`: ヘルスチェック

**状態**: ✅ 対応済み

### A10:2021 - Server-Side Request Forgery (SSRF)（サーバーサイドリクエストフォージェリ）

- [x] 外部URLへのリクエストなし
- [x] ユーザー指定URLの処理なし

**状態**: ✅ 該当なし

---

## 2. ファイルアップロードセキュリティ

### ファイル形式検証

- [x] MIMEタイプチェック
  - 許可: `image/png`, `image/jpeg`, `image/bmp`, `image/gif`, `image/tiff`, `image/webp`
- [x] 拡張子チェック
  - 許可: `.png`, `.jpg`, `.jpeg`, `.bmp`, `.gif`, `.tiff`, `.tif`, `.webp`
- [x] Pillow実ファイル検証
  - `Image.open()` + `verify()` + `load()`

**実装箇所**: `backend/services/validation.py`

**状態**: ✅ 3層検証実装済み

### ファイルサイズ制限

- [x] バックエンド: 10MB制限（FastAPIの`File`パラメータ）
- [x] フロントエンド: クライアントサイドで事前チェック
- [x] 環境変数: `MAX_FILE_SIZE=10485760`

**実装箇所**:
- `backend/routers/convert.py`
- `frontend/src/components/FileUploader.tsx`

**状態**: ✅ 対応済み

### 一時ファイル管理

- [x] `tempfile`モジュールによる安全な一時ファイル作成
- [x] try-finallyによる確実な削除
- [x] ファイル名のサニタイズ
- [x] 処理完了後の自動削除

**実装箇所**: `backend/services/conversion.py`

**状態**: ✅ 対応済み

### パストラバーサル対策

- [x] ユーザー指定のファイルパスを使用しない
- [x] `tempfile`モジュールによる安全なパス生成
- [x] ファイル名のサニタイズ

**状態**: ✅ 対応済み

### レート制限

- [x] IPベースのレート制限: 10リクエスト/分
- [x] slowapiライブラリによる実装

**実装箇所**: `backend/routers/convert.py`

**状態**: ✅ 対応済み

---

## 3. セキュリティヘッダー

### バックエンド（FastAPI）

- [x] `X-Content-Type-Options: nosniff`
- [x] `X-Frame-Options: DENY`
- [x] `X-XSS-Protection: 1; mode=block`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `Content-Security-Policy`
- [x] `X-Request-ID`（リクエストトレーシング用）

**実装箇所**: `backend/main.py`

**状態**: ✅ 実装済み（2025-11-03）

### フロントエンド（Vite開発サーバー）

- [x] `X-Content-Type-Options: nosniff`
- [x] `X-Frame-Options: DENY`
- [x] `X-XSS-Protection: 1; mode=block`

**実装箇所**: `frontend/vite.config.ts`

**状態**: ✅ 実装済み（2025-11-03）

### フロントエンド（Nginx本番環境）

- [x] `X-Frame-Options: DENY`
- [x] `X-Content-Type-Options: nosniff`
- [x] `X-XSS-Protection: 1; mode=block`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `Permissions-Policy`
- [x] `Content-Security-Policy`

**実装箇所**: `frontend/nginx.conf`

**状態**: ✅ 実装済み（2025-11-03）

---

## 4. CORS設定

- [x] 環境変数による動的設定
- [x] 開発環境と本番環境の分離
- [x] 必要最小限のメソッドのみ許可（GET, POST）
- [x] 許可オリジンの明示的な指定

**実装箇所**: `backend/main.py`

**設定例**:
```python
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**状態**: ✅ 対応済み

---

## 5. エラーハンドリング

- [x] カスタム例外クラスによる分類
- [x] 適切なHTTPステータスコード
- [x] ユーザーフレンドリーなエラーメッセージ
- [x] 詳細なエラー情報の非公開（本番環境）
- [x] エラーログの記録

**実装箇所**:
- `backend/exceptions.py`: カスタム例外
- `backend/main.py`: 例外ハンドラー

**状態**: ✅ 対応済み

---

## 6. 環境変数管理

- [x] `.env.example`によるテンプレート提供
- [x] `.gitignore`による`.env`の除外
- [x] 環境変数による設定の外部化
- [x] 機密情報のハードコード禁止

**ファイル**:
- `backend/.env.example`
- `frontend/.env.example`

**状態**: ✅ 対応済み

---

## 7. 依存関係の脆弱性管理

### バックエンド

- [x] Safety 3.6.2によるスキャン
- [x] 脆弱性: 0件
- [x] 定期的なスキャン実施

**コマンド**:
```bash
cd backend
uv run safety check --json
```

**状態**: ✅ 脆弱性なし

### フロントエンド

- [x] pnpm auditによるスキャン
- [x] 脆弱性: 0件
- [x] 定期的なスキャン実施

**コマンド**:
```bash
cd frontend
pnpm audit --json
```

**状態**: ✅ 脆弱性なし

---

## 8. ビルドとデプロイメント

### ソースマップ

- [x] 本番ビルドでソースマップを無効化

**実装箇所**: `frontend/vite.config.ts`

**状態**: ✅ 実装済み（2025-11-03）

### Docker

- [x] マルチステージビルドによる最小イメージ
- [x] 非rootユーザーでの実行（推奨）
- [x] 不要なファイルの除外（.dockerignore）

**状態**: ✅ 対応済み

---

## 9. 今後の改善項目

### 短期（1-3ヶ月）

- [ ] HTTPS強制（本番環境）
  - Strict-Transport-Security（HSTS）ヘッダーの追加
  - HTTPからHTTPSへの自動リダイレクト
- [ ] レート制限の細かい調整
  - エンドポイントごとの制限設定
  - バーストトラフィックへの対応

### 中期（3-6ヶ月）

- [ ] モニタリングの強化
  - セキュリティイベントの監視
  - 異常なアクセスパターンの検出
- [ ] 自動化の強化
  - CI/CDでのセキュリティスキャン自動化
  - 定期的な依存関係更新の自動化

### 長期（6-12ヶ月）

- [ ] ペネトレーションテスト
  - 外部セキュリティ専門家によるテスト
- [ ] セキュリティ監査の定期化
  - 四半期ごとの監査実施
- [ ] セキュリティ認証の取得（必要に応じて）

---

## 10. 定期チェック項目

### 毎週

- [ ] 依存関係の脆弱性スキャン
- [ ] ログの確認（異常なアクセスパターン）

### 毎月

- [ ] セキュリティヘッダーの確認
- [ ] CORS設定の確認
- [ ] エラーログの分析

### 四半期

- [ ] セキュリティ監査の実施
- [ ] OWASP Top 10の再確認
- [ ] セキュリティドキュメントの更新

---

## 参考資料

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [React Security Best Practices](https://react.dev/learn/security)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Content Security Policy Reference](https://content-security-policy.com/)
