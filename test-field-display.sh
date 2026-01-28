#!/bin/bash

echo "=== 测试必填字段和批注信息显示 ==="
echo ""

# 获取 token
echo "1. 登录获取 token..."
TOKEN=$(curl -s -X POST "http://localhost:8081/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testmore","password":"Test123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  exit 1
fi
echo "✅ 登录成功"
echo ""

# 获取任务列表
echo "2. 获取任务列表..."
TASK_ID=$(curl -s -X GET "http://localhost:8081/api/tasks" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$TASK_ID" ]; then
  echo "❌ 获取任务失败"
  exit 1
fi
echo "✅ 任务ID: $TASK_ID"
echo ""

# 获取任务详细信息
echo "3. 获取任务更多信息..."
RESPONSE=$(curl -s -X GET "http://localhost:8081/api/tasks/$TASK_ID/more-info" \
  -H "Authorization: Bearer $TOKEN")

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# 检查字段
echo "4. 检查数据格式..."
INFO=$(echo "$RESPONSE" | grep -o '"info":"[^"]*"' | cut -d'"' -f4)
BIND_FIELD=$(echo "$RESPONSE" | grep -o '"bindField":"[^"]*"' | cut -d'"' -f4)
TIP=$(echo "$RESPONSE" | grep -o '"tip":"[^"]*"' | cut -d'"' -f4)

echo "info 字段: $INFO"
echo "bindField 字段: $BIND_FIELD"
echo "tip 字段: $TIP"
echo ""

echo "5. 测试提交页面..."
echo "请在浏览器中打开: http://localhost:5224/task/$TASK_ID"
echo ""
echo "检查项："
echo "  ✓ 必填字段是否正确显示（姓名、学号、班级）"
echo "  ✓ 批注文字是否显示"
echo "  ✓ 批注图片是否显示"
echo "  ✓ 字段名称不应该显示为 'undefined' 或 '未命名字段'"
echo ""
