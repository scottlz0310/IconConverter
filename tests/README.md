# テスト実行ガイド

このディレクトリには、ユニットテストおよび統合テストが含まれています。

## テストの種類
- `test_logic.py` : 画像変換ロジックのユニットテスト
- `test_integration.py` : GUIを含む統合テスト（簡易的な起動確認など）

## 実行方法
仮想環境を有効化した上で、pytestで実行できます。

```bash
source venv/bin/activate
pytest tests/
```

## 依存パッケージ
- pytest
- pillow

必要に応じてインストール：
```bash
pip install pytest pillow
```

## 注意事項
- 統合テストはGUIの起動確認のみで、ユーザー操作の自動化は含みません。
- 画像ファイルの入出力テストには一時ファイルを利用します。 