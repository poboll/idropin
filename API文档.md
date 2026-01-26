# Idrop.in - 云集 API文档

## 概述

本文档描述了Idrop.in云集平台的RESTful API接口。

**Base URL**: `http://localhost:8080/api`

**认证方式**: JWT Bearer Token

**响应格式**: 统一使用`Result<T>`格式

---

## 通用响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 失败响应
```json
{
  "code": 400,
  "message": "错误描述",
  "data": null
}
```

### 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token过期 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 认证接口

### 1. 用户注册

**接口**: `POST /auth/register`

**请求参数**:
```json
{
  "username": "string",      // 用户名，必填，3-20字符
  "password": "string",      // 密码，必填，6-20字符
  "email": "string"         // 邮箱，必填，符合邮箱格式
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**错误示例**:
```json
{
  "code": 400,
  "message": "用户名已存在",
  "data": null
}
```

---

### 2. 用户登录

**接口**: `POST /auth/login`

**请求参数**:
```json
{
  "username": "string",      // 用户名，必填
  "password": "string"       // 密码，必填
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "550e8400-e29b-41d4-a716-4466554400000",
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**错误示例**:
```json
{
  "code": 400,
  "message": "用户名或密码错误",
  "data": null
}
```

---

### 3. 获取用户信息

**接口**: `GET /auth/profile`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-4466554400000",
    "username": "testuser",
    "email": "test@example.com",
    "createdAt": "2026-01-01T00:00:00"
  }
}
```

---

### 4. 刷新Token

**接口**: `POST /auth/refresh`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "Token刷新成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 5. 用户登出

**接口**: `POST /auth/logout`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登出成功",
  "data": null
}
```

---

## 文件接口

### 1. 单文件上传

**接口**: `POST /files/upload`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求参数**:
```
file: MultipartFile  // 文件，必填
```

