# 必填字段和批注信息显示修复

## 问题描述

1. **必填字段显示为 "undefined" 或 "未命名字段"**
   - 原因：`info` 字段存储的数据格式与 `parseInfo` 函数期望的格式不匹配
   
2. **批注信息（文字和图片）不显示**
   - 原因：`tip` 字段只存储了文本，没有存储图片信息

3. **bindField 字段混乱**
   - 原因：`bindField` 被用来存储名单列表，而不是绑定字段名称

## 解决方案

### 1. 数据格式标准化

#### info 字段（必填字段）
```json
// 新格式：简单字符串数组
["姓名", "学号", "班级"]

// 旧格式（兼容）：对象数组
[{"id":"1","name":"姓名","isDefault":true}]
```

#### bindField 字段（绑定字段和名单）
```json
// 新格式：包含字段名和名单
{
  "fieldName": "姓名",
  "nameList": [
    {"id":"1","name":"张三"},
    {"id":"2","name":"李四"}
  ]
}

// 旧格式（兼容）：直接存储名单数组
[{"id":"1","name":"张三"}]
```

#### tip 字段（批注信息）
```json
// 新格式：包含文本和图片
{
  "text": "批注文字内容",
  "imgs": [
    {"uid":1,"name":"https://pic.imgdb.cn/item/668cd877d9c307b7e99e9061.png"}
  ]
}

// 旧格式（兼容）：纯文本
"批注文字内容"
```

### 2. 代码修改

#### MoreSettingsDialog.tsx
- **handleSave**: 保存数据时使用新格式
- **loadInfo**: 加载数据时兼容新旧格式
- 批注图片功能完整实现

#### lib/utils/string.ts
- **parseInfo**: 支持解析对象的 `name` 属性作为 `text`

#### src/app/task/[key]/page.tsx
- **limitBindField**: 解析新的 bindField 格式

### 3. 向后兼容

所有修改都保持了向后兼容性：
- 可以正确解析旧格式数据
- 新保存的数据使用新格式
- 不会破坏现有数据

## 测试步骤

1. 运行测试脚本：
```bash
./test-field-display.sh
```

2. 在浏览器中打开任务提交页面

3. 检查以下内容：
   - ✅ 必填字段正确显示（姓名、学号、班级）
   - ✅ 批注文字正确显示
   - ✅ 批注图片正确显示
   - ✅ 字段名称不显示为 "undefined" 或 "未命名字段"

## API 测试

```bash
# 保存测试数据
curl -X POST "http://localhost:8081/api/tasks/{taskId}/more-info" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "info": "[\"姓名\",\"学号\",\"班级\"]",
    "bindField": "{\"fieldName\":\"姓名\",\"nameList\":[{\"id\":\"1\",\"name\":\"张三\"}]}",
    "tip": "{\"text\":\"测试批注\",\"imgs\":[{\"uid\":1,\"name\":\"https://example.com/image.png\"}]}",
    "people": true
  }'

# 获取数据验证
curl -X GET "http://localhost:8081/api/tasks/{taskId}/more-info" \
  -H "Authorization: Bearer {token}"
```

## 注意事项

1. **名单功能临时方案**：
   - 当前名单存储在 `bindField` 中
   - 未来应该迁移到独立的 `people_list` 表
   - 需要实现完整的 People API

2. **图片存储**：
   - 当前批注图片 URL 直接存储在 tip 字段中
   - 支持外部图片链接
   - 未来可以考虑上传到服务器

3. **数据迁移**：
   - 旧数据会在下次保存时自动转换为新格式
   - 不需要手动迁移数据库

## 相关文件

- `idropin-frontend/components/tasks/MoreSettingsDialog.tsx`
- `idropin-frontend/lib/utils/string.ts`
- `idropin-frontend/src/app/task/[key]/page.tsx`
- `idropin-frontend/components/forms/InfosForm.tsx`

## 提交信息

```
fix: 修复必填字段和批注信息显示问题

- 修改数据存储格式：info 字段存储字段名称数组，bindField 存储绑定字段和名单
- 修复 parseInfo 函数，支持解析 name 属性
- 修复批注信息的图片显示
- 兼容旧数据格式
```
