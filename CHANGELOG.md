# CHANGELOG

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