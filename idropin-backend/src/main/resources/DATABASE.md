# 数据库初始化说明

## 📋 可用脚本

### 1. `init-database.sql` - 公开初始化脚本（推荐）

**用途**：适合其他开发者clone项目后快速搭建开发环境

**特点**：
- ✅ 完整的表结构定义（17个表）
- ✅ 包含示例数据（管理员账号、测试分类、示例任务）
- ✅ **不包含任何隐私信息**
- ✅ 适合公开分享和教学演示

**默认账号**：
- 管理员：`admin` / `admin123`
- 普通用户：`demo` / `admin123`

**使用方法**：
```bash
# 方式1：使用psql命令行
psql -U your_username -d idropin -f init-database.sql

# 方式2：Docker环境
docker exec -i devos-postgres psql -U idropin -d idropin < init-database.sql
```

---

### 2. `schema.sql` - 基础结构脚本

**用途**：仅包含表结构，不含示例数据

**特点**：
- ✅ 完整的表定义
- ✅ UUID主键
- ❌ 无示例数据

---

### 3. `schema-reset.sql` - 完整重置脚本

**用途**：开发环境快速重置数据库

**特点**：
- ✅ 完整的表结构
- ✅ VARCHAR(36)主键（匹配Java String类型）
- ✅ 包含测试数据
- ⚠️ 会删除所有现有数据

---

## 🚀 快速开始

### 新项目初始化

```bash
# 1. 创建数据库
docker exec -i devos-postgres psql -U postgres -c "CREATE DATABASE idropin;"

# 2. 运行初始化脚本
docker exec -i devos-postgres psql -U postgres -d idropin < init-database.sql

# 3. 验证
docker exec -i devos-postgres psql -U postgres -d idropin -c "SELECT * FROM sys_user;"
```

### 重置开发环境

```bash
# 删除并重建数据库
docker exec -i devos-postgres psql -U postgres -c "DROP DATABASE IF EXISTS idropin;"
docker exec -i devos-postgres psql -U postgres -c "CREATE DATABASE idropin;"
docker exec -i devos-postgres psql -U postgres -d idropin < init-database.sql
```

---

## 📊 数据库结构概览

### 核心业务表（6个）
1. **sys_user** - 用户表
2. **file** - 文件表
3. **file_category** - 文件分类
4. **collection_task** - 收集任务
5. **file_share** - 文件分享
6. **file_submission** - 文件提交

### 扩展功能表（11个）
7. **file_chunk** - 文件分片（大文件上传）
8. **task_more_info** - 任务扩展信息
9. **people_list** - 提交人员名单
10. **task_submission** - 任务提交记录
11. **sys_message** - 系统消息
12. **sys_feedback** - 用户反馈
13. **sys_feedback_reply** - 反馈回复
14. **sys_operation_log** - 操作日志
15. **sys_access_log** - 访问日志
16. **password_reset_token** - 密码重置令牌
17. **sys_route_config** - 路由配置

---

## 🔑 重要字段说明

### 软删除机制
- `file.deleted` - 文件软删除标记
- `collection_task.deleted` - 任务软删除标记（回收站功能）

### 存储管理
- `sys_user.storage_limit` - 用户存储限额（默认10GB）
- `sys_user.storage_used` - 已使用空间

### 安全相关
- 所有密码使用BCrypt加密存储
- IP地址记录用于审计和安全分析
- device_fingerprint用于防止重复提交

---

## ⚠️ 注意事项

1. **生产环境**：不要使用默认密码，请修改管理员账号密码
2. **隐私保护**：确保不要将包含真实用户数据的SQL文件提交到公开仓库
3. **备份**：生产环境操作前务必备份数据库
4. **权限**：确保数据库用户有足够的权限创建表和索引

---

## 📝 更新日志

### 2026-02-07
- ✅ 新增 `init-database.sql` - 适合公开分享的初始化脚本
- ✅ 包含完整表结构和安全的示例数据
- ✅ 添加详细的字段注释和使用说明
