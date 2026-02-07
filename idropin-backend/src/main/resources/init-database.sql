-- ========================================
-- Idrop.in - 云集 | 数据库初始化脚本（公开版本）
-- PostgreSQL 16
-- ========================================
-- 本脚本适用于其他开发者快速搭建开发环境
-- 包含：完整表结构 + 示例数据（无隐私信息）
-- ========================================

-- ========================================
-- 删除已存在的表（按依赖关系顺序）
-- ========================================
DROP TABLE IF EXISTS file_submission CASCADE;
DROP TABLE IF EXISTS task_submission CASCADE;
DROP TABLE IF EXISTS task_more_info CASCADE;
DROP TABLE IF EXISTS people_list CASCADE;
DROP TABLE IF EXISTS file_share CASCADE;
DROP TABLE IF EXISTS file_chunk CASCADE;
DROP TABLE IF EXISTS file CASCADE;
DROP TABLE IF EXISTS file_category CASCADE;
DROP TABLE IF EXISTS collection_task CASCADE;
DROP TABLE IF EXISTS sys_access_log CASCADE;
DROP TABLE IF EXISTS password_reset_token CASCADE;
DROP TABLE IF EXISTS sys_operation_log CASCADE;
DROP TABLE IF EXISTS sys_feedback_reply CASCADE;
DROP TABLE IF EXISTS sys_feedback CASCADE;
DROP TABLE IF EXISTS sys_message CASCADE;
DROP TABLE IF EXISTS sys_route_config CASCADE;
DROP TABLE IF EXISTS sys_user CASCADE;

