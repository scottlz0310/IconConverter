# Image to ICO Converter

様々な画像形式を複数サイズのICOファイルに変換するアプリケーションです。

## 🚀 WebUI版（推奨）

モダンなWebアプリケーション版です。ブラウザからアクセス可能で、洗練されたUIとUXを提供します。

### 技術スタック
- **バックエンド**: FastAPI + Python 3.13
- **フロントエンド**: React 18 + TypeScript 5.6 + Vite 6
- **UI**: Tailwind CSS + shadcn/ui
- **状態管理**: Zustand + TanStack Query
- **デプロイ**: Docker + docker-compose

### WebUI版の特徴
- 🌐 **ブラウザベース**: インストール不要、どこからでもアクセス可能
- 🎨 **モダンUI**: 直感的で洗練されたインターフェース
- 📱 **レスポンシブ**: デスクトップ、タブレット、モバイル対応
- 🌙 **ダークモード**: 目に優しいダークテーマ対応
- ⚡ **高速処理**: 非同期処理による快適な変換体験
- 🔒 **セキュア**: ファイルバリデーション、レート制限、CORS設定
- ♿ **アクセシブル**: WCAG 2.1 AA基準準拠

## デスクトップGUI版（レガシー）

Tkinterベースのデスクトップアプリケーション版も引き続き利用可能です。

## 特徴
- **複数画像形式対応**: PNG, JPEG, BMP, GIF, TIFF, WebP形式からICOファイルに変換
- 16x16, 32x32, 48x48, 64x64, 128x128, 256x256 の複数サイズを同時に出力
- 画像プレビュー機能付き
- シンプルなGUI（Tkinter使用）
- コード全体をクラスベース・モジュール分割でリファクタリング
- ログ出力機能（logs/）
- ユニットテスト・統合テスト付き
- **自動背景透明化機能**
  - 単色背景の画像ファイルを自動で透明化
  - 画像の四隅の色を検出して背景色を推定
  - 類似色を透明化してICOファイルに変換
- **画像形式別の透明化サポート**
  - PNG、GIF、WebP: 透明化完全サポート
  - JPEG、BMP、TIFF: 自動背景透明化で対応

## 対応画像形式
- **PNG** (.png) - 透明化完全サポート
- **JPEG** (.jpg, .jpeg) - 自動背景透明化対応
- **BMP** (.bmp) - 自動背景透明化対応
- **GIF** (.gif) - 透明化完全サポート
- **TIFF** (.tiff) - 自動背景透明化対応
- **WebP** (.webp) - 透明化完全サポート

## 必要条件

### WebUI版
- **Docker** + **docker-compose** (推奨)
- または
  - **Python 3.11以上** (3.13推奨) + **uv**
  - **Node.js 22以上** + **pnpm**

### デスクトップGUI版
- Python 3.7以降
- Pillow ライブラリ
- numpy（高速な画像処理のため）

## セットアップ

### WebUI版のセットアップ

#### 方法1: Docker（推奨）

最も簡単な方法です。Docker Desktopがインストールされていることを確認してください。

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/iconconverter.git
cd iconconverter

# 開発環境を起動
docker-compose up

# ブラウザで http://localhost:5173 にアクセス
```

これだけで、バックエンド（http://localhost:8000）とフロントエンド（http://localhost:5173）が起動します。

#### 方法2: ローカル開発環境

より高度な開発を行う場合は、ローカル環境で直接実行できます。

**バックエンドのセットアップ:**

```bash
# uvのインストール（まだの場合）
curl -LsSf https://astral.sh/uv/install.sh | sh

# バックエンドディレクトリに移動
cd backend

# 仮想環境の作成と依存関係のインストール
uv venv --python 3.13
uv sync

# 開発サーバーの起動
uv run uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**フロントエンドのセットアップ:**

```bash
# フロントエンドディレクトリに移動
cd frontend

# pnpmのインストール（まだの場合）
npm install -g pnpm

# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

#### 環境変数の設定

必要に応じて環境変数を設定できます。

**バックエンド（backend/.env）:**
```env
LOG_LEVEL=INFO
MAX_FILE_SIZE=10485760
CORS_ORIGINS=http://localhost:5173
```

**フロントエンド（frontend/.env）:**
```env
VITE_API_URL=http://localhost:8000
VITE_MAX_FILE_SIZE=10485760
```

### デスクトップGUI版のセットアップ

```bash
# 仮想環境の作成
python3 -m venv venv --system-site-packages
source venv/bin/activate  # Linux/macOSの場合
# venv\Scripts\activate  # Windowsの場合

