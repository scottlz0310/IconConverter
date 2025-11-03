# レガシーテスト（旧Tkinter実装用）

このディレクトリには、旧Tkinter GUI実装用のテストが格納されています。

## 内容

- `test_gui.py` - Tkinter GUIのテスト
- `test_logic.py` - IconConverterクラスのロジックテスト
- `test_integration.py` - 統合テスト
- `test_jpeg_conversion.py` - JPEG変換の特定テスト
- `conftest.py` - pytest設定

## 実行方法

```bash
# レガシーテストの実行
uv run pytest tests-legacy/
```

## 注意

これらのテストは旧実装用であり、新しいWebUI実装（FastAPI + React）のテストは`backend/tests/`と`frontend/tests/`に配置されます。
