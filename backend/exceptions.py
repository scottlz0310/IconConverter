"""カスタム例外クラス

画像変換処理で発生する各種エラーを表現するカスタム例外を定義します。
"""


class ImageConversionError(Exception):
    """画像変換エラーの基底クラス"""

    pass


class InvalidFileFormatError(ImageConversionError):
    """無効なファイル形式エラー

    サポートされていないファイル形式がアップロードされた場合に発生します。
    """

    pass


class FileSizeExceededError(ImageConversionError):
    """ファイルサイズ超過エラー

    アップロードされたファイルが最大サイズ制限を超えた場合に発生します。
    """

    pass


class ConversionFailedError(ImageConversionError):
    """変換処理失敗エラー

    画像からICOファイルへの変換処理が失敗した場合に発生します。
    """

    pass
