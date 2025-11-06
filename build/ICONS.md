# アイコンリソース

## 生成されたファイル

### プレースホルダーアイコン（開発用）

現在、以下のプレースホルダーアイコンが生成されています：

- `icon.ico` - Windows用アイコン（16x16から256x256まで）
- `icons/*.png` - Linux用アイコン（16x16から1024x1024まで）
- `icon-master.png` - マスター画像（1024x1024）

これらは開発・テスト用のシンプルなアイコンです。本番環境では、デザインされたアイコンに置き換えてください。

## 本番用アイコンの準備

### 1. ソース画像の準備

- **推奨サイズ**: 1024x1024ピクセル以上
- **形式**: PNG（透明背景推奨）
- **内容**: アプリケーションを表すシンプルで認識しやすいデザイン

### 2. アイコン生成

#### 方法A: 自動生成スクリプト使用

```bash
# すべてのプラットフォーム用アイコンを生成
node build/generate-icons.js path/to/your-icon.png

# macOS用ICNSファイルを生成（追加で必要）
npx png2icons build/icon-master.png build -icns -bc
```

#### 方法B: 手動生成

**Windows (.ico)**

- オンラインツール: <https://convertio.co/ja/png-ico/>
- または、Photoshop/GIMPなどのグラフィックツール

**macOS (.icns)**

- macOS標準ツール: `iconutil`
- オンラインツール: <https://cloudconvert.com/png-to-icns>
- npmパッケージ: `png2icons`

**Linux (.png)**

- 各サイズのPNGファイルを `build/icons/` ディレクトリに配置
- ファイル名: `16x16.png`, `32x32.png`, ..., `1024x1024.png`

### 3. ファイル配置

生成したアイコンファイルを以下の場所に配置：

```
build/
├── icon.ico          # Windows用
├── icon.icns         # macOS用
└── icons/            # Linux用
    ├── 16x16.png
    ├── 32x32.png
    ├── 48x48.png
    ├── 64x64.png
    ├── 128x128.png
    ├── 256x256.png
    ├── 512x512.png
    └── 1024x1024.png
```

## アイコンデザインガイドライン

### 視認性

- シンプルで明確なデザイン
- 小さいサイズ（16x16）でも認識可能
- 高コントラスト

### プラットフォーム別考慮事項

**Windows**

- 角丸は控えめに
- システムアイコンとの調和

**macOS**

- 角丸デザイン推奨
- グラデーションやシャドウの使用可
- macOSデザインガイドラインに準拠

**Linux**

- フラットデザイン推奨
- 透明背景

### カラー

- ブランドカラーの使用
- ダークモード/ライトモード両対応
- 十分なコントラスト

## システムトレイアイコン

システムトレイ用の小さいアイコンも必要です：

```
assets/
└── tray-icon.png     # 16x16または32x32
```

- モノクロまたはシンプルなデザイン
- OSのテーマに適応
- 透明背景

## インストーラー画像（Windows）

NSISインストーラー用の画像（オプション）：

```
build/
├── installerHeader.bmp    # 150x57ピクセル
└── installerSidebar.bmp   # 164x314ピクセル
```

これらは省略可能ですが、プロフェッショナルな印象を与えます。

## 検証

アイコンが正しく生成されたか確認：

```bash
# ファイルの存在確認
ls -lh build/icon.ico
ls -lh build/icon.icns
ls -lh build/icons/

# 画像情報の確認
file build/icon.ico
file build/icons/*.png
```

## トラブルシューティング

### アイコンが表示されない

1. ファイルパスが正しいか確認
2. ファイル形式が正しいか確認
3. キャッシュをクリア: `rm -rf dist-electron`
4. 再ビルド: `npm run build`

### macOS ICNSエラー

- `iconutil` が利用可能か確認（macOSのみ）
- または `png2icons` を使用
- オンラインツールで生成

### サイズが大きすぎる

- 画像を最適化: `optipng`, `pngquant`
- 不要な透明度を削除
- 適切な圧縮レベルを使用

## 参考資料

- [Windows Icon Guidelines](https://docs.microsoft.com/en-us/windows/apps/design/style/iconography)
- [macOS Human Interface Guidelines - App Icon](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [freedesktop.org Icon Theme Specification](https://specifications.freedesktop.org/icon-theme-spec/icon-theme-spec-latest.html)
