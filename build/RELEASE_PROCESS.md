# リリースプロセスガイド

このドキュメントでは、IconConverter Electronアプリケーションのリリースプロセスについて説明します。

## 概要

リリースプロセスは完全に自動化されており、Gitタグをプッシュするだけで以下の処理が自動的に実行されます:

1. マルチプラットフォームビルド（Windows, macOS, Linux）
2. マルチアーキテクチャビルド（x64, arm64）
3. コード署名（Windows, macOS）
4. リリースノート自動生成
5. GitHub Releasesへの公開

## 前提条件

### 必要なシークレット

GitHub Actionsで以下のシークレットを設定する必要があります:

#### Windows コード署名

- `WIN_CSC_LINK`: Windows証明書（Base64エンコード済み.p12ファイル）
- `WIN_CSC_KEY_PASSWORD`: 証明書のパスワード

#### macOS コード署名・公証

- `CSC_LINK`: macOS証明書（Base64エンコード済み.p12ファイル）
- `CSC_KEY_PASSWORD`: 証明書のパスワード
- `APPLE_ID`: Apple ID（公証用）
- `APPLE_ID_PASSWORD`: App固有パスワード（公証用）
- `APPLE_TEAM_ID`: Apple Developer Team ID

#### GitHub

- `GITHUB_TOKEN`: 自動的に提供される（設定不要）

### 証明書の準備

#### Windows証明書のBase64エンコード

```bash
# Windows証明書をBase64エンコード
base64 -i certificate.p12 -o certificate.p12.base64

# または
cat certificate.p12 | base64 > certificate.p12.base64
```

#### macOS証明書のBase64エンコード

```bash
# macOS証明書をBase64エンコード
base64 -i certificate.p12 -o certificate.p12.base64
```

## リリース手順

### 1. バージョン番号の決定

セマンティックバージョニングに従ってバージョン番号を決定します:

- **メジャーバージョン** (x.0.0): 互換性のない変更
- **マイナーバージョン** (0.x.0): 後方互換性のある機能追加
- **パッチバージョン** (0.0.x): 後方互換性のあるバグ修正

例: `1.2.3`

### 2. CHANGELOGの更新

`CHANGELOG.md`に新しいバージョンのセクションを追加します:

```markdown
## [1.2.3] - 2024-01-15

### 追加
- 新機能の説明

### 変更
- 変更内容の説明

### 修正
- バグ修正の説明

### 削除
- 削除された機能の説明
```

### 3. package.jsonのバージョン更新

```bash
# バージョンを更新
npm version 1.2.3 --no-git-tag-version

# または手動で package.json を編集
```

### 4. 変更のコミット

```bash
git add CHANGELOG.md package.json
git commit -m "chore: bump version to 1.2.3"
git push origin main
```

### 5. Gitタグの作成とプッシュ

```bash
# タグを作成
git tag v1.2.3

# タグをプッシュ（これによりリリースプロセスが自動開始）
git push origin v1.2.3
```

### 6. ビルドの監視

GitHub Actionsのワークフローを監視します:

1. GitHubリポジトリの「Actions」タブを開く
2. 「Build and Sign」ワークフローを確認
3. 各ジョブの進行状況を確認:
   - `build-windows`: Windows x64ビルド
   - `build-macos`: macOS x64/arm64ビルド
   - `build-linux`: Linux x64/arm64ビルド
   - `create-release`: GitHub Releasesの作成

### 7. リリースの確認

ビルドが完了したら、GitHub Releasesページで以下を確認します:

1. リリースノートが正しく生成されているか
2. すべてのプラットフォーム・アーキテクチャのビルドが添付されているか:
   - Windows: `.exe` (インストーラー、ポータブル)
   - macOS: `.dmg`, `.zip` (x64, arm64)
   - Linux: `.AppImage`, `.deb`, `.rpm` (x64, arm64)
3. コード署名が正しく適用されているか

## トラブルシューティング

### ビルドが失敗した場合

#### Windows ビルド失敗

- 証明書の有効期限を確認
- `WIN_CSC_LINK`と`WIN_CSC_KEY_PASSWORD`が正しく設定されているか確認
- ビルドログでエラーメッセージを確認

#### macOS ビルド失敗

- 証明書の有効期限を確認
- Apple IDとApp固有パスワードが正しいか確認
- 公証プロセスのログを確認

#### Linux ビルド失敗

- 依存関係のインストールエラーを確認
- QEMUのセットアップ（arm64ビルド時）を確認

### リリースノート生成の問題

リリースノートが正しく生成されない場合:

1. `CHANGELOG.md`のフォーマットを確認
2. バージョン番号のセクションが存在するか確認
3. ローカルでスクリプトをテスト:

   ```bash
   node build/generate-release-notes.js 1.2.3
   cat release-notes.md
   ```

### 手動でのリリース作成

自動リリースが失敗した場合、手動で作成できます:

1. GitHub Releasesページで「Draft a new release」をクリック
2. タグを選択（または新規作成）
3. リリースノートを手動で作成:

   ```bash
   node build/generate-release-notes.js 1.2.3
   ```

4. ビルドアーティファクトを手動でダウンロードしてアップロード

## テストリリース

本番リリース前にテストリリースを作成する場合:

### プレリリースの作成

```bash
# プレリリースタグを作成
git tag v1.2.3-beta.1
git push origin v1.2.3-beta.1
```

### 署名なしビルドのテスト

GitHub Actionsの「Build and Sign」ワークフローを手動実行:

1. Actionsタブを開く
2. 「Build and Sign」を選択
3. 「Run workflow」をクリック
4. 「Skip code signing」にチェックを入れる
5. 「Run workflow」を実行

## リリース後の作業

### 1. リリースの告知

- プロジェクトのREADMEを更新
- ユーザーに新バージョンを通知
- ソーシャルメディアで共有

### 2. 問題の監視

- GitHub Issuesで報告される問題を監視
- ユーザーフィードバックを収集
- 必要に応じてホットフィックスをリリース

### 3. 次のバージョンの計画

- 新機能の計画
- バグ修正の優先順位付け
- ロードマップの更新

## 自動更新機能

リリース後、既存ユーザーには自動更新機能により新バージョンが通知されます:

1. アプリケーション起動時に更新をチェック
2. 新バージョンが利用可能な場合、ユーザーに通知
3. ユーザーが承認すると、バックグラウンドでダウンロード
4. ダウンロード完了後、再起動を促す

## ベストプラクティス

### バージョン管理

- セマンティックバージョニングを厳守
- 各リリースに明確な変更履歴を記載
- プレリリースを活用してテストを実施

### セキュリティ

- 証明書を安全に管理
- シークレットを定期的にローテーション
- コード署名を必ず実施

### 品質保証

- リリース前に全プラットフォームでテスト
- パフォーマンステストを実施
- セキュリティスキャンを実行

### コミュニケーション

- リリースノートを詳細に記載
- 既知の問題を明記
- アップグレードパスを提供

## 参考資料

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [electron-builder Documentation](https://www.electron.build/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Code Signing Guide](https://www.electron.build/code-signing)

## サポート

問題が発生した場合:

1. [GitHub Issues](https://github.com/iconconverter/iconconverter/issues)で検索
2. 新しいIssueを作成
3. ビルドログを添付
4. 環境情報を提供

---

最終更新: 2024年11月
