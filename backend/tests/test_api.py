"""APIエンドポイントの統合テスト"""

import io
import os

from fastapi.testclient import TestClient

# テスト環境であることを示す環境変数を設定（レート制限を無効化）
os.environ["TESTING"] = "true"

from main import app

client = TestClient(app)


class TestHealthEndpoint:
    """ヘルスチェックエンドポイントのテストクラス"""

    def test_health_check_success(self):
        """ヘルスチェックの成功テスト"""
        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "2.0.0"

    def test_health_check_response_structure(self):
        """ヘルスチェックのレスポンス構造テスト"""
        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "version" in data
        assert isinstance(data["status"], str)
        assert isinstance(data["version"], str)


class TestConvertEndpoint:
    """画像変換エンドポイントのテストクラス"""

    def test_convert_png_success(self, sample_png_bytes):
        """PNG画像の変換成功テスト"""
        files = {"file": ("test.png", io.BytesIO(sample_png_bytes), "image/png")}
        data = {
            "preserve_transparency": True,
            "auto_transparent_bg": False,
        }

        response = client.post("/api/convert", files=files, data=data)

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/octet-stream"
        assert "content-disposition" in response.headers
        assert "test.ico" in response.headers["content-disposition"]

        # ICOファイルのマジックバイトを確認
        ico_data = response.content
        assert ico_data[:4] == b"\x00\x00\x01\x00"

    def test_convert_jpeg_success(self, sample_jpeg_bytes):
        """JPEG画像の変換成功テスト"""
        files = {"file": ("photo.jpg", io.BytesIO(sample_jpeg_bytes), "image/jpeg")}
        data = {
            "preserve_transparency": False,
            "auto_transparent_bg": False,
        }

        response = client.post("/api/convert", files=files, data=data)

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/octet-stream"
        assert "photo.ico" in response.headers["content-disposition"]

        ico_data = response.content
        assert ico_data[:4] == b"\x00\x00\x01\x00"

    def test_convert_with_transparency_preservation(self, sample_png_with_transparency_bytes):
        """透明度保持オプションの変換テスト"""
        files = {
            "file": (
                "transparent.png",
                io.BytesIO(sample_png_with_transparency_bytes),
                "image/png",
            ),
        }
        data = {
            "preserve_transparency": True,
            "auto_transparent_bg": False,
        }

        response = client.post("/api/convert", files=files, data=data)

        assert response.status_code == 200
        ico_data = response.content
        assert ico_data[:4] == b"\x00\x00\x01\x00"

    def test_convert_with_auto_transparent_bg(self, sample_png_bytes):
        """自動背景透明化オプションの変換テスト"""
        files = {"file": ("image.png", io.BytesIO(sample_png_bytes), "image/png")}
        data = {
            "preserve_transparency": False,
            "auto_transparent_bg": True,
        }

        response = client.post("/api/convert", files=files, data=data)

        assert response.status_code == 200
        ico_data = response.content
        assert ico_data[:4] == b"\x00\x00\x01\x00"

    def test_convert_default_options(self, sample_png_bytes):
        """デフォルトオプションでの変換テスト"""
        files = {"file": ("test.png", io.BytesIO(sample_png_bytes), "image/png")}

        # オプションを指定しない（デフォルト値が使用される）
        response = client.post("/api/convert", files=files)

        assert response.status_code == 200
        ico_data = response.content
        assert ico_data[:4] == b"\x00\x00\x01\x00"

    def test_convert_bmp_success(self, sample_bmp_bytes):
        """BMP画像の変換成功テスト"""
        files = {"file": ("image.bmp", io.BytesIO(sample_bmp_bytes), "image/bmp")}
        data = {
            "preserve_transparency": False,
            "auto_transparent_bg": False,
        }

        response = client.post("/api/convert", files=files, data=data)

        assert response.status_code == 200
        ico_data = response.content
        assert ico_data[:4] == b"\x00\x00\x01\x00"

    def test_convert_invalid_file_format(self, invalid_file_bytes):
        """無効なファイル形式のエラーテスト"""
        files = {"file": ("test.txt", io.BytesIO(invalid_file_bytes), "text/plain")}
        data = {
            "preserve_transparency": True,
            "auto_transparent_bg": False,
        }

        response = client.post("/api/convert", files=files, data=data)

        assert response.status_code == 415
        data = response.json()
        assert "detail" in data
        assert "error_code" in data
        assert data["error_code"] == "INVALID_FORMAT"

    def test_convert_file_size_exceeded(self, large_file_bytes):
        """ファイルサイズ超過のエラーテスト"""
        files = {"file": ("large.png", io.BytesIO(large_file_bytes), "image/png")}
        data = {
            "preserve_transparency": True,
            "auto_transparent_bg": False,
        }

        response = client.post("/api/convert", files=files, data=data)

        assert response.status_code == 413
        data = response.json()
        assert "detail" in data
        assert "error_code" in data
        assert data["error_code"] == "FILE_TOO_LARGE"

    def test_convert_corrupted_image(self):
        """破損した画像ファイルのエラーテスト"""
        # PNG形式のヘッダーだけを持つ破損ファイル
        corrupted_data = b"\x89PNG\r\n\x1a\n"
        files = {"file": ("corrupted.png", io.BytesIO(corrupted_data), "image/png")}
        data = {
            "preserve_transparency": True,
            "auto_transparent_bg": False,
        }

        response = client.post("/api/convert", files=files, data=data)

        # バリデーションまたは変換エラーが発生
        assert response.status_code in [415, 500]
        data = response.json()
        assert "detail" in data
        assert "error_code" in data

    def test_convert_no_file(self):
        """ファイルなしのリクエストエラーテスト"""
        data = {
            "preserve_transparency": True,
            "auto_transparent_bg": False,
        }

        response = client.post("/api/convert", data=data)

        assert response.status_code == 422  # Unprocessable Entity

    def test_convert_response_headers(self, sample_png_bytes):
        """レスポンスヘッダーのテスト"""
        files = {"file": ("test.png", io.BytesIO(sample_png_bytes), "image/png")}
        data = {
            "preserve_transparency": True,
            "auto_transparent_bg": False,
        }

        response = client.post("/api/convert", files=files, data=data)

        assert response.status_code == 200
        assert "content-disposition" in response.headers
        assert "content-length" in response.headers
        assert "x-request-id" in response.headers

        # Content-Lengthが実際のデータサイズと一致することを確認
        content_length = int(response.headers["content-length"])
        assert content_length == len(response.content)

    def test_convert_filename_without_extension(self, sample_png_bytes):
        """拡張子なしのファイル名の変換テスト"""
        files = {"file": ("image", io.BytesIO(sample_png_bytes), "image/png")}
        data = {
            "preserve_transparency": True,
            "auto_transparent_bg": False,
        }

        response = client.post("/api/convert", files=files, data=data)

        # 拡張子なしのファイル名はバリデーションエラーになる
        assert response.status_code == 415
        data = response.json()
        assert "サポートされていないファイル形式です" in data["detail"]

    def test_convert_multiple_requests(self, sample_png_bytes, sample_jpeg_bytes):
        """複数リクエストの連続実行テスト"""
        # 1回目: PNG
        files1 = {"file": ("test1.png", io.BytesIO(sample_png_bytes), "image/png")}
        response1 = client.post("/api/convert", files=files1)
        assert response1.status_code == 200

        # 2回目: JPEG
        files2 = {"file": ("test2.jpg", io.BytesIO(sample_jpeg_bytes), "image/jpeg")}
        response2 = client.post("/api/convert", files=files2)
        assert response2.status_code == 200

        # 両方のレスポンスが有効なICOファイルであることを確認
        assert response1.content[:4] == b"\x00\x00\x01\x00"
        assert response2.content[:4] == b"\x00\x00\x01\x00"


