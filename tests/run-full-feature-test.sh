#!/bin/bash

###############################################################################
# 全機能テスト実行スクリプト
#
# タスク14.1: 全機能テスト
# - WebUI版との機能パリティ確認
# - 全プラットフォームでの動作確認
# - パフォーマンス基準クリア確認
# - オフライン動作の確認
###############################################################################

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ヘッダー表示
echo "=============================================="
echo "  IconConverter 全機能テストスイート"
echo "=============================================="
echo ""

# プラットフォーム情報を表示
log_info "プラットフォーム情報:"
echo "  OS: $(uname -s)"
echo "  アーキテクチャ: $(uname -m)"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo ""

# テスト結果を保存するディレクトリ
TEST_RESULTS_DIR="tests/results"
mkdir -p "$TEST_RESULTS_DIR"

# タイムスタンプ
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$TEST_RESULTS_DIR/full-feature-test-$TIMESTAMP.txt"

# レポートヘッダー
{
    echo "=============================================="
    echo "  IconConverter 全機能テストレポート"
    echo "=============================================="
    echo ""
    echo "実行日時: $(date)"
    echo "プラットフォーム: $(uname -s) $(uname -m)"
    echo "Node.js: $(node --version)"
    echo ""
} > "$REPORT_FILE"

# テスト実行関数
run_test_suite() {
    local test_name=$1
    local test_command=$2

    log_info "実行中: $test_name"

    if eval "$test_command" >> "$REPORT_FILE" 2>&1; then
        log_success "$test_name - 成功"
        echo "✓ $test_name - 成功" >> "$REPORT_FILE"
        return 0
    else
        log_error "$test_name - 失敗"
        echo "✗ $test_name - 失敗" >> "$REPORT_FILE"
        return 1
    fi
}

# テスト結果カウンター
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 1. 統合テスト
log_info "=========================================="
log_info "1. 統合テスト実行"
log_info "=========================================="
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "統合テスト" "npx playwright test tests/integration/full-feature-test.spec.js"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# 2. ユニットテスト
log_info "=========================================="
log_info "2. ユニットテスト実行"
log_info "=========================================="
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "ユニットテスト" "npm run test:unit -- --run"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# 3. E2Eテスト
log_info "=========================================="
log_info "3. E2Eテスト実行"
log_info "=========================================="
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "E2Eテスト" "npm run test:e2e"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
echo ""

# 4. アクセシビリティテスト
log_info "=========================================="
log_info "4. アクセシビリティテスト実行"
log_info "=========================================="
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "アクセシビリティテスト" "npm run test:accessibility"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    log_warning "アクセシビリティテストは失敗しましたが、続行します"
fi
echo ""

# 5. パフォーマンステスト
log_info "=========================================="
log_info "5. パフォーマンステスト実行"
log_info "=========================================="
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if run_test_suite "パフォーマンステスト" "npm run test:performance"; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    log_warning "パフォーマンステストは失敗しましたが、続行します"
fi
echo ""

# 結果サマリー
{
    echo ""
    echo "=============================================="
    echo "  テスト結果サマリー"
    echo "=============================================="
    echo "総テスト数: $TOTAL_TESTS"
    echo "成功: $PASSED_TESTS"
    echo "失敗: $FAILED_TESTS"
    echo ""
} >> "$REPORT_FILE"

# コンソールに結果を表示
echo ""
log_info "=========================================="
log_info "テスト結果サマリー"
log_info "=========================================="
echo "総テスト数: $TOTAL_TESTS"
echo "成功: $PASSED_TESTS"
echo "失敗: $FAILED_TESTS"
echo ""

# レポートファイルの場所を表示
log_info "詳細レポート: $REPORT_FILE"
echo ""

# 終了コードを設定
if [ $FAILED_TESTS -eq 0 ]; then
    log_success "すべてのテストが成功しました！"
    exit 0
else
    log_error "$FAILED_TESTS 個のテストが失敗しました"
    exit 1
fi
