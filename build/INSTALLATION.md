# インストール手順

IconConverterのインストール方法をプラットフォーム別に説明します。

## 目次

- [Windows](#windows)
- [macOS](#macos)
- [Linux](#linux)
- [システム要件](#システム要件)
- [トラブルシューティング](#トラブルシューティング)

---

## Windows

### 方法1: インストーラー（推奨）

1. **ダウンロード**
   - [GitHub Releases](https://github.com/iconconverter/iconconverter/releases)から最新版をダウンロード
   - ファイル: `IconConverter-Setup-{version}.exe`

2. **インストール**
   - ダウンロードしたファイルをダブルクリック
   - Windows Defenderの警告が表示される場合:
     - 「詳細情報」をクリック
     - 「実行」をクリック
   - インストールウィザードに従って進む
   - インストール先を選択（デフォルト: `C:\Users\{ユーザー名}\AppData\Local\Programs\IconConverter`）
   - デスクトップショートカットの作成を選択
   - 「インストール」をクリック

3. **起動**
   - デスクトップのショートカットから起動
   - またはスタートメニューから「IconConverter」を検索

### 方法2: ポータブル版

1. **ダウンロード**
   - ファイル: `IconConverter-{version}-portable.exe`

2. **使用方法**
   - 任意のフォルダに配置
   - ダブルクリックで起動
   - インストール不要、USBメモリでも使用可能

### アンインストール

**インストーラー版:**

- 設定 → アプリ → IconConverter → アンインストール
- またはコントロールパネル → プログラムと機能

**ポータブル版:**

- ファイルを削除するだけ

---

## macOS

### 方法1: DMG（推奨）

1. **ダウンロード**
   - [GitHub Releases](https://github.com/iconconverter/iconconverter/releases)から最新版をダウンロード
   - Intel Mac: `IconConverter-{version}-x64.dmg`
   - Apple Silicon (M1/M2/M3): `IconConverter-{version}-arm64.dmg`

2. **インストール**
   - ダウンロードしたDMGファイルをダブルクリック
   - IconConverterアイコンをApplicationsフォルダにドラッグ&ドロップ
   - DMGをアンマウント（イジェクト）

3. **初回起動**
   - Applicationsフォルダから「IconConverter」を起動
   - 「開発元を確認できないため開けません」と表示される場合:
     - Controlキーを押しながらアプリをクリック
     - 「開く」を選択
     - または、システム環境設定 → セキュリティとプライバシー → 「このまま開く」

4. **Dockに追加（オプション）**
   - アプリを起動した状態でDockのアイコンを右クリック
   - オプション → Dockに追加

### 方法2: ZIP

1. **ダウンロード**
   - ファイル: `IconConverter-{version}-mac.zip`

2. **インストール**
   - ZIPファイルを解凍
   - IconConverter.appをApplicationsフォルダに移動

### アンインストール

- ApplicationsフォルダからIconConverter.appをゴミ箱に移動
- 設定ファイルも削除する場合:

  ```bash
  rm -rf ~/Library/Application\ Support/IconConverter
  rm -rf ~/Library/Preferences/com.iconconverter.app.plist
  ```

---

## Linux

### 方法1: AppImage（推奨）

1. **ダウンロード**
   - [GitHub Releases](https://github.com/iconconverter/iconconverter/releases)から最新版をダウンロード
   - ファイル: `IconConverter-{version}.AppImage`

2. **実行権限を付与**

   ```bash
   chmod +x IconConverter-*.AppImage
   ```

3. **起動**

   ```bash
   ./IconConverter-*.AppImage
   ```

4. **デスクトップ統合（オプション）**

   **AppImageLauncher使用（推奨）:**

   ```bash
   # Ubuntu/Debian
   sudo add-apt-repository ppa:appimagelauncher-team/stable
   sudo apt update
   sudo apt install appimagelauncher
   
   # その後、AppImageをダブルクリックすると自動的に統合される
   ```

   **手動統合:**

   ```bash
   # デスクトップエントリーを作成
   cat > ~/.local/share/applications/iconconverter.desktop << EOF
   [Desktop Entry]
   Name=IconConverter
   Exec=/path/to/IconConverter-*.AppImage
   Icon=iconconverter
   Type=Application
   Categories=Graphics;
   EOF
   ```

### 方法2: DEB（Debian/Ubuntu）

1. **ダウンロード**
   - ファイル: `iconconverter_{version}_amd64.deb`

2. **インストール**

   **GUIから:**
   - ダウンロードしたファイルをダブルクリック
   - ソフトウェアセンターが開く
   - 「インストール」をクリック

   **コマンドラインから:**

   ```bash
   sudo apt install ./iconconverter_*.deb
   ```

3. **起動**
   - アプリケーションメニューから「IconConverter」を検索
   - またはコマンドラインから: `iconconverter`

### 方法3: RPM（Fedora/RHEL）

1. **ダウンロード**
   - ファイル: `iconconverter-{version}.x86_64.rpm`

2. **インストール**

   **Fedora:**

   ```bash
   sudo dnf install iconconverter-*.rpm
   ```

   **RHEL/CentOS:**

   ```bash
   sudo yum install iconconverter-*.rpm
   ```

3. **起動**
   - アプリケーションメニューから「IconConverter」を検索
   - またはコマンドラインから: `iconconverter`

### アンインストール

**AppImage:**

- ファイルを削除するだけ
- デスクトップ統合を削除:

  ```bash
  rm ~/.local/share/applications/iconconverter.desktop
  ```

**DEB:**

```bash
sudo apt remove iconconverter
```

**RPM:**

```bash
sudo dnf remove iconconverter
# または
sudo yum remove iconconverter
```

---

## システム要件

### Windows

- **OS**: Windows 10 (64-bit) 以降
- **推奨**: Windows 11
- **メモリ**: 4GB RAM以上
- **ディスク**: 200MB以上の空き容量

### macOS

- **OS**: macOS 12 (Monterey) 以降
- **アーキテクチャ**: Intel (x64) または Apple Silicon (arm64)
- **メモリ**: 4GB RAM以上
- **ディスク**: 200MB以上の空き容量

### Linux

- **ディストリビューション**:
  - Ubuntu 20.04 LTS以降
  - Debian 11以降
  - Fedora 35以降
  - その他の主要ディストリビューション
- **アーキテクチャ**: x86_64 (64-bit)
- **メモリ**: 4GB RAM以上
- **ディスク**: 200MB以上の空き容量
- **依存関係** (DEB/RPM):
  - GTK 3
  - libnotify
  - NSS
  - X11

---

## トラブルシューティング

### Windows

**問題: 「WindowsによってPCが保護されました」と表示される**

解決策:

1. 「詳細情報」をクリック
2. 「実行」をクリック
3. または、コード署名版をダウンロード

**問題: アプリが起動しない**

解決策:

1. Windows Defenderのログを確認
2. 管理者として実行
3. 再インストール

### macOS

**問題: 「開発元を確認できないため開けません」**

解決策:

1. Controlキーを押しながらアプリをクリック → 「開く」
2. または、システム環境設定 → セキュリティとプライバシー → 「このまま開く」
3. または、ターミナルで:

   ```bash
   xattr -cr /Applications/IconConverter.app
   ```

**問題: 「破損しているため開けません」**

解決策:

```bash
xattr -cr /Applications/IconConverter.app
sudo spctl --master-disable  # Gatekeeperを一時的に無効化
# アプリを起動
sudo spctl --master-enable   # Gatekeeperを再度有効化
```

### Linux

**問題: AppImageが起動しない**

解決策:

1. 実行権限を確認: `chmod +x IconConverter-*.AppImage`
2. FUSE をインストール:

   ```bash
   # Ubuntu/Debian
   sudo apt install fuse libfuse2
   
   # Fedora
   sudo dnf install fuse fuse-libs
   ```

3. 依存関係を確認: `ldd IconConverter-*.AppImage`

**問題: DEBインストールで依存関係エラー**

解決策:

```bash
sudo apt-get install -f
```

**問題: アイコンが表示されない**

解決策:

```bash
# アイコンキャッシュを更新
gtk-update-icon-cache -f -t ~/.local/share/icons/hicolor
update-desktop-database ~/.local/share/applications
```

### 共通

**問題: 画像変換が失敗する**

解決策:

1. 画像ファイルが破損していないか確認
2. ファイルサイズが10MB以下か確認
3. サポートされている形式か確認（PNG, JPEG, BMP, GIF, TIFF, WebP）
4. アプリを再起動

**問題: メモリ使用量が多い**

解決策:

1. 大きな画像ファイルを避ける
2. アプリを再起動
3. システムのメモリを確認

---

## サポート

問題が解決しない場合:

- **GitHub Issues**: <https://github.com/iconconverter/iconconverter/issues>
- **ドキュメント**: <https://github.com/iconconverter/iconconverter/wiki>
- **メール**: <support@iconconverter.app>

---

## 更新

アプリは自動的に更新を確認します。新しいバージョンが利用可能な場合、通知が表示されます。

手動で更新を確認:

- メニュー → ヘルプ → 更新を確認

または、最新版を手動でダウンロードしてインストールしてください。
