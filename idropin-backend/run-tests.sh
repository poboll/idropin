#!/bin/bash

# Idrop.in Backend Test Runner
# 运行所有单元测试

echo "========================================="
echo "  Idrop.in Backend Test Runner"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查Maven是否安装
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}错误: Maven未安装${NC}"
    exit 1
fi

# 运行测试
echo -e "${YELLOW}开始运行单元测试...${NC}"
echo ""

mvn clean test

# 检查测试结果
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
    echo ""
    echo "测试报告位置:"
    echo "  - HTML: idropin-backend/target/surefire-reports/index.html"
    echo "  - XML: idropin-backend/target/surefire-reports/"
    exit 0
else
    echo ""
    echo -e "${RED}✗ 测试失败，请检查错误信息${NC}"
    exit 1
fi
