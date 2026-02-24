#!/usr/bin/env python3
"""Apifox enrichment: update descriptions, examples, and create test cases for all 154 APIs."""
import json, time, requests

TOKEN = "afxp_b707e26InDtPKkDG8d1gh0TXlMDouly34YvB"
PROJECT_ID = "7870815"
BASE = "https://app.apifox.com/api/v1"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "X-Apifox-Api-Version": "2024-03-28",
    "Content-Type": "application/json",
}
PROXIES = {"http": None, "https": None}

def req(method, path, **kw):
    url = f"{BASE}{path}"
    r = requests.request(method, url, headers=HEADERS, proxies=PROXIES, timeout=20, **kw)
    return r.json() if r.content else {}


# path -> (description, request_body_example, query_params_example)
API_META = {
    # ===== 认证管理 =====
    "POST /auth/register": (
        "新用户注册账号。用户名长度3-50，密码长度6-100，邮箱格式校验。注册成功返回用户基本信息。",
        {"username": "testuser", "password": "test123456", "email": "test@example.com"},
        {}
    ),
    "POST /auth/login": (
        "用户登录获取JWT Token。返回accessToken、refreshToken及用户信息。Token有效期2小时，refreshToken有效期7天。",
        {"username": "mdo", "password": "891124wyh"},
        {}
    ),
    "POST /auth/refresh": (
        "使用refreshToken换取新的accessToken。refreshToken过期或无效时返回401。",
        {"refreshToken": "eyJhbGciOiJIUzI1NiJ9.refresh_token_example"},
        {}
    ),
    "POST /auth/logout": (
        "注销当前会话，使refreshToken失效。即使refreshToken无效也返回成功。",
        {"refreshToken": "eyJhbGciOiJIUzI1NiJ9.refresh_token_example"},
        {}
    ),
    "POST /auth/password-reset/request": (
        "通过邮箱发送密码重置链接。邮件包含有效期30分钟的重置令牌。",
        {"email": "test@example.com"},
        {}
    ),
    "POST /auth/password-reset/confirm": (
        "使用重置令牌设置新密码。新密码需6-16位，包含字母和数字。令牌过期或已使用返回400。",
        {"token": "reset-token-abc123", "newPassword": "NewPass123"},
        {}
    ),
    # ===== 用户管理 =====
    "GET /user/me": (
        "获取当前登录用户的详细信息，包括用户名、邮箱、手机号、头像、角色、存储配额等。需要Bearer Token认证。",
        {},
        {}
    ),
    "PUT /user/password": (
        "修改当前用户密码。新密码最少6位最多100位。支持通过旧密码验证或验证码验证两种方式。",
        {"oldPassword": "891124wyh", "newPassword": "newpass123"},
        {}
    ),
    "PUT /user/avatar": (
        "通过URL更新用户头像。avatarUrl为头像图片的完整URL地址。",
        {},
        {"avatarUrl": "https://example.com/avatar.jpg"}
    ),
    "POST /user/avatar/upload": (
        "上传头像图片文件。支持jpg/png/gif格式，文件大小限制5MB。上传成功后自动更新用户头像URL。",
        {},
        {}
    ),
    "GET /user/avatar/{userId}": (
        "通过后端代理获取指定用户的头像图片，无需直接访问对象存储。支持缓存1小时。",
        {},
        {}
    ),
    "POST /user/send-code": (
        "发送手机或邮箱验证码，用于绑定手机/邮箱操作。type参数为email或sms。验证码有效期5分钟。",
        {},
        {"target": "13800138000", "type": "sms"}
    ),
    "POST /user/bind-phone": (
        "绑定或更换手机号。需先调用send-code获取验证码。手机号格式：1开头11位数字。",
        {},
        {"phone": "13800138000", "code": "123456"}
    ),
    "POST /user/bind-email": (
        "绑定或更换邮箱地址。需先调用send-code获取邮箱验证码。",
        {},
        {"email": "newemail@example.com", "code": "123456"}
    ),
    # ===== 收集任务 =====
    "POST /tasks": (
        "创建文件收集任务。支持设置截止时间、文件类型限制、提交人数限制、是否需要登录等。collectionType为FILE或INFO。",
        {"title": "期末作业收集", "description": "请提交本学期期末作业", "deadline": "2026-06-30 23:59:59", "requireLogin": False, "allowAnonymous": True, "maxFileSize": 52428800, "maxFileCount": 5, "collectionType": "FILE"},
        {}
    ),
    "GET /tasks": (
        "获取当前用户创建的所有任务列表，按创建时间倒序排列。不包含已永久删除的任务。",
        {},
        {}
    ),
    "GET /tasks/{id}": (
        "获取指定任务的完整详情，包括任务配置、统计数据等。只有任务创建者可访问。",
        {},
        {}
    ),
    "PUT /tasks/{id}": (
        "更新任务信息，包括标题、描述、截止时间、文件限制等配置。只有任务创建者可修改。",
        {"title": "期末作业收集（更新）", "deadline": "2026-07-01 23:59:59"},
        {}
    ),
    "DELETE /tasks/{id}": (
        "将任务移入回收站（软删除）。任务进入回收站后30天内可恢复，之后自动永久删除。",
        {},
        {}
    ),
    "GET /tasks/trash": (
        "获取当前用户回收站中的任务列表。",
        {},
        {}
    ),
    "POST /tasks/{id}/restore": (
        "从回收站恢复任务。恢复后任务状态恢复为删除前的状态。",
        {},
        {}
    ),
    "DELETE /tasks/{id}/permanent": (
        "永久删除任务及其所有提交记录和关联文件。此操作不可撤销。",
        {},
        {}
    ),
    "POST /tasks/{taskId}/submit": (
        "向指定任务提交文件。支持multipart/form-data上传。可附带提交人姓名、邮箱等信息。任务设置limitOnePerDevice时同IP只能提交一次。",
        {},
        {"submitterName": "张三", "submitterEmail": "zhangsan@example.com"}
    ),
    "POST /tasks/{taskId}/submit-info": (
        "向信息收集类任务提交表单数据（无文件）。infoData为JSON字符串，包含自定义字段数据。",
        {},
        {"submitterName": "李四", "submitterEmail": "lisi@example.com", "infoData": "{\"field1\":\"value1\"}"}
    ),
    "GET /tasks/{taskId}/submissions": (
        "获取任务的所有提交记录列表，包含提交人信息、文件信息、AI评分等。仅任务创建者可访问。",
        {},
        {}
    ),
    "GET /tasks/{taskId}/statistics": (
        "获取任务提交统计数据，包括总提交数、唯一提交人数、文件类型分布、近期提交趋势等。",
        {},
        {}
    ),
    "GET /tasks/{taskId}/public-info": (
        "获取任务的公开信息，无需认证。用于提交页面展示任务标题、描述、截止时间等基本信息。",
        {},
        {}
    ),
    "GET /tasks/{taskId}/public-submissions": (
        "获取任务的公开提交记录（脱敏处理）。仅在任务开启公开展示时可访问。",
        {},
        {}
    ),
    "GET /tasks/{taskId}/more-info": (
        "获取任务的扩展配置信息，包括提示语、模板、字段绑定等高级设置。",
        {},
        {}
    ),
    "POST /tasks/{taskId}/more-info": (
        "保存任务的扩展配置，包括截止提示、提交提示、信息收集字段、模板文件等。",
        {"ddl": "截止时间为本周五", "tip": "请确保文件命名规范", "people": True, "rewrite": False, "autoRename": True},
        {}
    ),
    "GET /tasks/{taskId}/ai-prompt": (
        "获取任务的自定义AI评分提示词。用于定制AI对提交文件的评估标准。",
        {},
        {}
    ),
    "PUT /tasks/{taskId}/ai-prompt": (
        "保存任务的自定义AI评分提示词。提示词用于指导AI从特定维度评估提交内容。",
        {"prompt": "请从完整性（30%）、准确性（40%）、格式规范（30%）三个维度对提交内容进行评分，总分100分。"},
        {}
    ),
    "GET /tasks/{taskId}/custom-dimensions": (
        "获取任务的自定义AI评估维度配置。",
        {},
        {}
    ),
    "PUT /tasks/{taskId}/custom-dimensions": (
        "保存任务的自定义AI评估维度，每个维度包含名称和权重。所有维度权重之和应为1。",
        [{"name": "完整性", "weight": 0.3}, {"name": "准确性", "weight": 0.4}, {"name": "格式规范", "weight": 0.3}],
        {}
    ),
    "POST /tasks/{taskId}/submissions/{submissionId}/withdraw": (
        "撤回已提交的文件。需提供提交人姓名进行身份验证。撤回后文件从任务提交列表中移除。",
        {},
        {"submitterName": "张三"}
    ),
    "POST /tasks/{taskId}/submissions/{submissionId}/regrade": (
        "对单个提交重新触发AI评分。评分结果异步返回，可通过ai-progress接口查询进度。",
        {},
        {}
    ),
    "POST /tasks/{taskId}/submissions/batch-regrade": (
        "批量重新触发AI评分，对任务下所有未评分或评分失败的提交重新评分。",
        {},
        {}
    ),
    "PUT /tasks/{taskId}/submissions/{submissionId}/ai-score": (
        "手动设置提交的AI评分结果，用于管理员覆盖或修正AI评分。",
        {"score": 85, "comment": "内容完整，格式规范，但部分细节需要改进。"},
        {}
    ),
    "PUT /tasks/{taskId}/submissions/{submissionId}/admin": (
        "管理员更新提交记录的备注、标签等管理信息。",
        {"adminNote": "已审核", "status": "approved"},
        {}
    ),
    "DELETE /tasks/{taskId}/submissions/{submissionId}/admin": (
        "管理员删除指定提交记录。此操作会同时删除关联的文件。",
        {},
        {}
    ),
    "GET /tasks/{taskId}/submissions/{submissionId}/ai-history": (
        "获取指定提交的AI评分历史记录，包括每次评分的时间、分数、评语等。",
        {},
        {}
    ),
    "GET /tasks/{taskKey}/task-submissions": (
        "通过任务Key获取提交记录，用于公开分享页面展示。",
        {},
        {}
    ),
    "GET /tasks/{taskId}/template": (
        "下载任务的模板文件。任务创建者上传的模板供提交者参考使用。",
        {},
        {}
    ),
    "GET /tasks/{taskId}/info": (
        "获取任务的信息收集配置，包括自定义字段定义。",
        {},
        {}
    ),
    "GET /tasks/{taskId}/info-submissions": (
        "获取信息收集类任务的所有表单提交记录。",
        {},
        {}
    ),
    "POST /tasks/{taskId}/info-submissions/{submissionId}/withdraw": (
        "撤回信息收集类任务的表单提交。",
        {},
        {"submitterName": "张三"}
    ),
    "GET /tasks/{taskId}/info-submissions/export": (
        "导出信息收集任务的提交数据为CSV文件。",
        {},
        {"format": "csv"}
    ),
    "GET /tasks/{taskId}/public-more-info": (
        "获取任务的公开扩展信息，无需认证。用于提交页面展示提示语等。",
        {},
        {}
    ),
    "GET /tasks/{taskId}/ai-progress": (
        "SSE流式接口，实时推送任务AI评分进度。连接后持续接收进度事件直到评分完成。",
        {},
        {}
    ),
    "GET /tasks/all-submissions": (
        "获取当前用户所有任务的提交记录汇总，支持分页和筛选。",
        {},
        {}
    ),
    # ===== 文件管理 =====
    "POST /files/upload": (
        "单文件上传到个人文件库。支持所有文件类型，返回文件ID、URL等信息。文件大小受系统配置限制。",
        {}, {}
    ),
    "POST /files/upload/batch": (
        "批量上传多个文件。一次最多上传10个文件。返回每个文件的上传结果。",
        {}, {}
    ),
    "GET /files": (
        "分页获取当前用户的文件列表。支持按分类、标签、关键词筛选，支持多种排序方式。",
        {}, {"page": "1", "size": "20", "keyword": "", "sortBy": "createdAt", "sortOrder": "desc"}
    ),
    "GET /files/{id}": (
        "获取指定文件的详细信息，包括文件名、大小、类型、URL、标签、分类等。",
        {}, {}
    ),
    "PUT /files/{id}": (
        "更新文件的元数据，包括文件名、分类、标签等。不修改文件内容本身。",
        {"name": "重命名文件.pdf", "categoryId": None, "tags": ["重要", "2026"]}, {}
    ),
    "DELETE /files/{id}": (
        "将文件移入回收站（软删除）。文件在回收站中保留30天后自动永久删除。",
        {}, {}
    ),
    "POST /files/{id}/trash": (
        "将文件移入回收站。与DELETE /files/{id}功能相同，提供POST方式调用。",
        {}, {}
    ),
    "POST /files/{id}/restore": (
        "从回收站恢复文件到正常状态。",
        {}, {}
    ),
    "DELETE /files/{id}/permanent": (
        "永久删除文件，同时从对象存储中删除文件数据。此操作不可撤销。",
        {}, {}
    ),
    "GET /files/{id}/download": (
        "下载指定文件。远程存储时重定向到预签名URL，本地存储时直接流式传输。支持Range请求实现断点续传。",
        {}, {}
    ),
    "GET /files/{id}/preview": (
        "预览文件内容。图片直接返回，PDF/文本流式传输，视频/音频支持Range请求。不支持预览的类型返回下载链接。",
        {}, {}
    ),
    "POST /files/batch/trash": (
        "批量将文件移入回收站。",
        ["file-id-1", "file-id-2"], {}
    ),
    "POST /files/batch/restore": (
        "批量从回收站恢复文件。",
        ["file-id-1", "file-id-2"],
        {}
    ),
    "DELETE /files/batch": (
        "批量软删除文件（移入回收站）。",
        ["file-id-1", "file-id-2"], {}
    ),
    "DELETE /files/batch/permanent": (
        "批量永久删除文件。此操作不可撤销，同时删除对象存储中的文件数据。",
        ["file-id-1", "file-id-2"], {}
    ),
    "DELETE /files/trash/empty": (
        "清空回收站，永久删除当前用户回收站中的所有文件。",
        {}, {}
    ),
    "GET /files/trash": (
        "获取当前用户回收站中的文件列表，支持分页。",
        {}, {"page": "1", "size": "20"}
    ),
    "GET /files/trash/count": (
        "获取当前用户回收站中的文件数量。",
        {}, {}
    ),
    "GET /files/presigned-upload": (
        "获取对象存储预签名上传URL，用于前端直传文件到MinIO/S3。返回uploadUrl和objectName。",
        {}, {"objectName": "tasks/task-key/filename.pdf", "contentType": "application/pdf"}
    ),
    "POST /files/presigned-complete": (
        "前端直传完成后，通知后端记录文件信息到数据库。",
        {"objectName": "tasks/xxx/file.pdf", "originalName": "作业.pdf", "mimeType": "application/pdf", "fileSize": 1048576}, {}
    ),
    "GET /files/upload/token": (
        "获取文件上传凭证（适用于需要Token认证的存储服务）。",
        {}, {}
    ),
    "POST /files/check-submit": (
        "检查文件是否可以提交到指定任务，验证文件类型、大小等限制。",
        {}, {}
    ),
    "POST /files/withdraw": (
        "撤回已提交到任务的文件。",
        {}, {}
    ),
    "POST /files/add": (
        "将已上传的文件添加到文件库（不重新上传）。",
        {}, {}
    ),
    "GET /files/template": (
        "下载文件模板。",
        {}, {}
    ),
    "GET /files/download/{*path}": (
        "通过路径下载文件，支持通配符路径匹配。",
        {}, {}
    ),
    # ===== 文件分类 =====
    "GET /categories": ("获取当前用户的所有文件分类列表。", {}, {}),
    "POST /categories": ("创建新的文件分类。支持嵌套分类（通过parentId指定父分类）。", {"name": "项目文档", "parentId": None, "color": "#4A90E2"}, {}),
    "GET /categories/tree": ("获取文件分类的树形结构，包含所有层级的子分类。", {}, {}),
    "GET /categories/{id}": ("获取指定分类的详细信息。", {}, {}),
    "PUT /categories/{id}": ("更新分类名称、颜色等信息。", {"name": "重命名分类", "color": "#E24A4A"}, {}),
    "DELETE /categories/{id}": ("删除指定分类。分类下的文件不会被删除，文件的分类字段置空。", {}, {}),
    # ===== 文件分享 =====
    "GET /shares": ("获取当前用户创建的所有文件分享列表。", {}, {}),
    "POST /shares": ("创建文件分享链接。支持设置密码、有效期、下载次数限制等。", {"fileIds": ["file-id-1"], "expireTime": "2026-12-31 23:59:59", "password": "", "maxDownloads": 100}, {}),
    "GET /shares/{id}": ("获取指定分享的详细信息，包括分享码、访问统计等。", {}, {}),
    "PUT /shares/{id}": ("更新分享设置，如修改密码、延长有效期等。", {"expireTime": "2027-01-31 23:59:59", "password": "newpass"}, {}),
    "DELETE /shares/{id}": ("删除分享链接，链接立即失效。", {}, {}),
    "GET /shares/{shareCode}/info": ("获取分享链接的公开信息（无需登录），包括文件名、大小、创建者等。", {}, {}),
    "GET /shares/access/{shareCode}": ("访问分享链接，验证密码并获取文件访问权限。", {}, {}),
    "POST /shares/{shareCode}/download": ("通过分享码下载文件。需提供正确密码（如有设置）。", {"password": ""}, {}),
    # ===== 消息管理 =====
    "GET /messages": ("获取当前用户的消息列表，支持分页。包含系统通知、任务提醒等。", {}, {"page": "1", "size": "20"}),
    "GET /messages/unread-count": ("获取当前用户未读消息数量。", {}, {}),
    "PUT /messages/{id}/read": ("将指定消息标记为已读。", {}, {}),
    "PUT /messages/read-all": ("将当前用户所有未读消息标记为已读。", {}, {}),
    "DELETE /messages/{id}": ("删除指定消息。", {}, {}),
    # ===== 搜索管理 =====
    "POST /search": ("全文搜索文件和任务。支持按类型、日期范围等条件筛选。", {"keyword": "期末作业", "type": "file", "page": 1, "size": 20}, {}),
    "GET /search/suggestions": ("获取搜索建议词，基于用户历史搜索和热门关键词。", {}, {"keyword": "期末"}),
    # ===== 分片上传 =====
    "POST /chunks/init": ("初始化分片上传任务，返回uploadId用于后续分片上传。适用于大文件（>100MB）。", {"fileName": "大文件.zip", "fileSize": 524288000, "chunkSize": 5242880, "totalChunks": 100, "mimeType": "application/zip"}, {}),
    "POST /chunks/upload": ("上传单个分片。需提供uploadId、分片序号和分片数据。", {}, {"uploadId": "upload-id-xxx", "chunkIndex": "0"}),
    "POST /chunks/merge": ("所有分片上传完成后，合并分片为完整文件。", {"uploadId": "upload-id-xxx", "fileName": "大文件.zip"}, {}),
    "GET /chunks/list": ("获取已上传的分片列表，用于断点续传时确认已上传的分片。", {}, {"uploadId": "upload-id-xxx"}),
    "GET /chunks/check": ("检查分片上传状态，返回已上传的分片索引列表。", {}, {"uploadId": "upload-id-xxx"}),
    "DELETE /chunks/cancel": ("取消分片上传任务，清理已上传的分片数据。", {}, {"uploadId": "upload-id-xxx"}),
    # ===== AI分类 =====
    "POST /ai/classify": ("使用AI对单个文件进行智能分类。返回推荐的分类标签和置信度。", {"fileId": "file-id-xxx"}, {}),
    "POST /ai/batch-classify": ("批量AI分类，对多个文件同时进行智能分类。", {"fileIds": ["file-id-1", "file-id-2"]}, {}),
    # ===== 统计管理 =====
    "GET /statistics/system": ("获取系统级统计数据，包括存储使用量、用户活跃度等。需管理员权限。", {}, {}),
    "GET /statistics/files": ("获取文件统计数据，包括文件类型分布、上传趋势等。", {}, {}),
    "GET /statistics/architecture": ("获取系统架构信息，包括存储类型、AI服务状态等。需管理员权限。", {}, {}),
    "POST /statistics/ai/retry-pending": ("重试所有待处理的AI评分任务。需管理员权限。", {}, {}),
    "GET /statistics/stream": ("SSE流式接口，实时推送系统统计数据更新。", {}, {}),
    # ===== 管理功能 =====
    "GET /admin/overview": ("获取平台概况统计，包括用户数、任务数、文件数、存储使用量等。需管理员权限。", {}, {}),
    "GET /admin/users": ("分页获取所有用户列表，支持按关键词、状态筛选。需管理员权限。", {}, {"keyword": "", "status": "", "page": "1", "size": "20"}),
    "PUT /admin/users/{id}/status": ("修改用户账号状态（ACTIVE/DISABLED）。禁用后用户无法登录。需管理员权限。", {"status": "DISABLED"}, {}),
    "PUT /admin/users/{id}/role": ("修改用户角色（USER/ADMIN/SUPER_ADMIN）。仅超级管理员可操作。", {"role": "ADMIN"}, {}),
    "PUT /admin/users/{id}/quota": ("修改用户存储配额和任务数量限制。0表示不限制。需管理员权限。", {"storageLimit": 10737418240, "taskLimit": 100}, {}),
    "PUT /admin/users/{id}/phone": ("管理员为用户绑定手机号，无需验证码。需管理员权限。", {"phone": "13800138000"}, {}),
    "POST /admin/users/{id}/reset-password": ("重置用户密码为随机密码，返回新密码。需管理员权限。", {}, {}),
    "POST /admin/users/{id}/message": ("向指定用户发送系统消息。需管理员权限。", {"title": "系统通知", "content": "您的账号已通过审核，欢迎使用云集平台。"}, {}),
    "POST /admin/users/{id}/force-logout": ("强制用户下线，使其所有Token立即失效。需管理员权限。", {}, {}),
    "POST /admin/broadcast-message": ("向所有用户推送全局系统消息。需管理员权限。", {"title": "系统维护通知", "content": "系统将于今晚22:00-24:00进行维护，请提前保存工作。"}, {}),
    "GET /admin/operation-logs": ("获取系统操作日志，记录用户的关键操作。需管理员权限。", {}, {"page": "1", "size": "20"}),
    # ===== 配置管理 =====
    "GET /config/routes": ("获取前端路由配置，用于动态控制页面访问权限。公开接口，无需认证。", {}, {}),
    "GET /config/routes/check": ("检查指定路由是否启用。公开接口。", {}, {"path": "/register"}),
    "GET /config/admin/routes": ("获取所有路由配置（含禁用的）。需管理员权限。", {}, {}),
    "PUT /config/admin/routes/{id}": ("启用或禁用指定路由，可设置重定向URL和提示信息。需管理员权限。", {"isEnabled": True, "redirectUrl": "", "redirectMessage": ""}, {}),
    "GET /config/admin/system": ("获取所有系统配置项列表。需管理员权限。", {}, {}),
    "GET /config/system/{key}": ("获取指定系统配置项的值。公开接口。", {}, {}),
    "PUT /config/admin/system/{id}": ("更新系统配置项的值。需管理员权限。", {"value": "新配置值"}, {}),
    "PUT /config/admin/system/{id}/toggle": ("切换布尔类型系统配置的开关状态。需管理员权限。", {}, {}),
    "GET /config/admin/storage-info": ("获取当前存储配置信息，包括存储类型、MinIO/S3配置等。需管理员权限。", {}, {}),
    "POST /config/admin/storage": ("保存存储配置（本地/MinIO/S3/NAS）。需管理员权限。", {"storageType": "minio", "minioEndpoint": "http://localhost:9000", "minioAccessKey": "minioadmin", "minioSecretKey": "minioadmin", "minioBucket": "idropin"}, {}),
    "POST /config/admin/storage/test": ("测试存储连接是否正常。需管理员权限。", {}, {}),
    "GET /config/admin/ai": ("获取AI服务配置，包括API地址、模型名称等。需管理员权限。", {}, {}),
    "PUT /config/admin/ai": ("批量更新AI服务配置。需管理员权限。", {"ai.base_url": "https://api.openai.com/v1", "ai.chat_model": "gpt-4o-mini"}, {}),
    "POST /config/admin/ai/test": ("测试AI服务连接是否正常。需管理员权限。", {"ai.base_url": "https://api.openai.com/v1", "ai.api_key": "sk-test", "ai.chat_model": "gpt-4o-mini"}, {}),
    "POST /config/admin/restore": ("从备份恢复系统配置。需管理员权限。", {}, {}),
    "POST /config/admin/email/refresh-cache": ("刷新邮件配置缓存，使新配置立即生效。需管理员权限。", {}, {}),
    "GET /config/admin/backup": ("下载系统配置备份文件。需管理员权限。", {}, {}),
    # ===== 需求反馈 =====
    "GET /feedback/my": ("获取当前用户提交的反馈列表。", {}, {}),
    "POST /feedback": ("提交新的需求反馈或问题报告。", {"title": "希望支持批量下载", "content": "目前只能逐个下载文件，希望能支持批量打包下载功能。", "type": "FEATURE"}, {}),
    "GET /feedback/{id}": ("获取指定反馈的详细信息，包括回复记录。", {}, {}),
    "PUT /feedback/{id}": ("更新反馈内容（仅限未处理状态）。", {"title": "更新标题", "content": "更新内容"}, {}),
    "DELETE /feedback/{id}": ("删除指定反馈（仅限自己提交的）。", {}, {}),
    "PUT /feedback/{id}/status": ("管理员更新反馈处理状态（PENDING/PROCESSING/RESOLVED/CLOSED）。需管理员权限。", {"status": "PROCESSING"}, {}),
    "POST /feedback/{id}/reply": ("管理员回复反馈。需管理员权限。", {"content": "感谢您的反馈，我们已将此功能加入开发计划。"}, {}),
    "POST /feedback/{id}/close": ("关闭反馈。", {}, {}),
    "GET /feedback/admin/list": ("管理员获取所有反馈列表，支持按状态筛选。需管理员权限。", {}, {"status": "", "page": "1", "size": "20"}),
    # ===== 其他 =====
    "GET /health": ("健康检查接口，返回服务运行状态。无需认证。", {}, {}),
    "POST /access/log": ("记录前端访问日志，用于统计页面访问量。", {"path": "/tasks/xxx", "action": "view"}, {}),
    "POST /people/status": ("更新人员状态信息。", {}, {}),
    "POST /people/add": ("添加人员到任务。", {}, {}),
    "GET /people": ("获取人员列表。", {}, {}),
    "DELETE /people": ("删除人员。", {}, {}),
    "GET /people/check": ("检查人员状态。", {}, {}),
}