**响应示例**:
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400000",
    "name": "test-file.pdf",
    "originalName": "Test File.pdf",
    "fileSize": 1024,
    "mimeType": "application/pdf",
    "url": "http://localhost:9000/files/test-file.pdf",
    "createdAt": "2026-01-01T00:00:00"
  }
}
```

**文件限制**:
- 最大文件大小：100MB
- 支持的文件类型：image/jpeg, image/png, image/gif, application/pdf, text/plain, text/csv, application/zip

---

### 2. 多文件上传

**接口**: `POST /files/upload/batch`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求参数**:
```
files: MultipartFile[]  // 文件数组，必填，最多10个
```

**响应示例**:
```json
{
  "code": 200,
  "message": "批量上传完成",
  "data": [
    {
      "fileName": "file1.pdf",
      "success": true,
      "fileId": "550e8400-e29b-41d4-a716-4466554400000"
    },
    {
      "fileName": "file2.pdf",
      "success": false,
      "error": "文件类型不支持"
    }
  ]
}
```

---

### 3. 获取文件列表

**接口**: `GET /files`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
```
page: int      // 页码，默认1
size: int      // 每页数量，默认10
categoryId: UUID  // 分类ID，可选
keyword: string  // 搜索关键字，可选
sortBy: string  // 排序字段，可选（name, fileSize, createdAt）
sortOrder: string // 排序方向，可选（asc, desc）
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "id": "550e8400-e29b-41d4-a716-4466554400000",
        "name": "test-file.pdf",
        "originalName": "Test File.pdf",
        "fileSize": 1024,
        "mimeType": "application/pdf",
        "url": "http://localhost:9000/files/test-file.pdf",
        "createdAt": "2026-01-01T00:00:00"
      }
    ],
    "total": 100,
    "size": 10,
    "current": 1,
    "pages": 10
  }
}
```

---

### 4. 获取文件详情

**接口**: `GET /files/{id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:
```
id: UUID  // 文件ID，必填
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400000",
    "name": "test-file.pdf",
    "originalName": "Test File.pdf",
    "fileSize": 1024,
    "mimeType": "application/pdf",
    "url": "http://localhost:9000/files/test-file.pdf",
    "uploaderId": "550e8400-e29b-41d4-a716-4466554400000",
    "categoryId": "550e8400-e29b-41d4-a716-4466554400001",
    "tags": ["文档", "PDF"],
    "status": "ACTIVE",
    "createdAt": "2026-01-01T00:00:00",
    "updatedAt": "2026-01-01T00:00:00"
  }
}
```

---

### 5. 更新文件信息

**接口**: `PUT /files/{id}`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
```
id: UUID  // 文件ID，必填
```

**请求体**:
```json
{
  "name": "updated-file.pdf",  // 文件名，可选
  "categoryId": "550e8400-e29b-41d4-a716-4466554400001",  // 分类ID，可选
  "tags": ["文档", "更新"],  // 标签数组，可选
  "metadata": {              // 元数据，可选
    "description": "文件描述"
  }
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400000",
    "name": "updated-file.pdf",
    "updatedAt": "2026-01-01T00:00:00"
  }
}
```

---

### 6. 删除文件

**接口**: `DELETE /files/{id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:
```
id: UUID  // 文件ID，必填
```

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

### 7. 批量删除文件

**接口**: `DELETE /files/batch`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "ids": [
    "550e8400-e29b-41d4-a716-4466554400000",
    "550e8400-e29b-41d4-a716-4466554400001"
  ]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "批量删除成功",
  "data": {
    "successCount": 2,
    "failedCount": 0
  }
}
```

---

### 8. 文件下载

**接口**: `GET /files/{id}/download`

**请求头**:
```
Authorization: Bearer {token}
Range: bytes=0-1024  // 可选，支持断点续传
```

**路径参数**:
```
id: UUID  // 文件ID，必填
```

**响应**:
- Content-Type: 文件的MIME类型
- Content-Disposition: attachment; filename="文件名"
- Content-Length: 文件大小
- 文件内容（二进制流）

---

### 9. 文件预览

**接口**: `GET /files/{id}/preview`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:
```
id: UUID  // 文件ID，必填
```

**响应**:
- Content-Type: 文件的MIME类型
- Content-Disposition: inline; filename="文件名"
- Content-Length: 文件大小
- 文件内容（二进制流）

**支持的预览类型**:
- 图片：image/jpeg, image/png, image/gif
- 文档：application/pdf
- 文本：text/plain, text/csv
- 视频：video/mp4, video/webm
- 音频：audio/mpeg, audio/wav

---

## 分类接口

### 1. 创建分类

**接口**: `POST /categories`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "文档",           // 分类名称，必填，1-50字符
  "description": "文档分类",  // 分类描述，可选，最多200字符
  "parentId": null           // 父分类ID，可选，null表示根分类
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400001",
    "name": "文档",
    "description": "文档分类",
    "parentId": null,
    "level": 1,
    "createdAt": "2026-01-01T00:00:00"
  }
}
```

---

### 2. 获取分类列表

**接口**: `GET /categories`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
```
parentId: UUID  // 父分类ID，可选，null表示获取所有根分类
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-4466554400001",
      "name": "文档",
      "description": "文档分类",
      "parentId": null,
      "level": 1,
      "children": [
        {
          "id": "550e8400-e29b-41d4-a716-4466554400002",
          "name": "PDF",
          "description": "PDF文档",
          "parentId": "550e8400-e29b-41d4-a716-4466554400001",
          "level": 2,
          "children": []
        }
      ]
    }
  ]
}
```

---

### 3. 获取分类树

**接口**: `GET /categories/tree`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-4466554400001",
      "name": "文档",
      "children": [
        {
          "id": "550e8400-e29b-41d4-a716-4466554400002",
          "name": "PDF",
          "children": []
        },
        {
          "id": "550e8400-e29b-41d4-a716-4466554400003",
          "name": "Word",
          "children": []
        }
      ]
    },
    {
      "id": "550e8400-e29b-41d4-a716-4466554400004",
      "name": "图片",
      "children": []
    }
  ]
}
```

---

### 4. 更新分类

**接口**: `PUT /categories/{id}`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
```
id: UUID  // 分类ID，必填
```

**请求体**:
```json
{
  "name": "更新后的文档",  // 分类名称，可选
  "description": "更新后的描述"  // 分类描述，可选
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400001",
    "name": "更新后的文档",
    "description": "更新后的描述",
    "updatedAt": "2026-01-01T00:00:00"
  }
}
```

---

### 5. 删除分类

**接口**: `DELETE /categories/{id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:
```
id: UUID  // 分类ID，必填
```

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

## 任务接口

### 1. 创建收集任务

**接口**: `POST /tasks`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "title": "期末作业收集",  // 任务标题，必填，1-100字符
  "description": "请提交期末作业...",  // 任务描述，可选，最多500字符
  "deadline": "2026-01-31T23:59:59",  // 截止时间，可选，ISO 8601格式
  "allowedTypes": ["application/pdf", "text/plain"],  // 允许的文件类型，可选
  "maxFileSize": 10485760,  // 最大文件大小（字节），可选
  "maxSubmissions": 100,  // 最大提交次数，可选
  "requireLogin": false  // 是否需要登录，可选，false表示支持匿名提交
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400005",
    "title": "期末作业收集",
    "description": "请提交期末作业...",
    "shareCode": "ABC12345",
    "status": "ACTIVE",
    "createdAt": "2026-01-01T00:00:00"
  }
}
```

