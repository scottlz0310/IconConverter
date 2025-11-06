# リリースチェックリスト

新しいバージョンをリリースする前に、このチェックリストを確認してください。

## リリース前の準備

### バージョン管理

- [ ] `package.json` のバージョン番号を更新
- [ ] `CHANGELOG.md` を更新
  - [ ] 新機能を記載
  - [ ] バグ修正を記載
  - [ ] 破壊的変更を記載
  - [ ] リリース日を記載
- [ ] コミットメッセージ: `chore: bump version to x.x.x`

### コード品質

- [ ] すべてのテストが通過

  ```bash
  npm test
  cd frontend && npm test
  ```

- [ ] リンターエラーがない

  ```bash
  npm run lint
  cd frontend && npm run lint
  ```

- [ ] 型チェックが通過

  ```bash
  cd frontend && npm run type-check
  ```

### ドキュメント

- [ ] README.md が最新
- [ ] API ドキュメントが最新
- [ ] インストール手順が正確
- [ ] スクリーンショットが最新

### アイコンとリソース

- [ ] すべてのプラットフォーム用アイコンが準備済み
  - [ ] Windows: `build/icon.ico`
  - [ ] macOS: `build/icon.icns`
  - [ ] Linux: `build/icons/*.png`
- [ ] システムトレイアイコン: `assets/tray-icon.png`
- [ ] インストーラー画像（オプション）
  - [ ] `build/installerHeader.bmp`
  - [ ] `build/installerSidebar.bmp`

### ビルド設定

- [ ] `package.json` の `build` 設定を確認
- [ ] ファイル除外設定を確認
- [ ] Python依存関係が除外されている
- [ ] 不要なファイルが含まれていない

## ビルドプロセス

### 環境変数設定

**macOS公証（macOSビルド時）:**

```bash
export APPLE_ID="your-apple-id@example.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="your-team-id"
```

**Windowsコード署名（Windowsビルド時）:**

```bash
export WIN_CSC_LINK="/path/to/certificate.pfx"
export WIN_CSC_KEY_PASSWORD="certificate-password"
```

**GitHub Releases:**

```bash
export GH_TOKEN="your-github-token"
```

### ビルド実行

- [ ] フロントエンドをビルド

  ```bash
  npm run build:frontend
  ```

- [ ] ビルド検証を実行

  ```bash
  npm run verify:build
  ```

- [ ] プラットフォーム別にビルド

  ```bash
  # Windows（Windows上で実行）
  npm run build:win
  
  # macOS（macOS上で実行）
  npm run build:mac
  
  # Linux（Linux上で実行）
  npm run build:linux
  ```

- [ ] または、すべてのプラットフォーム（CI/CD推奨）

  ```bash
  npm run package:all
  ```

### ビルド検証

- [ ] 配布パッケージが生成された

  ```bash
  ls -lh dist-electron/
  ```

- [ ] パッケージサイズが200MB以下

  ```bash
  du -sh dist-electron/*
  ```

- [ ] チェックサムを生成

  ```bash
  cd dist-electron
  sha256sum * > SHA256SUMS.txt
  ```

## テスト

### Windows

- [ ] インストーラーでインストール
- [ ] ポータブル版を実行
- [ ] アプリが起動する
- [ ] 画像変換が動作する
- [ ] ファイル関連付けが動作する
- [ ] システムトレイが動作する
- [ ] 自動更新が動作する
- [ ] アンインストールが正常に完了

### macOS

- [ ] DMGをマウント
- [ ] Applicationsフォルダにコピー
- [ ] アプリが起動する（Gatekeeperチェック）
- [ ] 画像変換が動作する
- [ ] ファイル関連付けが動作する
- [ ] システムトレイが動作する
- [ ] 自動更新が動作する
- [ ] Intel Mac (x64) で動作確認
- [ ] Apple Silicon (arm64) で動作確認

### Linux

- [ ] AppImageを実行
- [ ] DEBをインストール（Ubuntu/Debian）
- [ ] RPMをインストール（Fedora/RHEL）
- [ ] アプリが起動する
- [ ] 画像変換が動作する
- [ ] ファイル関連付けが動作する
- [ ] システムトレイが動作する
- [ ] 自動更新が動作する

### 機能テスト

- [ ] PNG変換
- [ ] JPEG変換
- [ ] BMP変換
- [ ] GIF変換
- [ ] TIFF変換
- [ ] WebP変換
- [ ] 透明度保持
- [ ] 自動背景除去
- [ ] ドラッグ&ドロップ
- [ ] ファイルダイアログ
- [ ] プレビュー表示
- [ ] エラーハンドリング

### パフォーマンステスト

- [ ] 起動時間が3秒以内
- [ ] 5MB画像を5秒以内で変換
- [ ] メモリ使用量が200MB以下
- [ ] CPU使用量が5%未満（アイドル時）

## リリース

### Git操作

- [ ] すべての変更をコミット
- [ ] mainブランチにマージ
- [ ] タグを作成

  ```bash
  git tag -a v1.0.0 -m "Release version 1.0.0"
  git push origin v1.0.0
  ```

### GitHub Release

- [ ] GitHub Releasesページを開く
- [ ] 新しいリリースを作成
- [ ] タグを選択: `v1.0.0`
- [ ] リリースタイトル: `IconConverter v1.0.0`
- [ ] リリースノートを記載
  - [ ] 新機能
  - [ ] バグ修正
  - [ ] 既知の問題
  - [ ] インストール手順へのリンク
- [ ] 配布パッケージをアップロード
  - [ ] Windows: `IconConverter-Setup-{version}.exe`
  - [ ] Windows: `IconConverter-{version}-portable.exe`
  - [ ] macOS: `IconConverter-{version}-x64.dmg`
  - [ ] macOS: `IconConverter-{version}-arm64.dmg`
  - [ ] Linux: `IconConverter-{version}.AppImage`
  - [ ] Linux: `iconconverter_{version}_amd64.deb`
  - [ ] Linux: `iconconverter-{version}.x86_64.rpm`
  - [ ] チェックサム: `SHA256SUMS.txt`
- [ ] リリースを公開

### リリース後

- [ ] リリースノートを確認
- [ ] ダウンロードリンクが動作するか確認
- [ ] 自動更新が動作するか確認
- [ ] ソーシャルメディアで告知（オプション）
- [ ] ドキュメントサイトを更新（オプション）

## トラブルシューティング

### ビルドが失敗する

1. 依存関係を再インストール

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. キャッシュをクリア

   ```bash
   rm -rf dist-electron
   rm -rf frontend/dist
   ```

3. Node.jsバージョンを確認

   ```bash
   node --version  # v20以降が必要
   ```

### パッケージサイズが大きい

1. 不要なファイルを除外
2. `package.json` の `build.files` を確認
3. ASARアーカイブの内容を確認

   ```bash
   npx asar list dist-electron/.../app.asar
   ```

### コード署名が失敗する

**Windows:**

- 証明書ファイルのパスを確認
- パスワードを確認

**macOS:**

- Apple IDとパスワードを確認
- チームIDを確認
- 証明書が有効か確認

## 参考資料

- [electron-builder Documentation](https://www.electron.build/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Releases Guide](https://docs.github.com/en/repositories/releasing-projects-on-github)

---

**注意**: このチェックリストは、品質の高いリリースを保証するためのガイドラインです。プロジェクトの要件に応じて調整してください。
