"""ロガー設定モジュール

構造化ログ（JSON形式）の設定を提供します。
"""

import sys

from loguru import logger


def setup_logger(log_level: str = "INFO") -> None:
    """ロガーをセットアップする

    構造化ログ（JSON形式）を出力するように設定します。

    Args:
        log_level: ログレベル（DEBUG, INFO, WARNING, ERROR, CRITICAL）
    """
    # デフォルトのハンドラーを削除
    logger.remove()

    # JSON形式のログを標準出力に追加
    logger.add(
        sys.stdout,
        format="{message}",
        level=log_level,
        serialize=True,  # JSON形式で出力
        backtrace=True,
        diagnose=True,
    )

    logger.info(f"Logger initialized with level: {log_level}")