---

### 2. 获取任务列表

**接口**: `GET /tasks`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
```
page: int      // 页码，默认1
size: int      // 每页数量，默认10
status: string  // 任务状态，可选（ACTIVE, CLOSED）
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "id": "550e8400-e29b-41d4-a716-4466554400005",
        "title": "期末作业收集",
        "description": "请提交期末作业...",
        "shareCode": "ABC12345",
        "status": "ACTIVE",
        "deadline": "2026-01-31T23:59:59",
        "submissionCount": 50,
        "createdAt": "2026-01-01T00:00:00"
      }
    ],
    "total": 10,
    "size": 10,
    "current": 1,
    "pages": 1
  }
}
```

---

### 3. 获取任务详情

**接口**: `GET /tasks/{id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:
```
id: UUID  // 任务ID，必填
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400005",
    "title": "期末作业收集",
    "description": "请提交期末作业...",
    "shareCode": "ABC12345",
    "status": "ACTIVE",
    "deadline": "2026-01-31T23:59:59",
    "allowedTypes": ["application/pdf", "text/plain"],
    "maxFileSize": 10485760,
    "maxSubmissions": 100,
    "submissionCount": 50,
    "statistics": {
      "totalSubmissions": 50,
      "uniqueSubmitters": 30,
      "fileTypeDistribution": {
        "application/pdf": 35,
        "text/plain": 15
      }
    },
    "createdAt": "2026-01-01T00:00:00"
  }
}
```

---

### 4. 提交文件到任务

**接口**: `POST /tasks/{taskId}/submit`

**请求头**:
```
Authorization: Bearer {token}  // 登录用户必填
Content-Type: multipart/form-data
```

**路径参数**:
```
taskId: UUID  // 任务ID，必填
```

**请求参数**:
```
files: MultipartFile[]  // 文件数组，必填
submitterName: string     // 提交者姓名，匿名提交时必填
submitterEmail: string    // 提交者邮箱，匿名提交时必填
```

**响应示例**:
```json
{
  "code": 200,
  "message": "提交成功",
  "data": {
    "submissionId": "550e8400-e29b-41d4-a716-4466554400006",
    "submittedFiles": [
      {
        "fileId": "550e8400-e29b-41d4-a716-4466554400007",
        "fileName": "homework.pdf"
      }
    ],
    "submittedAt": "2026-01-01T00:00:00"
  }
}
```

---

### 5. 更新任务

**接口**: `PUT /tasks/{id}`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**路径参数**:
```
id: UUID  // 任务ID，必填
```

**请求体**:
```json
{
  "title": "更新后的标题",  // 任务标题，可选
  "description": "更新后的描述",  // 任务描述，可选
  "deadline": "2026-02-28T23:59:59",  // 截止时间，可选
  "status": "CLOSED"  // 任务状态，可选（ACTIVE, CLOSED）
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400005",
    "title": "更新后的标题",
    "updatedAt": "2026-01-01T00:00:00"
  }
}
```

---

### 6. 删除任务

**接口**: `DELETE /tasks/{id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:
```
id: UUID  // 任务ID，必填
```

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

---

## 分享接口

### 1. 创建文件分享

**接口**: `POST /shares`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**:
```json
{
  "fileId": "550e8400-e29b-41d4-a716-4466554400000",  // 文件ID，必填
  "password": "123456",  // 访问密码，可选，4-20字符
  "expireDays": 7,  // 有效期（天），可选，1-30天
  "maxDownloads": 10  // 最大下载次数，可选，1-100次
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "shareId": "550e8400-e29b-41d4-a716-4466554400008",
    "shareCode": "ABC12345",
    "shareUrl": "http://localhost:8080/s/ABC12345",
    "password": true,
    "expireAt": "2026-01-08T00:00:00",
    "maxDownloads": 10,
    "downloadCount": 0,
    "createdAt": "2026-01-01T00:00:00"
  }
}
```

---

### 2. 访问分享文件

**接口**: `POST /shares/access/{shareCode}`

**请求体**:
```json
{
  "password": "123456"  // 访问密码，如果分享设置了密码则必填
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "访问成功",
  "data": {
    "file": {
      "id": "550e8400-e29b-41d4-a716-4466554400000",
      "name": "test-file.pdf",
      "originalName": "Test File.pdf",
      "fileSize": 1024,
      "mimeType": "application/pdf",
      "url": "http://localhost:9000/files/test-file.pdf"
    },
    "downloadCount": 1
  }
}
```

**错误示例**:
```json
{
  "code": 400,
  "message": "密码错误",
  "data": null
}
```

---

### 3. 获取我的分享列表

**接口**: `GET /shares`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
```
page: int  // 页码，默认1
size: int  // 每页数量，默认10
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "shareId": "550e8400-e29b-41d4-a716-4466554400008",
        "shareCode": "ABC12345",
        "shareUrl": "http://localhost:8080/s/ABC12345",
        "file": {
          "id": "550e8400-e29b-41d4-a716-4466554400000",
          "name": "test-file.pdf"
        },
        "expireAt": "2026-01-08T00:00:00",
        "downloadCount": 5,
        "maxDownloads": 10,
        "createdAt": "2026-01-01T00:00:00"
      }
    ],
    "total": 20,
    "size": 10,
    "current": 1,
    "pages": 2
  }
}
```

---

### 4. 取消分享

**接口**: `DELETE /shares/{shareId}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:
```
shareId: UUID  // 分享ID，必填
```

**响应示例**:
```json
{
  "code": 200,
  "message": "取消成功",
  "data": null
}
```

---

## 搜索接口

### 1. 全文搜索

**接口**: `GET /search`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
```
keyword: string    // 搜索关键字，必填
page: int         // 页码，默认1
size: int         // 每页数量，默认10
mimeType: string   // MIME类型过滤，可选
categoryId: UUID  // 分类过滤，可选
minSize: long     // 最小文件大小（字节），可选
maxSize: long     // 最大文件大小（字节），可选
startDate: string // 开始日期，可选，ISO 8601格式
endDate: string   // 结束日期，可选，ISO 8601格式
sortBy: string   // 排序字段，可选（name, fileSize, createdAt）
sortOrder: string // 排序方向，可选（asc, desc）
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "id": "550e8400-e29b-41d4-a716-4466554400000",
        "name": "test-file.pdf",
        "originalName": "Test File.pdf",
        "fileSize": 1024,
        "mimeType": "application/pdf",
        "url": "http://localhost:9000/files/test-file.pdf",
        "highlight": "Test <em>File</em>.pdf"
      }
    ],
    "total": 50,
    "size": 10,
    "current": 1,
    "pages": 5
  },
  "suggestions": [
    "test-file.pdf",
    "test-file-2.pdf",
    "test-document.pdf"
  ]
}
```

---

## 统计接口

### 1. 获取统计数据

**接口**: `GET /statistics`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:
```
type: string  // 统计类型，可选（user, system），默认user
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalFiles": 1000,
    "totalStorage": 1073741824,  // 总存储（字节）
    "todayUploads": 25,
    "weekUploads": 150,
    "monthUploads": 600,
    "fileTypeDistribution": {
      "application/pdf": 400,
      "image/jpeg": 300,
      "image/png": 200,
      "text/plain": 100
    },
    "uploadTrend": [
      {
        "date": "2026-01-01",
        "count": 25
      },
      {
        "date": "2026-01-02",
        "count": 30
      }
    ],
    "categoryStatistics": [
      {
        "categoryName": "文档",
        "count": 500
      },
      {
        "categoryName": "图片",
        "count": 300
      }
    ],
    "storageUsage": {
      "used": 1073741824,
      "total": 10737418240,  // 10GB
      "percentage": 10
    }
  }
}
```

---

## 错误处理

### 常见错误

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数格式和必填字段 |
| 401 | 未授权/Token过期 | 重新登录获取新Token |
| 403 | 无权限访问 | 检查用户权限 |
| 404 | 资源不存在 | 检查资源ID是否正确 |
| 409 | 文件已存在 | 修改文件名后重试 |
| 413 | 文件过大 | 压缩文件后上传 |
| 415 | 不支持的文件类型 | 上传支持的文件类型 |
| 429 | 请求过于频繁 | 稍后重试 |
| 500 | 服务器内部错误 | 联系系统管理员 |

---

## 使用示例

### cURL示例

#### 用户注册
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com"
  }'
```

#### 用户登录
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

#### 上传文件
```bash
curl -X POST http://localhost:8080/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/file.pdf"
```

#### 获取文件列表
```bash
curl -X GET "http://localhost:8080/api/files?page=1&size=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0.0 | 2026-01-14 | 初始版本 |

---

## 联系方式

- **项目地址**: https://github.com/your-org/idropin
- **问题反馈**: https://github.com/your-org/idropin/issues
- **文档地址**: https://github.com/your-org/idropin/wiki