-- ========================================
-- 1. sys_user - 用户表
-- ========================================
CREATE TABLE sys_user (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    metadata TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    role VARCHAR(20) DEFAULT 'USER',
    phone VARCHAR(20),
    storage_limit BIGINT DEFAULT 10737418240,  -- 10GB默认存储限额
    storage_used BIGINT DEFAULT 0,
    task_limit INTEGER DEFAULT 100,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sys_user_username ON sys_user(username);
CREATE INDEX idx_sys_user_email ON sys_user(email);
CREATE INDEX idx_sys_user_status ON sys_user(status);

COMMENT ON TABLE sys_user IS '���户表';
COMMENT ON COLUMN sys_user.storage_limit IS '存储空间限额（字节）';
COMMENT ON COLUMN sys_user.storage_used IS '已使用存储空间（字节）';
COMMENT ON COLUMN sys_user.task_limit IS '可创建的最大任务数';

-- ========================================
-- 2. file_category - 文件分类表
-- ========================================
CREATE TABLE file_category (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id VARCHAR(36),
    user_id VARCHAR(36),
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_category_parent ON file_category(parent_id);
CREATE INDEX idx_file_category_user ON file_category(user_id);
CREATE INDEX idx_file_category_sort ON file_category(sort_order);

COMMENT ON TABLE file_category IS '文件分类表';

-- ========================================
-- 3. file - 文件表
-- ========================================
CREATE TABLE file (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'MINIO',
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    category_id VARCHAR(36),
    uploader_id VARCHAR(36),  -- 允许NULL（匿名上传）
    status VARCHAR(20) DEFAULT 'ACTIVE',
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_uploader ON file(uploader_id);
CREATE INDEX idx_file_category ON file(category_id);
CREATE INDEX idx_file_status ON file(status);
CREATE INDEX idx_file_deleted ON file(deleted) WHERE deleted = TRUE;
CREATE INDEX idx_file_mime_type ON file(mime_type);
CREATE INDEX idx_file_created_at ON file(created_at DESC);
CREATE INDEX idx_file_tags ON file USING GIN(tags);
CREATE INDEX idx_file_metadata ON file USING GIN(metadata);

COMMENT ON TABLE file IS '文件表';
COMMENT ON COLUMN file.deleted IS '软删除标记';

-- ========================================
-- 4. file_chunk - 文件分片表
-- ========================================
CREATE TABLE file_chunk (
    id VARCHAR(36) PRIMARY KEY,
    file_id VARCHAR(36) NOT NULL,
    chunk_number INTEGER NOT NULL,
    chunk_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    md5_hash VARCHAR(32),
    status VARCHAR(20) DEFAULT 'UPLOADED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_chunk_file ON file_chunk(file_id);
CREATE INDEX idx_file_chunk_number ON file_chunk(file_id, chunk_number);

COMMENT ON TABLE file_chunk IS '文件分片表（用于大文件分片上传）';

-- ========================================
-- 5. file_share - 文件分享表
-- ========================================
CREATE TABLE file_share (
    id VARCHAR(36) PRIMARY KEY,
    file_id VARCHAR(36) NOT NULL,
    share_code VARCHAR(32) UNIQUE NOT NULL,
    password VARCHAR(255),
    expire_at TIMESTAMP,
    download_limit INTEGER,
    download_count INTEGER DEFAULT 0,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_share_file ON file_share(file_id);
CREATE INDEX idx_file_share_code ON file_share(share_code);
CREATE INDEX idx_file_share_creator ON file_share(created_by);

COMMENT ON TABLE file_share IS '文件分享表';

-- ========================================
-- 6. collection_task - 收集任务表
-- ========================================
CREATE TABLE collection_task (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline TIMESTAMP,
    limit_one_per_device BOOLEAN DEFAULT TRUE,
    require_login BOOLEAN DEFAULT FALSE,
    max_file_size BIGINT,
    allowed_types TEXT[],
    max_file_count INTEGER DEFAULT 10,
    creator_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_collection_task_creator ON collection_task(creator_id);
CREATE INDEX idx_collection_task_status ON collection_task(status);
CREATE INDEX idx_collection_task_deleted ON collection_task(deleted) WHERE deleted = FALSE;
CREATE INDEX idx_collection_task_deadline ON collection_task(deadline);

COMMENT ON TABLE collection_task IS '收集任务表';
COMMENT ON COLUMN collection_task.deleted IS '软删除标记（回收站功能）';

-- ========================================
-- 7. task_more_info - 任务扩展信息表
-- ========================================
CREATE TABLE task_more_info (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL UNIQUE,
    settings JSONB DEFAULT '{}',
    statistics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_more_info_task ON task_more_info(task_id);

COMMENT ON TABLE task_more_info IS '任务扩展信息表';

-- ========================================
-- 8. people_list - 提���人员名单表
-- ========================================
CREATE TABLE people_list (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    identifier VARCHAR(100),
    contact VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_people_list_task ON people_list(task_id);
CREATE INDEX idx_people_list_identifier ON people_list(identifier);

COMMENT ON TABLE people_list IS '提交人员名单表';

-- ========================================
-- 9. file_submission - 文件提交表
-- ========================================
CREATE TABLE file_submission (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL,
    file_id VARCHAR(36) NOT NULL,
    submitter_name VARCHAR(100),
    submitter_id VARCHAR(100),
    submitter_ip VARCHAR(50),
    device_fingerprint VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'SUBMITTED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_submission_task ON file_submission(task_id);
CREATE INDEX idx_file_submission_file ON file_submission(file_id);
CREATE INDEX idx_file_submission_submitter ON file_submission(submitter_id);

COMMENT ON TABLE file_submission IS '文件提交表';

-- ========================================
-- 10. task_submission - 任务提交记录表
-- ========================================
CREATE TABLE task_submission (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL,
    submitter_info JSONB,
    files JSONB,
    device_fingerprint VARCHAR(255),
    ip_address VARCHAR(50),
    status VARCHAR(20) DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_submission_task ON task_submission(task_id);
CREATE INDEX idx_task_submission_device ON task_submission(device_fingerprint);

COMMENT ON TABLE task_submission IS '任务提交记录表';

-- ========================================
-- 11. sys_message - 系统消息表
-- ========================================
CREATE TABLE sys_message (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    type VARCHAR(20) DEFAULT 'SYSTEM',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sys_message_user ON sys_message(user_id);
CREATE INDEX idx_sys_message_read ON sys_message(is_read);

COMMENT ON TABLE sys_message IS '系统消息表';

-- ========================================
-- 12. sys_feedback - 用户反馈表
-- ========================================
CREATE TABLE sys_feedback (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    email VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT[],
    status VARCHAR(20) DEFAULT 'PENDING',
    priority VARCHAR(20) DEFAULT 'NORMAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sys_feedback_user ON sys_feedback(user_id);
CREATE INDEX idx_sys_feedback_status ON sys_feedback(status);
CREATE INDEX idx_sys_feedback_category ON sys_feedback(category);

COMMENT ON TABLE sys_feedback IS '用户反馈表';

-- ========================================
-- 13. sys_feedback_reply - 反馈回复表
-- ========================================
CREATE TABLE sys_feedback_reply (
    id VARCHAR(36) PRIMARY KEY,
    feedback_id VARCHAR(36) NOT NULL,
    admin_id VARCHAR(36),
    content TEXT NOT NULL,
    is_admin_reply BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sys_feedback_reply_feedback ON sys_feedback_reply(feedback_id);

COMMENT ON TABLE sys_feedback_reply IS '反馈回复表';

-- ========================================
-- 14. sys_operation_log - 操作日志表
-- ========================================
CREATE TABLE sys_operation_log (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    operation VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    request_params JSONB,
    response_result JSONB,
    execution_time INTEGER,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sys_operation_log_user ON sys_operation_log(user_id);
CREATE INDEX idx_sys_operation_log_module ON sys_operation_log(module);
CREATE INDEX idx_sys_operation_log_created ON sys_operation_log(created_at DESC);

COMMENT ON TABLE sys_operation_log IS '系统操作日志表';

-- ========================================
-- 15. sys_access_log - 访问日志表
-- ========================================
CREATE TABLE sys_access_log (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    ip_address VARCHAR(50),
    user_agent TEXT,
    request_url VARCHAR(500),
    request_method VARCHAR(10),
    response_status INTEGER,
    response_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sys_access_log_user ON sys_access_log(user_id);
CREATE INDEX idx_sys_access_log_ip ON sys_access_log(ip_address);
CREATE INDEX idx_sys_access_log_created ON sys_access_log(created_at DESC);

COMMENT ON TABLE sys_access_log IS '系统访问日志表';

-- ========================================
-- 16. password_reset_token - 密码重置令牌表
-- ========================================
CREATE TABLE password_reset_token (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_token_user ON password_reset_token(user_id);
CREATE INDEX idx_password_reset_token_token ON password_reset_token(token);

COMMENT ON TABLE password_reset_token IS '密码重置令牌表';

-- ========================================
-- 17. sys_route_config - 路由配置表
-- ========================================
CREATE TABLE sys_route_config (
    id VARCHAR(36) PRIMARY KEY,
    route_path VARCHAR(255) NOT NULL UNIQUE,
    config JSONB NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sys_route_config_path ON sys_route_config(route_path);

COMMENT ON TABLE sys_route_config IS '系统路由配置表';

-- ========================================
-- 示例数据（开发环境使用）
-- ========================================

-- 插入示例管理员用户
-- 密码: admin123 (BCrypt加密后的哈希值)
INSERT INTO sys_user (id, username, email, password_hash, role, status)
VALUES 
    ('admin-user-001', 'admin', 'admin@idropin.example', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', 'ADMIN', 'ACTIVE'),
    ('demo-user-001', 'demo', 'demo@idropin.example', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', 'USER', 'ACTIVE');

-- 插入示例文件分类
INSERT INTO file_category (id, name, icon, color, sort_order)
VALUES 
    ('cat-001', '文档', '📄', '#3B82F6', 1),
    ('cat-002', '图片', '🖼️', '#10B981', 2),
    ('cat-003', '视频', '🎬', '#EF4444', 3),
    ('cat-004', '音频', '🎵', '#F59E0B', 4),
    ('cat-005', '压缩包', '📦', '#8B5CF6', 5),
    ('cat-006', '其他', '📎', '#6B7280', 6);

-- 插入示例收集任务
INSERT INTO collection_task (id, title, description, creator_id, deadline, status)
VALUES 
    ('task-001', '期末作业提交', '请在截止日期前提交你的期末作业文件', 'admin-user-001', CURRENT_TIMESTAMP + INTERVAL '7 days', 'ACTIVE'),
    ('task-002', '项目文档收集', '提交项目相关文档和设计稿', 'admin-user-001', CURRENT_TIMESTAMP + INTERVAL '14 days', 'ACTIVE');

-- 插入示例任务��展信息
INSERT INTO task_more_info (id, task_id, settings, statistics)
VALUES 
    ('info-001', 'task-001', '{"allowAnonymous": false, "notifyOnSubmit": true}', '{"totalSubmissions": 0, "totalFiles": 0}'),
    ('info-002', 'task-002', '{"allowAnonymous": true, "notifyOnSubmit": false}', '{"totalSubmissions": 0, "totalFiles": 0}');

-- ========================================
-- 完成
-- ========================================

-- 验证表创建
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 显示统计信息
SELECT 
    'sys_user' AS table_name, COUNT(*) AS record_count FROM sys_user
UNION ALL
SELECT 'file_category', COUNT(*) FROM file_category
UNION ALL
SELECT 'collection_task', COUNT(*) FROM collection_task;
