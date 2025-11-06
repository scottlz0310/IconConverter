# プラットフォーム別テストガイド

## 概要

このドキュメントは、IconConverter Electronアプリケーションを各プラットフォームでテストするための詳細な手順を提供します。

**タスク14.1**: 全機能テスト - 全プラットフォームでの動作確認

**要件**: 5.1, 5.2, 5.3

---

## Windows 10/11 テストガイド（要件5.1）

### 前提条件

- Windows 10 (x64) または Windows 11 (x64)
- 管理者権限
- インターネット接続（初回のみ）

### テスト環境のセットアップ

1. **開発環境でのテスト**

   ```powershell
   # リポジトリをクローン
   git clone https://github.com/your-org/iconconverter.git
   cd iconconverter

   # 依存関係をインストール
   npm install

   # アプリケーションをビルド
   npm run build

   # Electronアプリを起動
   npm run electron:dev
   ```

2. **配布パッケージのテスト**

   ```powershell
   # インストーラーをビルド
   npm run electron:build

   # dist-electron/win-unpacked/ にビルド結果が生成される
   # または dist-electron/*.exe にインストーラーが生成される
   ```

### テスト項目

#### 1. インストールテスト

- [ ] NSISインストーラーを実行
- [ ] インストール先を選択
- [ ] デスクトップショートカットが作成される
- [ ] スタートメニューに登録される
- [ ] アプリケーションが正常に起動する

#### 2. ファイル関連付けテスト

- [ ] PNG/JPEG/BMP/GIF/TIFF/WebPファイルを右クリック
- [ ] 「ICOに変換」メニューが表示される
- [ ] メニューをクリックしてアプリが起動する
- [ ] ファイルが自動的に読み込まれる

#### 3. システムトレイテスト

- [ ] アプリケーションを起動
- [ ] システムトレイにアイコンが表示される
- [ ] トレイアイコンを右クリックしてメニューを表示
- [ ] 「IconConverterを表示」で復元
- [ ] 「終了」でアプリを終了

#### 4. ドラッグ&ドロップテスト

- [ ] エクスプローラーから画像ファイルをドラッグ
- [ ] アプリウィンドウにドロップ
- [ ] ファイルが正常に読み込まれる

#### 5. 自動更新テスト

- [ ] 「ヘルプ」→「更新を確認」
- [ ] 更新が利用可能な場合、通知が表示される
- [ ] 更新をダウンロード
- [ ] 更新をインストールして再起動

#### 6. アンインストールテスト

- [ ] コントロールパネル→プログラムと機能
- [ ] IconConverterを選択してアンインストール
- [ ] アプリケーションが完全に削除される
- [ ] 設定ファイルが削除される（オプション）

### Windows固有の問題

#### コード署名

```powershell
# 署名の確認
Get-AuthenticodeSignature "dist-electron/IconConverter Setup.exe"
```

#### レジストリ確認

```powershell
# ファイル関連付けの確認
reg query "HKCU\Software\Classes\.png\shell\ConvertToICO"
```

---

## macOS 12以降 テストガイド（要件5.2）

### 前提条件

- macOS 12 Monterey以降
- Xcode Command Line Tools
- Apple Developer証明書（配布パッケージのテスト用）

### テスト環境のセットアップ

1. **開発環境でのテスト**

   ```bash
   # リポジトリをクローン
   git clone https://github.com/your-org/iconconverter.git
   cd iconconverter

   # 依存関係をインストール
   npm install

   # アプリケーションをビルド
   npm run build

   # Electronアプリを起動
   npm run electron:dev
   ```

2. **配布パッケージのテスト**

   ```bash
   # インストーラーをビルド
   npm run electron:build

   # dist-electron/mac/ にビルド結果が生成される
   # または dist-electron/*.dmg にDMGが生成される
   ```

### テスト項目

#### 1. インストールテスト

- [ ] DMGファイルをマウント
- [ ] アプリケーションをApplicationsフォルダにドラッグ
- [ ] Launchpadからアプリを起動
- [ ] Gatekeeperの警告が表示されない（署名済みの場合）

#### 2. ファイル関連付けテスト

- [ ] PNG/JPEG/BMP/GIF/TIFF/WebPファイルを右クリック
- [ ] 「このアプリケーションで開く」→「IconConverter」
- [ ] ファイルが正常に開かれる
- [ ] デフォルトアプリとして設定可能

