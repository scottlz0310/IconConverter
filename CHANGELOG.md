# CHANGELOG

## [v1.5.0] - 2025-11-05
### Added
- Flexible bootstrap targets for customized development environment setup
  - `make bootstrap-backend`: Backend-only setup
  - `make bootstrap-frontend`: Frontend-only setup
  - `make bootstrap-full`: Complete frontend + backend setup
- Enhanced Makefile documentation with `prod-down` target

### Fixed
- Stabilized CI/CD pipeline across all platforms (Ubuntu, Windows, macOS)
  - Fixed mypy type checking with runtime Python version detection
  - Fixed pytest test discovery in CI pipeline
  - Fixed coverage measurement configuration (94% backend coverage achieved)
  - Improved Docker build consistency with unified context handling
- Resolved type incompatibilities with slowapi rate limit exception handler

### Technical
- Updated CI/CD workflow to support Python 3.12, 3.13, and 3.14
- Unified Docker build contexts across development and production environments
- Enhanced coverage configuration for accurate metrics collection
- Added proper healthcheck configuration for backend service

## [v1.4.1] - 2025-11-05
### Fixed
- Makefile: improve bootstrap command structure for better developer experience
  - Split bootstrap into backend, frontend, and full setup targets
  - Allows developers to install only what they need based on their role
  - Improves .PHONY declaration to include all targets

### Technical
- Update pre-commit configuration to use Python 3.14 for better compatibility

## [v1.4.0] - 2025-10-12
### Fixed
- Windows環境でのテスト失敗問題を修正
  - PermissionErrorによるファイル削除失敗を解決
  - クロスプラットフォーム対応の_safe_remove_file()関数を追加
  - リトライ機構とグレースフル処理を実装

### Added
- クロスプラットフォームCI対応
  - Windows/Linux/macOSでの自動テスト実行
  - 3 OS × 3 Pythonバージョン（3.11/3.12/3.13）のマトリクス
  - プラットフォーム別のテスト実行環境を最適化
- Pre-commit自動化
  - コミット時の品質チェック自動実行
  - ruff、mypy、各種フックの統合

### Technical
- 品質ルールPhase 6準拠のCI/CD構築
- Conventional Commits準拠のコミット規約
- SemVer準拠のバージョニング

## [v1.3.0] - 2024-06-XX
### Added
- 複数画像形式対応を追加
  - PNG, JPEG, BMP, GIF, TIFF, WebP形式に対応
  - ファイル選択ダイアログで全形式を選択可能
  - 画像形式に応じた透明化サポートの自動判定
- 画像前処理機能をutils.pyに分離
  - 単一責任の原則に従った責務分離
  - 画像形式ごとの前処理ロジックを独立化

### Changed
- アプリケーション名を「Image to ICO Converter」に汎用化
- convert_image_to_ico関数を新設（後方互換性のためconvert_png_to_icoも残存）
- ファイル選択ダイアログの拡張（SUPPORTED_IMAGE_FORMATS設定）
- 透明化サポートの自動判定機能追加

### Technical
- 単一責任の原則に従ったモジュール設計
- utils.pyに画像前処理・ファイル形式チェック機能を追加
- 後方互換性を維持した関数設計

## [v1.2.0] - 2024-06-XX
### Added
- 自動背景透明化機能を追加
  - 画像の四隅の色を自動検出して背景色を推定
  - 類似色を透明化（色の類似度計算）
  - 単色背景のPNGファイルを簡単に透明化可能
- 透明化オプションのUI改善
  - 「透明化保持」と「自動背景透明化」の2つのオプション
  - 相互排他的な選択でユーザビリティ向上
- numpy依存関係を追加（高速な画像処理のため）

### Changed
- convert_png_to_ico関数に自動背景透明化パラメータを追加
- GUIに透明化オプションのチェックボックスを追加

## [v1.1.0] - 2024-06-XX
### Changed
- コード全体をクラスベース・モジュール分割でリファクタリング
- main.pyをエントリーポイントに変更
- icon_converter/配下にgui, logic, utils, configを分離
- ロガー機能を追加（logs/に出力）
- 設定値・定数をconfig.pyで管理
- ディレクトリ構成を整理（tests, debug, docs, logs追加）
- テストコード（ユニット・統合）をtests/配下に追加
- テスト実行ガイドをtests/README.mdに追加

## [v1.0.0] - 2024-06-XX
### Added
- PNG画像を複数サイズのICOファイルに変換するGUIアプリケーションを初公開
- 16x16, 32x32, 48x48, 64x64, 128x128, 256x256 の複数サイズICO出力対応
- 画像プレビュー機能
- シンプルなTkinterベースのUI