class TestRootEndpoint:
    """ルートエンドポイントのテストクラス"""

    def test_root_endpoint(self):
        """ルートエンドポイントのテスト"""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "docs" in data
        assert data["version"] == "2.0.0"
        assert data["docs"] == "/docs"


class TestCORS:
    """CORS設定のテストクラス"""

    def test_cors_headers_present(self, sample_png_bytes):
        """CORSヘッダーの存在テスト"""
        files = {"file": ("test.png", io.BytesIO(sample_png_bytes), "image/png")}

        response = client.post(
            "/api/convert",
            files=files,
            headers={"Origin": "http://localhost:5173"},
        )

        assert response.status_code == 200
        # CORSヘッダーが設定されていることを確認
        assert "access-control-allow-origin" in response.headers

    def test_cors_preflight_request(self):
        """CORSプリフライトリクエストのテスト"""
        response = client.options(
            "/api/convert",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

        # プリフライトリクエストが許可されることを確認
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-methods" in response.headers


class TestErrorHandling:
    """エラーハンドリングのテストクラス"""

    def test_invalid_endpoint(self):
        """存在しないエンドポイントのテスト"""
        response = client.get("/api/nonexistent")

        assert response.status_code == 404

    def test_method_not_allowed(self):
        """許可されていないHTTPメソッドのテスト"""
        response = client.get("/api/convert")

        assert response.status_code == 405

    def test_error_response_structure(self, invalid_file_bytes):
        """エラーレスポンスの構造テスト"""
        files = {"file": ("test.txt", io.BytesIO(invalid_file_bytes), "text/plain")}

        response = client.post("/api/convert", files=files)

        assert response.status_code in [400, 413, 415, 500]
        data = response.json()
        assert "detail" in data
        assert isinstance(data["detail"], str)
        # error_codeがある場合は文字列であることを確認
        if "error_code" in data:
            assert isinstance(data["error_code"], str)