# 依存パッケージのインストール
pip install -r requirements.txt
```

## 使い方

### WebUI版の使い方

1. **アプリケーションにアクセス**
   - ブラウザで http://localhost:5173 を開く

2. **画像をアップロード**
   - ドラッグ&ドロップエリアに画像をドロップ
   - または「ファイルを選択」ボタンをクリック
   - 対応形式: PNG, JPEG, BMP, GIF, TIFF, WebP
   - 最大ファイルサイズ: 10MB

3. **プレビューを確認**
   - アップロードした画像がプレビュー表示されます
   - ファイル名、サイズ、形式が表示されます

4. **透明化オプションを選択**
   - **透明化保持**: 既存の透明チャンネルを保持（PNG、GIF、WebP）
   - **自動背景透明化**: 単色背景を自動検出して透明化（全形式対応）
   - ※ 2つのオプションは相互排他的です

5. **変換を実行**
   - 「ICOに変換」ボタンをクリック
   - 変換処理の進行状況がプログレスバーで表示されます
   - 完了すると自動的にICOファイルがダウンロードされます

6. **生成されるICOファイル**
   - 6つのサイズが含まれます: 16×16, 32×32, 48×48, 64×64, 128×128, 256×256
   - ファイル名: `元のファイル名.ico`

### デスクトップGUI版の使い方

```bash
# 仮想環境をアクティベート
source venv/bin/activate

# アプリを起動
python main.py
```

1. 「Select Image File」ボタンを押して画像ファイルを選択
2. 透明化オプションを選択
3. プレビューを確認し、保存先とファイル名を指定してICOファイルを保存

## テスト

### WebUI版のテスト

**バックエンドテスト:**
```bash
cd backend
uv run pytest
uv run pytest --cov=backend  # カバレッジレポート付き
```

**フロントエンドテスト:**
```bash
cd frontend
pnpm test              # コンポーネントテスト
pnpm test:e2e          # E2Eテスト（Playwright）
```

**全テスト実行:**
```bash
make test  # ルートディレクトリから
```

### デスクトップGUI版のテスト

```bash
PYTHONPATH=. pytest tests/
```

詳細は[tests/README.md](./tests/README.md)を参照してください。

## 開発コマンド

便利なMakefileコマンドが用意されています。

```bash
make dev           # 開発環境起動（docker-compose）
make build         # 本番ビルド
make test          # 全テスト実行
make lint          # 全リント実行
make format        # 全フォーマット実行
make clean         # クリーンアップ
```

## API仕様

WebUI版のバックエンドAPIは、FastAPIの自動生成ドキュメントで確認できます。

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 主要エンドポイント

- `POST /api/convert` - 画像をICOファイルに変換
- `GET /api/health` - ヘルスチェック

詳細は[API仕様書](docs/API.md)を参照してください。

## ファイル構成

### WebUI版（開発中）
```
backend/              # FastAPIバックエンド
├── core/            # 既存の画像処理ロジック（iconconverterから移行）
├── services/        # ビジネスロジック層
├── routers/         # APIエンドポイント
└── tests/           # バックエンドテスト

frontend/            # React + TypeScriptフロントエンド
├── src/
│   ├── components/  # UIコンポーネント
│   ├── hooks/       # カスタムフック
│   ├── stores/      # 状態管理（Zustand）
│   ├── services/    # APIクライアント
│   └── types/       # TypeScript型定義
└── tests/           # フロントエンドテスト
```

### デスクトップGUI版（既存）
- `main.py` : エントリーポイント
- `iconconverter/` : アプリ本体（gui, logic, utils, config）
- `tests/` : テストコード・テストガイド
- `debug/` : デバッグ用
- `logs/` : ログ出力（.gitignore管理外）
- `docs/` : ドキュメント（詳細なコードレビュー等）
- `CHANGELOG.md` : 変更履歴

## トラブルシューティング

### WebUI版

**ポートが既に使用されている場合:**
```bash
# ポートを変更してdocker-composeを起動
docker-compose down
# docker-compose.ymlのポート設定を編集してから
docker-compose up
```

**Dockerコンテナが起動しない場合:**
```bash
# コンテナとボリュームを完全に削除して再起動
docker-compose down -v
docker-compose up --build
```

**フロントエンドがバックエンドに接続できない場合:**
- `frontend/.env`の`VITE_API_URL`が正しいか確認
- バックエンドが起動しているか確認（http://localhost:8000/health）
- ブラウザのコンソールでCORSエラーがないか確認

**変換が失敗する場合:**
- ファイルサイズが10MB以下か確認
- 対応形式（PNG, JPEG, BMP, GIF, TIFF, WebP）か確認
- バックエンドのログを確認（`docker-compose logs backend`）

### デスクトップGUI版

**Pillowのインストールエラー:**
```bash
# システムの画像ライブラリをインストール（Ubuntu/Debian）
sudo apt-get install libjpeg-dev zlib1g-dev