#### 3. システムトレイ（メニューバー）テスト

- [ ] アプリケーションを起動
- [ ] メニューバーにアイコンが表示される
- [ ] アイコンをクリックしてメニューを表示
- [ ] 「IconConverterを表示」で復元
- [ ] 「終了」でアプリを終了

#### 4. ドラッグ&ドロップテスト

- [ ] Finderから画像ファイルをドラッグ
- [ ] アプリウィンドウにドロップ
- [ ] ファイルが正常に読み込まれる
- [ ] Dockアイコンにドロップしても動作する

#### 5. 自動更新テスト

- [ ] 「IconConverter」→「更新を確認」
- [ ] 更新が利用可能な場合、通知が表示される
- [ ] 更新をダウンロード
- [ ] 更新をインストールして再起動

#### 6. アンインストールテスト

- [ ] Applicationsフォルダから削除
- [ ] ~/Library/Application Support/IconConverter を削除
- [ ] ~/Library/Preferences/com.iconconverter.app.plist を削除

### macOS固有の問題

#### コード署名と公証の確認

```bash
# 署名の確認
codesign -dv --verbose=4 "dist-electron/mac/IconConverter.app"

# 公証の確認
spctl -a -vv "dist-electron/mac/IconConverter.app"

# Gatekeeperの確認
xattr -d com.apple.quarantine "dist-electron/mac/IconConverter.app"
```

#### アーキテクチャ確認

```bash
# ユニバーサルバイナリの確認
lipo -info "dist-electron/mac/IconConverter.app/Contents/MacOS/IconConverter"

# 期待される出力: "Architectures in the fat file: x86_64 arm64"
```

---

## Ubuntu 20.04以降 テストガイド（要件5.3）

### 前提条件

- Ubuntu 20.04 LTS以降
- X11またはWayland
- 必要なシステムライブラリ

### テスト環境のセットアップ

1. **システムライブラリのインストール**

   ```bash
   sudo apt update
   sudo apt install -y \
     libgtk-3-0 \
     libnotify4 \
     libnss3 \
     libxss1 \
     libxtst6 \
     xdg-utils \
     libatspi2.0-0 \
     libdrm2 \
     libgbm1 \
     libxcb-dri3-0
   ```

2. **開発環境でのテスト**

   ```bash
   # リポジトリをクローン
   git clone https://github.com/your-org/iconconverter.git
   cd iconconverter

   # 依存関係をインストール
   npm install

   # アプリケーションをビルド
   npm run build

   # Electronアプリを起動
   npm run electron:dev
   ```

3. **配布パッケージのテスト**

   ```bash
   # インストーラーをビルド
   npm run electron:build

   # dist-electron/ にビルド結果が生成される
   ```

### テスト項目

#### 1. AppImageテスト

- [ ] AppImageファイルに実行権限を付与

  ```bash
  chmod +x IconConverter-*.AppImage
  ```

- [ ] AppImageを実行

  ```bash
  ./IconConverter-*.AppImage
  ```

- [ ] アプリケーションが正常に起動する

#### 2. DEBパッケージテスト

- [ ] DEBパッケージをインストール

  ```bash
  sudo dpkg -i iconconverter_*.deb
  sudo apt-get install -f  # 依存関係を解決
  ```

- [ ] アプリケーションメニューから起動
- [ ] コマンドラインから起動

  ```bash
  iconconverter
  ```

#### 3. RPMパッケージテスト（Fedora/CentOS）

- [ ] RPMパッケージをインストール

  ```bash
  sudo rpm -i iconconverter-*.rpm
  ```

- [ ] アプリケーションメニューから起動

#### 4. ファイル関連付けテスト

- [ ] .desktopファイルが作成される

  ```bash
  cat ~/.local/share/applications/iconconverter.desktop
  ```

- [ ] PNG/JPEG/BMP/GIF/TIFF/WebPファイルを右クリック
- [ ] 「プログラムから開く」→「IconConverter」
- [ ] ファイルが正常に開かれる

#### 5. システムトレイテスト

- [ ] アプリケーションを起動
- [ ] システムトレイにアイコンが表示される
- [ ] トレイアイコンを右クリックしてメニューを表示
- [ ] 「IconConverterを表示」で復元
- [ ] 「終了」でアプリを終了

