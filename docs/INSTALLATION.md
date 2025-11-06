# IconConverter インストールガイド

## 目次

1. [システム要件](#システム要件)
2. [Windows](#windows)
3. [macOS](#macos)
4. [Linux](#linux)
5. [初回セットアップ](#初回セットアップ)
6. [アンインストール](#アンインストール)
7. [トラブルシューティング](#トラブルシューティング)

---

## システム要件

### 最小要件

| OS | バージョン | アーキテクチャ | メモリ | ディスク空間 |
|---|---|---|---|---|
| Windows | 10 (64-bit) | x64 | 2GB | 300MB |
| macOS | 12 (Monterey) | x64, arm64 | 2GB | 300MB |
| Linux | Ubuntu 20.04 | x64 | 2GB | 300MB |

### 推奨要件

| OS | バージョン | アーキテクチャ | メモリ | ディスク空間 |
|---|---|---|---|---|
| Windows | 11 (64-bit) | x64 | 4GB | 500MB |
| macOS | 13 (Ventura) | arm64 | 4GB | 500MB |
| Linux | Ubuntu 22.04 | x64 | 4GB | 500MB |

---

## Windows

### インストール方法

#### 方法1: NSISインストーラー（推奨）

1. **ダウンロード**
   - [GitHubリリースページ](https://github.com/yourusername/iconconverter/releases)にアクセス
   - 最新版の`IconConverter-Setup-x.x.x.exe`をダウンロード

2. **インストーラーの実行**
   - ダウンロードしたファイルをダブルクリック
   - Windows Defenderの警告が表示される場合:

     ```
     「詳細情報」をクリック
     ↓
     「実行」をクリック
     ```

3. **インストールウィザード**

   **ステップ1: ようこそ画面**
   - 「次へ」をクリック

   **ステップ2: ライセンス契約**
   - ライセンス条項を確認
   - 「同意する」を選択
   - 「次へ」をクリック

   **ステップ3: インストール先の選択**
   - デフォルト: `C:\Program Files\IconConverter`
   - 変更する場合は「参照」をクリック
   - 「次へ」をクリック

   **ステップ4: 追加タスクの選択**
   - ☑ デスクトップにショートカットを作成（推奨）
   - ☑ スタートメニューにショートカットを作成（推奨）
   - ☑ ファイル関連付けを有効にする（オプション）
   - 「次へ」をクリック

   **ステップ5: インストール準備完了**
   - 設定内容を確認
   - 「インストール」をクリック

   **ステップ6: インストール完了**
   - ☑ IconConverterを起動する
   - 「完了」をクリック

#### 方法2: ポータブル版

1. **ダウンロード**
   - [GitHubリリースページ](https://github.com/yourusername/iconconverter/releases)から`IconConverter-x.x.x-win-portable.zip`をダウンロード

2. **展開**
   - ZIPファイルを右クリック → 「すべて展開」
   - 展開先を選択（例: `C:\Tools\IconConverter`）
   - 「展開」をクリック

3. **起動**
   - 展開したフォルダ内の`IconConverter.exe`をダブルクリック

**ポータブル版の特徴**:

- インストール不要
- USBメモリで持ち運び可能
- レジストリを変更しない
- 設定ファイルは実行ファイルと同じフォルダに保存

### 管理者権限について

**必要な場合**:

- ファイル関連付けを有効にする
- `C:\Program Files`にインストールする

**不要な場合**:

- ポータブル版を使用
- ユーザーフォルダにインストール（例: `C:\Users\YourName\AppData\Local\IconConverter`）

### Windows Defenderの設定

初回起動時にWindows Defenderがブロックする場合:

1. **一時的に許可**

   ```
   Windows Defender の警告
   ↓
   「詳細情報」をクリック
   ↓
   「実行」をクリック
   ```

2. **除外設定（推奨）**

   ```
   Windows セキュリティを開く
   ↓
   ウイルスと脅威の防止
   ↓
   設定の管理
   ↓
   除外
   ↓
   除外の追加
   ↓
   フォルダー: C:\Program Files\IconConverter
   ```

---

## macOS

### インストール方法

#### Intel Mac (x64)

1. **ダウンロード**
   - [GitHubリリースページ](https://github.com/yourusername/iconconverter/releases)から`IconConverter-x.x.x-x64.dmg`をダウンロード

2. **DMGファイルのマウント**
   - ダウンロードしたDMGファイルをダブルクリック
   - DMGウィンドウが開きます

3. **インストール**
   - IconConverterアイコンをApplicationsフォルダにドラッグ&ドロップ
   - コピーが完了するまで待機

4. **DMGのアンマウント**
   - Finderのサイドバーで「IconConverter」の横の「⏏」をクリック
   - または、DMGファイルを右クリック → 「取り出す」

#### Apple Silicon Mac (arm64)

1. **ダウンロード**
   - [GitHubリリースページ](https://github.com/yourusername/iconconverter/releases)から`IconConverter-x.x.x-arm64.dmg`をダウンロード

2. **インストール手順**
   - Intel Macと同じ手順

**注意**: Apple Silicon Mac用のネイティブビルドを使用することで、最高のパフォーマンスが得られます。

### Gatekeeperの設定

初回起動時に「開発元を確認できないため開けません」と表示される場合:

#### 方法1: システム環境設定から許可

1. システム環境設定を開く
2. 「セキュリティとプライバシー」をクリック
3. 「一般」タブを選択
4. 「このまま開く」ボタンをクリック
5. 確認ダイアログで「開く」をクリック

#### 方法2: Controlキーを使用

1. Applicationsフォルダで「IconConverter」を探す
2. Controlキーを押しながらアプリをクリック
3. メニューから「開く」を選択
4. 確認ダイアログで「開く」をクリック

#### 方法3: ターミナルから許可（上級者向け）

```bash
# 隔離属性を削除
xattr -cr /Applications/IconConverter.app

# または、Gatekeeperを一時的に無効化（非推奨）
sudo spctl --master-disable
```

### 公証（Notarization）について

IconConverterは、Apple公証プロセスを経ています。公証済みアプリは、Gatekeeperの警告なしで起動できます。

**公証の確認**:

```bash
spctl -a -vv /Applications/IconConverter.app
```

出力例:

```
/Applications/IconConverter.app: accepted
source=Notarized Developer ID
```

---

## Linux

### Ubuntu / Debian

#### 方法1: DEBパッケージ（推奨）

1. **ダウンロード**

   ```bash
   wget https://github.com/yourusername/iconconverter/releases/download/v1.0.0/iconconverter_1.0.0_amd64.deb
   ```

2. **インストール**

   ```bash
   sudo dpkg -i iconconverter_1.0.0_amd64.deb
   ```

3. **依存関係の解決**

   ```bash
   sudo apt-get install -f
   ```

4. **起動**

   ```bash
   iconconverter
   ```

   または、アプリケーションメニューから「IconConverter」を選択

#### 方法2: AppImage（ポータブル）

1. **ダウンロード**

   ```bash
   wget https://github.com/yourusername/iconconverter/releases/download/v1.0.0/IconConverter-1.0.0.AppImage
   ```

2. **実行権限の付与**

   ```bash
   chmod +x IconConverter-1.0.0.AppImage
   ```

3. **起動**

   ```bash
   ./IconConverter-1.0.0.AppImage
   ```

**AppImageの利点**:

- インストール不要
- 依存関係が含まれている
- 複数バージョンの共存が可能

### Fedora / RHEL / CentOS

#### RPMパッケージ

1. **ダウンロード**

   ```bash
   wget https://github.com/yourusername/iconconverter/releases/download/v1.0.0/iconconverter-1.0.0.x86_64.rpm
   ```

2. **インストール**

   ```bash
   sudo rpm -i iconconverter-1.0.0.x86_64.rpm
   ```

3. **起動**

   ```bash
   iconconverter
   ```

### Arch Linux

#### AUR（ユーザーリポジトリ）

```bash
# yayを使用
yay -S iconconverter

# または、手動でビルド
git clone https://aur.archlinux.org/iconconverter.git
cd iconconverter
makepkg -si
```

### 依存関係

#### FUSE（AppImage使用時）

AppImageを使用する場合、FUSEが必要です:

**Ubuntu / Debian**:

```bash
sudo apt-get install fuse libfuse2
```

**Fedora**:

```bash
sudo dnf install fuse fuse-libs
```

**Arch Linux**:

```bash
sudo pacman -S fuse2
```

#### その他の依存関係

通常、以下のライブラリが必要です（DEBパッケージには含まれています）:

- libgtk-3-0
- libnotify4
- libnss3
- libxss1
- libxtst6
- xdg-utils
- libatspi2.0-0
- libdrm2
- libgbm1
- libxcb-dri3-0

**インストール**:

```bash
sudo apt-get install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libdrm2 libgbm1 libxcb-dri3-0
```

---

## 初回セットアップ

### 1. アプリケーションの起動

インストール後、初めてIconConverterを起動します。

**Windows**:

- デスクトップのショートカットをダブルクリック
- または、スタートメニューから「IconConverter」を検索

**macOS**:

- Applicationsフォルダから「IconConverter」を起動
- または、Spotlight（⌘+Space）で「IconConverter」を検索

**Linux**:

- アプリケーションメニューから「IconConverter」を選択
- または、ターミナルで`iconconverter`を実行

### 2. 初回起動ウィザード

初回起動時に、簡単なセットアップウィザードが表示されます。

#### ステップ1: ようこそ画面

- IconConverterの概要が表示されます
- 「次へ」をクリック

#### ステップ2: ファイル関連付け

画像ファイルとの関連付けを設定します。

- ☑ **画像ファイルとの関連付けを有効にする**
  - 有効にすると、画像ファイルを右クリックして「ICOに変換」を選択できます
  - 対応形式: PNG、JPEG、BMP、GIF、TIFF、WebP

**注意**:

- Windows: 管理者権限が必要な場合があります
- macOS: システム環境設定で手動設定が必要な場合があります
- Linux: 自動的に設定されます

#### ステップ3: 自動更新

自動更新の設定を選択します。

- ☑ **自動的に更新をチェックする**（推奨）
  - 4時間ごとに新しいバージョンをチェック
  - 更新が利用可能な場合、通知を表示

- ☑ **自動的に更新をダウンロードする**（推奨）
  - バックグラウンドで更新をダウンロード
  - 次回起動時に自動的に更新

#### ステップ4: テーマ設定

アプリケーションのテーマを選択します。

- ○ ライトモード
- ○ ダークモード
- ● システム設定に従う（推奨）

#### ステップ5: 完了

- 設定内容を確認
- 「完了」をクリック

### 3. 動作確認

セットアップ完了後、動作確認を行います。

1. **テスト画像の変換**
   - サンプル画像をダウンロード、または自分の画像を用意
   - IconConverterにドラッグ&ドロップ
   - 「ICOに変換」をクリック
   - 保存先を選択して保存

2. **ファイル関連付けの確認**（有効にした場合）
   - 画像ファイルを右クリック
   - 「ICOに変換」メニューが表示されることを確認

3. **システムトレイの確認**
   - ウィンドウを最小化
   - システムトレイにIconConverterアイコンが表示されることを確認

---

## アンインストール

### Windows

#### 方法1: コントロールパネル

1. コントロールパネルを開く
2. 「プログラムと機能」をクリック
3. 「IconConverter」を選択
4. 「アンインストール」をクリック
5. アンインストールウィザードの指示に従う

#### 方法2: 設定アプリ

1. 設定アプリを開く（Windows 10/11）
2. 「アプリ」→「アプリと機能」
3. 「IconConverter」を検索
4. 「アンインストール」をクリック

#### ポータブル版

- フォルダごと削除するだけ

#### 設定ファイルの削除（オプション）

アンインストール後も設定ファイルが残ります。完全に削除する場合:

```
C:\Users\YourName\AppData\Roaming\IconConverter
```

このフォルダを削除してください。

### macOS

1. **アプリケーションの削除**
   - Finderで「Applications」フォルダを開く
   - 「IconConverter」を探す
   - ゴミ箱にドラッグ&ドロップ
   - ゴミ箱を空にする

2. **設定ファイルの削除**（オプション）

   ```bash
   rm -rf ~/Library/Application\ Support/IconConverter
   rm -rf ~/Library/Preferences/com.iconconverter.app.plist
   rm -rf ~/Library/Caches/com.iconconverter.app
   ```

### Linux

#### DEBパッケージ

```bash
sudo apt-get remove iconconverter
```

完全削除（設定ファイルも削除）:

```bash
sudo apt-get purge iconconverter
```

#### RPMパッケージ

```bash
sudo rpm -e iconconverter
```

#### AppImage

- ファイルを削除するだけ

#### 設定ファイルの削除（オプション）

```bash
rm -rf ~/.config/IconConverter
rm -rf ~/.local/share/IconConverter
```

---

## トラブルシューティング

### インストールエラー

#### Windows: 「インストーラーが破損しています」

**原因**: ダウンロードが不完全、またはファイルが破損

**解決方法**:

1. ダウンロードしたファイルを削除
2. ブラウザのキャッシュをクリア
3. 再度ダウンロード
4. SHA256チェックサムを確認:

   ```powershell
   Get-FileHash IconConverter-Setup-1.0.0.exe -Algorithm SHA256
   ```

#### macOS: 「破損しているため開けません」

**原因**: Gatekeeperの制限、または隔離属性

**解決方法**:

```bash
xattr -cr /Applications/IconConverter.app
```

#### Linux: 「依存関係が満たされていません」

**原因**: 必要なライブラリがインストールされていない

**解決方法**:

```bash
# Ubuntu/Debian
sudo apt-get install -f

# Fedora
sudo dnf install --skip-broken
```

### 起動エラー

#### 「アプリケーションを起動できません」

**Windows**:

1. Visual C++ Redistributableをインストール:
   - [Microsoft公式サイト](https://aka.ms/vs/17/release/vc_redist.x64.exe)からダウンロード
2. .NET Framework 4.8をインストール（Windows 10以前）

**macOS**:

1. macOSのバージョンを確認（12以降が必要）
2. Rosetta 2をインストール（Intel Macアプリをarm64 Macで実行する場合）:

   ```bash
   softwareupdate --install-rosetta
   ```

**Linux**:

1. 依存関係を確認:

   ```bash
   ldd /usr/bin/iconconverter
   ```

2. 不足しているライブラリをインストール

### 権限エラー

#### Windows: 「管理者権限が必要です」

**解決方法**:

1. インストーラーを右クリック
2. 「管理者として実行」を選択

#### macOS: 「アクセス権がありません」

**解決方法**:

```bash
sudo chown -R $(whoami) /Applications/IconConverter.app
```

#### Linux: 「Permission denied」

**解決方法**:

```bash
chmod +x IconConverter-1.0.0.AppImage
```

### ディスク容量不足

**必要な空き容量**:

- インストール時: 500MB
- 実行時: 200MB（一時ファイル用）

**解決方法**:

1. ディスククリーンアップを実行
2. 不要なファイルを削除
3. 別のドライブにインストール

---

## 検証とチェックサム

### ダウンロードファイルの検証

セキュリティのため、ダウンロードしたファイルのチェックサムを確認することを推奨します。

#### Windows（PowerShell）

```powershell
Get-FileHash IconConverter-Setup-1.0.0.exe -Algorithm SHA256
```

#### macOS / Linux

```bash
shasum -a 256 IconConverter-1.0.0.dmg
```

### 公式チェックサム

各リリースのチェックサムは、GitHubリリースページの`checksums.txt`ファイルに記載されています。

---

## サポート

インストールに関する問題が解決しない場合:

1. **GitHubイシュー**: [https://github.com/yourusername/iconconverter/issues](https://github.com/yourusername/iconconverter/issues)
2. **トラブルシューティングガイド**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. **ユーザーマニュアル**: [USER_MANUAL.md](USER_MANUAL.md)

---

**最終更新**: 2024年11月