# macOS
brew install libjpeg
```

## パフォーマンス

### WebUI版のパフォーマンス目標

- **初回ロード時間**: 3秒以内
- **変換処理時間**: 5MB画像で5秒以内
- **対応ブラウザ**: Chrome, Firefox, Safari, Edgeの最新2バージョン

## セキュリティ

WebUI版では以下のセキュリティ対策を実装しています。

- ファイル形式の厳密な検証（MIME type + 拡張子 + Pillow検証）
- ファイルサイズ制限（10MB）
- レート制限（10リクエスト/分）
- CORS設定
- 一時ファイルの自動削除
- 構造化ログとモニタリング

## ドキュメント

- **WebUI移行仕様書**: [.kiro/specs/webui-migration/](.kiro/specs/webui-migration/)
  - [要件定義](.kiro/specs/webui-migration/requirements.md)
  - [設計書](.kiro/specs/webui-migration/design.md)
  - [実装タスク](.kiro/specs/webui-migration/tasks.md)
- **API仕様書**: [docs/API.md](docs/API.md)
- **アーキテクチャ**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **変更履歴**: [CHANGELOG.md](./CHANGELOG.md)
- **コードレビュー**: [docs/CODE_REVIEW.md](docs/CODE_REVIEW.md)
- **セキュリティ監査**: [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md)
- **セキュリティチェックリスト**: [docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md)

## セキュリティ

このアプリケーションは、以下のセキュリティ対策を実装しています：

### ファイルアップロードセキュリティ

- **3層検証**: MIMEタイプ、拡張子、Pillow実ファイル検証
- **ファイルサイズ制限**: 10MB
- **一時ファイル管理**: 処理後の自動削除
- **パストラバーサル対策**: 安全なパス生成

### セキュリティヘッダー

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy`（厳格な設定）

### その他のセキュリティ対策

- **レート制限**: 10リクエスト/分（IPベース）
- **CORS設定**: 環境変数による動的設定
- **構造化ログ**: リクエストトレーシングとエラー記録
- **依存関係管理**: 定期的な脆弱性スキャン

### セキュリティ監査

最新のセキュリティ監査結果:
- **バックエンド**: 脆弱性0件（Safety 3.6.2）
- **フロントエンド**: 脆弱性0件（pnpm audit）
- **OWASP Top 10**: 該当項目すべて対策済み

詳細は以下のドキュメントを参照してください：
- [セキュリティ監査レポート](docs/SECURITY_AUDIT.md)
- [セキュリティチェックリスト](docs/SECURITY_CHECKLIST.md)

### 脆弱性の報告

セキュリティ上の問題を発見した場合は、[SECURITY.md](./SECURITY.md)の手順に従って報告してください。

## コントリビューション

プルリクエストを歓迎します！以下の手順でコントリビュートできます。

1. このリポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（`git commit -m 'Add amazing feature'`）
4. ブランチにプッシュ（`git push origin feature/amazing-feature`）
5. プルリクエストを作成

### 開発ガイドライン

- コミットメッセージは[Conventional Commits](https://www.conventionalcommits.org/)に従う
- コードは`make lint`と`make format`でチェック
- テストは`make test`で全て通過すること
- 新機能には適切なテストを追加

## ライセンス

このプロジェクトはMITライセンスです。詳細は[LICENSE](./LICENSE)を参照してください。

## サポート

問題が発生した場合は、[GitHub Issues](https://github.com/yourusername/iconconverter/issues)で報告してください。

## ライセンス
このプロジェクトはMITライセンスです。