#### 6. アンインストールテスト

**AppImage**:

```bash
rm IconConverter-*.AppImage
rm -rf ~/.config/IconConverter
```

**DEB**:

```bash
sudo apt remove iconconverter
```

**RPM**:

```bash
sudo rpm -e iconconverter
```

### Linux固有の問題

#### Waylandでの動作確認

```bash
# Waylandセッションで起動
XDG_SESSION_TYPE=wayland ./IconConverter-*.AppImage
```

#### X11での動作確認

```bash
# X11セッションで起動
XDG_SESSION_TYPE=x11 ./IconConverter-*.AppImage
```

#### デスクトップ統合の確認

```bash
# .desktopファイルの確認
desktop-file-validate ~/.local/share/applications/iconconverter.desktop

# MIMEタイプの確認
xdg-mime query default image/png
```

---

## クロスプラットフォーム共通テスト

### 1. オフライン動作テスト

すべてのプラットフォームで:

1. インターネット接続を無効化
2. アプリケーションを起動
3. 画像を変換
4. 設定を変更
5. すべての機能が正常に動作することを確認

### 2. パフォーマンステスト

すべてのプラットフォームで:

```bash
# パフォーマンステストを実行
npm run test:performance
```

期待される結果:

- 起動時間: 3秒以内
- 5MB画像の変換: 5秒以内
- メモリ使用量: 200MB以下
- CPU使用率: 5%未満（アイドル時）

### 3. セキュリティテスト

すべてのプラットフォームで:

- [ ] Node.js統合が無効
- [ ] コンテキスト分離が有効
- [ ] リモートモジュールが無効
- [ ] CSPが適切に設定されている

### 4. アクセシビリティテスト

すべてのプラットフォームで:

```bash
# アクセシビリティテストを実行
npm run test:accessibility
```

期待される結果:

- WCAG 2.1 AA違反: 0件
- キーボードナビゲーション: 動作
- スクリーンリーダー: 対応

---

## テスト結果の記録

### テンプレート

```markdown
## テスト実行記録

**日付**: YYYY-MM-DD
**テスター**: [名前]
**バージョン**: [バージョン番号]

### プラットフォーム

- [ ] Windows 10 (x64)
- [ ] Windows 11 (x64)
- [ ] macOS 12 (x64)
- [ ] macOS 12 (arm64)
- [ ] Ubuntu 20.04 (x64)

### テスト結果

| テスト項目 | 結果 | 備考 |
|-----------|------|------|
| インストール | ✓/✗ | |
| ファイル関連付け | ✓/✗ | |
| システムトレイ | ✓/✗ | |
| ドラッグ&ドロップ | ✓/✗ | |
| 自動更新 | ✓/✗ | |
| アンインストール | ✓/✗ | |
| オフライン動作 | ✓/✗ | |
| パフォーマンス | ✓/✗ | |
| セキュリティ | ✓/✗ | |
| アクセシビリティ | ✓/✗ | |

### 発見された問題

1. [問題の説明]
   - 再現手順:
   - 期待される動作:
   - 実際の動作:
   - 優先度: 高/中/低

### 総合評価

- 成功: _____ / _____
- 失敗: _____ / _____
- リリース可否: ✓/✗

### 備考

[追加のコメントや特記事項]
```

---

## トラブルシューティング

### Windows

**問題**: アプリが起動しない

- 解決策: Visual C++ Redistributableをインストール

**問題**: ファイル関連付けが機能しない

- 解決策: 管理者権限で実行

### macOS

**問題**: "開発元を確認できません"エラー

- 解決策: システム環境設定→セキュリティとプライバシー→「このまま開く」

**問題**: アプリが起動しない

- 解決策: `xattr -cr /Applications/IconConverter.app`

### Linux

**問題**: AppImageが起動しない

- 解決策: FUSE をインストール `sudo apt install fuse`

**問題**: システムトレイが表示されない

- 解決策: システムトレイ拡張機能をインストール

---

## 次のステップ

すべてのプラットフォームでテストが完了したら:

1. テスト結果を集約
2. 発見された問題を修正
3. 再テストを実施
4. リリース判定を行う
5. タスク14.2（ドキュメント整備）に進む
