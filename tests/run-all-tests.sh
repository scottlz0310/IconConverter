#!/bin/bash

# すべてのテストを実行するスクリプト
#
# 使用方法: ./tests/run-all-tests.sh

set -e

echo "======================================"
echo "IconConverter テストスイート実行"
echo "======================================"
echo ""

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# テスト結果を追跡
UNIT_TEST_RESULT=0
E2E_TEST_RESULT=0
ACCESSIBILITY_TEST_RESULT=0
PERFORMANCE_TEST_RESULT=0

# ユニットテスト
echo "======================================"
echo "1. ユニットテスト実行中..."
echo "======================================"
if npm run test:unit; then
    echo -e "${GREEN}✓ ユニットテスト: 合格${NC}"
    UNIT_TEST_RESULT=0
else
    echo -e "${RED}✗ ユニットテスト: 不合格${NC}"
    UNIT_TEST_RESULT=1
fi
echo ""

# E2Eテスト
echo "======================================"
echo "2. E2Eテスト実行中..."
echo "======================================"
if npm run test:e2e; then
    echo -e "${GREEN}✓ E2Eテスト: 合格${NC}"
    E2E_TEST_RESULT=0
else
    echo -e "${RED}✗ E2Eテスト: 不合格${NC}"
    E2E_TEST_RESULT=1
fi
echo ""

# アクセシビリティテスト
echo "======================================"
echo "3. アクセシビリティテスト実行中..."
echo "======================================"
if npm run test:accessibility; then
    echo -e "${GREEN}✓ アクセシビリティテスト: 合格${NC}"
    ACCESSIBILITY_TEST_RESULT=0
else
    echo -e "${RED}✗ アクセシビリティテスト: 不合格${NC}"
    ACCESSIBILITY_TEST_RESULT=1
fi
echo ""

# パフォーマンステスト
echo "======================================"
echo "4. パフォーマンステスト実行中..."
echo "======================================"
if npm run test:performance; then
    echo -e "${GREEN}✓ パフォーマンステスト: 合格${NC}"
    PERFORMANCE_TEST_RESULT=0
else
    echo -e "${RED}✗ パフォーマンステスト: 不合格${NC}"
    PERFORMANCE_TEST_RESULT=1
fi
echo ""

# 結果サマリー
echo "======================================"
echo "テスト結果サマリー"
echo "======================================"

if [ $UNIT_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ ユニットテスト${NC}"
else
    echo -e "${RED}✗ ユニットテスト${NC}"
fi

if [ $E2E_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ E2Eテスト${NC}"
else
    echo -e "${RED}✗ E2Eテスト${NC}"
fi

if [ $ACCESSIBILITY_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ アクセシビリティテスト${NC}"
else
    echo -e "${RED}✗ アクセシビリティテスト${NC}"
fi

if [ $PERFORMANCE_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ パフォーマンステスト${NC}"
else
    echo -e "${RED}✗ パフォーマンステスト${NC}"
fi

echo ""

# 総合結果
TOTAL_RESULT=$((UNIT_TEST_RESULT + E2E_TEST_RESULT + ACCESSIBILITY_TEST_RESULT + PERFORMANCE_TEST_RESULT))

if [ $TOTAL_RESULT -eq 0 ]; then
    echo -e "${GREEN}======================================"
    echo "✓ すべてのテストが合格しました！"
    echo "======================================${NC}"
    exit 0
else
    echo -e "${RED}======================================"
    echo "✗ 一部のテストが不合格です"
    echo "======================================${NC}"
    exit 1
fi