def update_api(api_id, api_obj, description, body_example, query_example):
    payload = dict(api_obj)  # start from full existing object
    if description:
        payload["description"] = description
    # Inject examples into requestBody jsonSchema
    if body_example and payload.get("requestBody") and payload["requestBody"].get("jsonSchema"):
        schema = payload["requestBody"]["jsonSchema"]
        if isinstance(body_example, list):
            schema["example"] = body_example
        else:
            props = schema.get("properties", {})
            for k, v in body_example.items():
                if k in props:
                    props[k]["example"] = v
                else:
                    props[k] = {"example": v}
            schema["properties"] = props
    # Inject query param examples
    if query_example and payload.get("parameters"):
        for param in payload["parameters"]:
            if isinstance(param, dict) and param.get("in") == "query" and param.get("name") in query_example:
                param["example"] = str(query_example[param["name"]])
    r = req("PUT", f"/projects/{PROJECT_ID}/http-apis/{api_id}", json=payload)
    return r.get("success") or r.get("data") is not None

def create_test_case(api_id, name, body, expected_code=200):
    payload = {
        "name": name,
        "request": {"body": {"type": "application/json", "data": json.dumps(body)} if body else {}},
        "assertions": [{"type": "status_code", "expected": expected_code}]
    }
    r = req("POST", f"/projects/{PROJECT_ID}/http-apis/{api_id}/test-cases", json=payload)
    return r

def main():
    data = json.load(open("/tmp/apifox-apis.json"))
    apis = data["data"] if isinstance(data["data"], list) else data["data"].get("items", [])
    print(f"Total APIs: {len(apis)}")

    ok, skip, fail = 0, 0, 0
    for api in apis:
        key = f"{api['method'].upper()} {api['path']}"
        meta = API_META.get(key)
        if not meta:
            print(f"  SKIP (no meta): {key}")
            skip += 1
            continue
        desc, body_ex, query_ex = meta
        success = update_api(api["id"], api, desc, body_ex, query_ex)
        if success:
            print(f"  OK: {key}")
            ok += 1
        else:
            print(f"  FAIL: {key}")
            fail += 1
        time.sleep(0.3)

    print(f"\nDone: {ok} updated, {skip} skipped, {fail} failed")

if __name__ == "__main__":
    main()
