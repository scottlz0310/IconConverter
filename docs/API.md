# API仕様書

Image to ICO Converter API v2.0.0

## 概要

このAPIは、様々な画像形式を複数サイズのICOファイルに変換するRESTful APIです。

- **ベースURL**: `http://localhost:8000`（開発環境）
- **プロトコル**: HTTP/HTTPS
- **データ形式**: JSON, multipart/form-data
- **認証**: なし（将来的に追加予定）

## 自動生成ドキュメント

FastAPIは自動的にインタラクティブなAPIドキュメントを生成します。

- **Swagger UI**: http://localhost:8000/docs
  - インタラクティブなAPI探索とテスト
  - リクエスト/レスポンスの例
  - 直接APIを試すことが可能

- **ReDoc**: http://localhost:8000/redoc
  - 読みやすいドキュメント形式
  - 印刷やPDF出力に適している

## エンドポイント一覧

| メソッド | パス | 説明 | レート制限 |
|---------|------|------|-----------|
| GET | `/` | ルートエンドポイント | なし |
| GET | `/api/health` | ヘルスチェック | なし |
| POST | `/api/convert` | 画像変換 | 10リクエスト/分 |

---

## エンドポイント詳細

### GET /

ルートエンドポイント。APIの基本情報を返します。

#### リクエスト

```http
GET / HTTP/1.1
Host: localhost:8000
```

#### レスポンス

**ステータスコード**: 200 OK

```json
{
  "message": "Image to ICO Converter API",
  "version": "2.0.0",
  "docs": "/docs"
}
```

---

### GET /api/health

ヘルスチェックエンドポイント。APIの稼働状態を確認します。

#### リクエスト

```http
GET /api/health HTTP/1.1
Host: localhost:8000
```

#### レスポンス

**ステータスコード**: 200 OK

```json
{
  "status": "healthy",
  "version": "2.0.0"
}
```

#### レスポンスフィールド

| フィールド | 型 | 説明 |
|-----------|-----|------|
| status | string | 稼働状態（"healthy" または "unhealthy"） |
| version | string | APIバージョン |

---

### POST /api/convert

画像ファイルをICO形式に変換します。

#### リクエスト

**Content-Type**: `multipart/form-data`

```http
POST /api/convert HTTP/1.1
Host: localhost:8000
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="image.png"
Content-Type: image/png

[バイナリデータ]
------WebKitFormBoundary
Content-Disposition: form-data; name="preserve_transparency"

true
------WebKitFormBoundary
Content-Disposition: form-data; name="auto_transparent_bg"

false
------WebKitFormBoundary--
```

#### リクエストパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| file | File | ✓ | - | 変換する画像ファイル |
| preserve_transparency | boolean | | true | 既存の透明度を保持 |
| auto_transparent_bg | boolean | | false | 自動背景透明化 |

#### ファイル制約

- **対応形式**: PNG, JPEG, BMP, GIF, TIFF, WebP
- **最大サイズ**: 10MB (10,485,760 bytes)
- **検証方法**:
  - MIMEタイプチェック
  - ファイル拡張子チェック
  - Pillowによる実ファイル検証

#### 透明化オプション

2つのオプションは相互排他的です。両方を`true`にすることはできません。

- **preserve_transparency**:
  - PNG, GIF, WebPの既存の透明チャンネルを保持
  - JPEGなど透明度非対応形式では無視される

- **auto_transparent_bg**:
  - 画像の四隅のピクセルから背景色を検出
  - 類似色を自動的に透明化
  - 全形式で利用可能

#### レスポンス（成功）

**ステータスコード**: 200 OK

**Content-Type**: `application/octet-stream`

**Content-Disposition**: `attachment; filename="image.ico"`

```
[ICOファイルのバイナリデータ]
```

生成されるICOファイルには以下の6つのサイズが含まれます：
- 16×16
- 32×32
- 48×48
- 64×64
- 128×128
- 256×256

#### レスポンス（エラー）

**Content-Type**: `application/json; charset=utf-8`

##### 400 Bad Request - バリデーションエラー

```json
{
  "detail": "ファイルが選択されていません"
}
```

##### 413 Payload Too Large - ファイルサイズ超過

```json
{
  "detail": "ファイルサイズが大きすぎます（最大10MB）",
  "error_code": "FILE_TOO_LARGE"
}
```

##### 415 Unsupported Media Type - 無効なファイル形式

```json
{
  "detail": "対応していないファイル形式です。PNG, JPEG, BMP, GIF, TIFF, WebPのみサポートしています",
  "error_code": "INVALID_FORMAT"
}
```

##### 429 Too Many Requests - レート制限超過

```json
{
  "error": "Rate limit exceeded: 10 per 1 minute"
}
```

##### 500 Internal Server Error - 変換失敗

```json
{
  "detail": "画像の変換に失敗しました: [エラー詳細]",
  "error_code": "CONVERSION_FAILED"
}
```

#### レスポンスヘッダー

| ヘッダー | 説明 |
|---------|------|
| X-Request-ID | リクエストを追跡するための一意のID |
| Content-Type | レスポンスのコンテンツタイプ |
| Content-Disposition | ファイルダウンロード用のヘッダー（成功時） |

---

## エラーコード一覧

| コード | HTTPステータス | 説明 |
|-------|---------------|------|
| INVALID_FORMAT | 415 | 対応していないファイル形式 |
| FILE_TOO_LARGE | 413 | ファイルサイズが10MBを超過 |
| CONVERSION_FAILED | 500 | 画像変換処理の失敗 |

---

## レート制限

APIには以下のレート制限が適用されます。

- **エンドポイント**: `/api/convert`
- **制限**: 10リクエスト/分（IPアドレスごと）
- **超過時**: 429 Too Many Requests

レート制限を超過した場合、1分間待ってから再試行してください。

---

## CORS設定

APIは以下のオリジンからのリクエストを許可します。

**開発環境**:
- `http://localhost:5173`
- `http://localhost:3000`

**本番環境**: 環境変数`CORS_ORIGINS`で設定

許可されるメソッド: `GET`, `POST`

---

## 使用例

### cURLでの使用例

```bash
# ヘルスチェック
curl http://localhost:8000/api/health

# 画像変換（透明度保持）
curl -X POST http://localhost:8000/api/convert \
  -F "file=@image.png" \
  -F "preserve_transparency=true" \
  -F "auto_transparent_bg=false" \
  -o output.ico

# 画像変換（自動背景透明化）
curl -X POST http://localhost:8000/api/convert \
  -F "file=@photo.jpg" \
  -F "preserve_transparency=false" \
  -F "auto_transparent_bg=true" \
  -o output.ico
```

### JavaScriptでの使用例

```javascript
// axiosを使用した例
import axios from 'axios';

async function convertImage(file, options) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('preserve_transparency', options.preserveTransparency);
  formData.append('auto_transparent_bg', options.autoTransparentBg);

  try {
    const response = await axios.post(
      'http://localhost:8000/api/convert',
      formData,
      {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Blobからダウンロードリンクを作成
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'output.ico';
    link.click();
    window.URL.revokeObjectURL(url);

    return response.data;
  } catch (error) {
    if (error.response) {
      // サーバーエラー
      console.error('Error:', error.response.data);
      throw new Error(error.response.data.detail);
    } else {
      // ネットワークエラー
      console.error('Network error:', error);
      throw new Error('ネットワークエラーが発生しました');
    }
  }
}

// 使用例
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

await convertImage(file, {
  preserveTransparency: true,
  autoTransparentBg: false,
});
```

### Pythonでの使用例

```python
import requests

# ヘルスチェック
response = requests.get('http://localhost:8000/api/health')
print(response.json())

# 画像変換
with open('image.png', 'rb') as f:
    files = {'file': f}
    data = {
        'preserve_transparency': 'true',
        'auto_transparent_bg': 'false',
    }

    response = requests.post(
        'http://localhost:8000/api/convert',
        files=files,
        data=data,
    )

    if response.status_code == 200:
        # ICOファイルを保存
        with open('output.ico', 'wb') as out:
            out.write(response.content)
        print('変換成功！')
    else:
        print(f'エラー: {response.json()}')
```

---

## パフォーマンス

### 処理時間の目安

| ファイルサイズ | 処理時間 |
|--------------|---------|
| 1MB以下 | 1-2秒 |
| 1-5MB | 2-5秒 |
| 5-10MB | 5-8秒 |

※ 実際の処理時間は、画像の複雑さ、サーバーの負荷、ネットワーク状況により変動します。

### 最適化のヒント

- ファイルサイズを可能な限り小さくする（10MB以下）
- 不要に大きな解像度の画像は避ける
- レート制限を考慮してリクエストを送信する

---

## セキュリティ

### ファイルアップロードのセキュリティ

1. **ファイル形式検証**
   - MIMEタイプチェック
   - ファイル拡張子チェック
   - Pillowによる実ファイル検証（マジックバイト）

2. **ファイルサイズ制限**
   - 最大10MBに制限
   - DoS攻撃の防止

3. **一時ファイル管理**
   - 処理後の自動削除
   - セキュアな一時ディレクトリ使用

4. **レート制限**
   - 10リクエスト/分
   - 過度なリクエストの防止

### ベストプラクティス

- クライアント側でもファイルサイズと形式を事前チェック
- エラーメッセージを適切に処理
- HTTPSを使用（本番環境）
- APIキーによる認証を検討（将来的な機能）

---

## バージョニング

現在のバージョン: **2.0.0**

APIはセマンティックバージョニング（SemVer）に従います。

- **メジャーバージョン**: 互換性のない変更
- **マイナーバージョン**: 後方互換性のある機能追加
- **パッチバージョン**: 後方互換性のあるバグ修正

---

## サポート

問題が発生した場合は、以下の方法でサポートを受けられます。

- **GitHub Issues**: https://github.com/yourusername/iconconverter/issues
- **ドキュメント**: [README.md](../README.md)
- **ログ**: バックエンドのログを確認（`docker-compose logs backend`）

---

## 変更履歴

### v2.0.0 (2024-11-03)
- WebUI版の初回リリース
- FastAPI + Reactアーキテクチャ
- RESTful API実装
- レート制限追加
- 構造化ログ実装

### v1.x.x
- デスクトップGUI版（Tkinter）
