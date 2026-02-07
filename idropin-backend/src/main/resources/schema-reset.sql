-- ============================================
-- iDrop.in Database Schema Reset Script
-- All IDs use VARCHAR(36) to match Java String type
-- Generated based on entity classes
-- ============================================

-- Drop all tables in correct order (handle foreign keys)
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

-- ============================================
-- 1. sys_user - 用户表
-- ============================================
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
    storage_limit BIGINT DEFAULT 10737418240,
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

-- ============================================
-- 2. file_category - 文件分类表
-- ============================================
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

-- ============================================
-- 3. file - 文件表
-- ============================================
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
    uploader_id VARCHAR(36),  -- NULL allowed for anonymous uploads
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_uploader ON file(uploader_id);
CREATE INDEX idx_file_category ON file(category_id);
CREATE INDEX idx_file_status ON file(status);
CREATE INDEX idx_file_mime_type ON file(mime_type);
CREATE INDEX idx_file_created_at ON file(created_at DESC);
CREATE INDEX idx_file_tags ON file USING GIN(tags);
CREATE INDEX idx_file_metadata ON file USING GIN(metadata);

-- ============================================
-- 4. file_chunk - 文件分片表
-- ============================================
CREATE TABLE file_chunk (
    id VARCHAR(36) PRIMARY KEY,
    file_id VARCHAR(36),
    upload_id VARCHAR(64) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    total_size BIGINT NOT NULL,
    file_md5 VARCHAR(32) NOT NULL,
    chunk_number INTEGER NOT NULL,
    chunk_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    uploader_id VARCHAR(36),  -- NULL allowed for anonymous
    status VARCHAR(20) DEFAULT 'UPLOADING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(upload_id, chunk_number)
);

CREATE INDEX idx_file_chunk_file_id ON file_chunk(file_id);
CREATE INDEX idx_file_chunk_upload_id ON file_chunk(upload_id);
CREATE INDEX idx_file_chunk_uploader ON file_chunk(uploader_id);
CREATE INDEX idx_file_chunk_status ON file_chunk(status);

-- ============================================
-- 5. file_share - 文件分享表
-- ============================================
CREATE TABLE file_share (
    id VARCHAR(36) PRIMARY KEY,
    file_id VARCHAR(36) NOT NULL,
    share_code VARCHAR(32) NOT NULL UNIQUE,
    password VARCHAR(255),
    expire_at TIMESTAMP,
    download_limit INTEGER,
    download_count INTEGER DEFAULT 0,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_share_code ON file_share(share_code);
CREATE INDEX idx_file_share_file ON file_share(file_id);
CREATE INDEX idx_file_share_created_by ON file_share(created_by);
CREATE INDEX idx_file_share_expire_at ON file_share(expire_at);

-- ============================================
-- 6. collection_task - 收集任务表
-- ============================================
CREATE TABLE collection_task (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline TIMESTAMP,
    allow_anonymous BOOLEAN DEFAULT TRUE,
    require_login BOOLEAN DEFAULT FALSE,
    max_file_size BIGINT,
    allowed_types TEXT[],
    max_file_count INTEGER DEFAULT 10,
    created_by VARCHAR(36) NOT NULL,
    status VARCHAR(20) DEFAULT 'OPEN',
    task_type VARCHAR(50),
    collection_type VARCHAR(20) DEFAULT 'FILE',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_collection_task_created_by ON collection_task(created_by);
CREATE INDEX idx_collection_task_status ON collection_task(status);
CREATE INDEX idx_collection_task_deadline ON collection_task(deadline);
CREATE INDEX idx_collection_task_deleted ON collection_task(deleted);

-- ============================================
-- 7. file_submission - 文件提交记录表
-- ============================================
CREATE TABLE file_submission (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL,
    file_id VARCHAR(36) NOT NULL,
    submitter_id VARCHAR(36),  -- NULL allowed for anonymous
    submitter_name VARCHAR(100),
    submitter_email VARCHAR(100),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitter_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_file_submission_task ON file_submission(task_id);
CREATE INDEX idx_file_submission_submitter ON file_submission(submitter_id);
CREATE INDEX idx_file_submission_submitted_at ON file_submission(submitted_at DESC);
CREATE INDEX idx_file_submission_ip ON file_submission(submitter_ip);
CREATE INDEX idx_file_submission_created_at ON file_submission(created_at);

-- ============================================
-- 8. task_submission - 任务提交记录表(信息收集)
-- ============================================
CREATE TABLE task_submission (
    id VARCHAR(36) PRIMARY KEY,
    task_key VARCHAR(36) NOT NULL,
    file_name VARCHAR(255),
    file_hash VARCHAR(64),
    file_size BIGINT,
    submitter_name VARCHAR(100),
    submitter_email VARCHAR(100),
    submit_info TEXT,
    info_data TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitter_id VARCHAR(36),
    submitter_ip VARCHAR(45),
    status INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_submission_task_key ON task_submission(task_key);
CREATE INDEX idx_task_submission_submitter ON task_submission(submitter_name);
CREATE INDEX idx_task_submission_submitted_at ON task_submission(submitted_at DESC);

-- ============================================
-- 9. task_more_info - 任务更多信息表
-- ============================================
CREATE TABLE task_more_info (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL,
    ddl VARCHAR(255),
    tip TEXT,
    info TEXT,
    people BOOLEAN DEFAULT FALSE,
    format VARCHAR(100),
    template VARCHAR(500),
    bind_field VARCHAR(100),
    rewrite BOOLEAN DEFAULT FALSE,
    auto_rename BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_more_info_task ON task_more_info(task_id);

-- ============================================
-- 10. people_list - 人员名单表
-- ============================================
CREATE TABLE people_list (
    id VARCHAR(36) PRIMARY KEY,
    people_name VARCHAR(100) NOT NULL,
    admin_username VARCHAR(50),
    parent_name VARCHAR(100),
    child_name VARCHAR(100),
    status INTEGER DEFAULT 0,
    last_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_people_list_name ON people_list(people_name);
CREATE INDEX idx_people_list_admin ON people_list(admin_username);

-- ============================================
-- 11. sys_access_log - 访问日志表
-- ============================================
CREATE TABLE sys_access_log (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_path VARCHAR(500),
    request_method VARCHAR(10),
    referer VARCHAR(500),
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_access_log_user ON sys_access_log(user_id);
CREATE INDEX idx_access_log_ip ON sys_access_log(ip_address);
CREATE INDEX idx_access_log_created_at ON sys_access_log(created_at DESC);

-- ============================================
-- 12. password_reset_token - 密码重置令牌表
-- ============================================
CREATE TABLE password_reset_token (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_user ON password_reset_token(user_id);
CREATE INDEX idx_password_reset_token ON password_reset_token(token);

-- ============================================
-- 13. sys_feedback - 反馈表
-- ============================================
CREATE TABLE sys_feedback (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    type VARCHAR(50),
    content TEXT NOT NULL,
    contact VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_user ON sys_feedback(user_id);
CREATE INDEX idx_feedback_status ON sys_feedback(status);

-- ============================================
-- 14. sys_feedback_reply - 反馈回复表
-- ============================================
CREATE TABLE sys_feedback_reply (
    id VARCHAR(36) PRIMARY KEY,
    feedback_id VARCHAR(36) NOT NULL,
    admin_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_reply_feedback ON sys_feedback_reply(feedback_id);

-- ============================================
-- 15. sys_message - 消息表
-- ============================================
CREATE TABLE sys_message (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_message_user ON sys_message(user_id);
CREATE INDEX idx_message_read ON sys_message(is_read);

-- ============================================
-- 16. sys_operation_log - 操作日志表
-- ============================================
CREATE TABLE sys_operation_log (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    operation VARCHAR(100),
    method VARCHAR(10),
    params TEXT,
    ip VARCHAR(45),
    status INTEGER,
    error_msg TEXT,
    duration BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operation_log_user ON sys_operation_log(user_id);
CREATE INDEX idx_operation_log_created_at ON sys_operation_log(created_at DESC);

-- ============================================
-- 17. sys_route_config - 路由配置表
-- ============================================
CREATE TABLE sys_route_config (
    id VARCHAR(36) PRIMARY KEY,
    path VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    component VARCHAR(255),
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    visible BOOLEAN DEFAULT TRUE,
    parent_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Insert test user (password: 891124wyh)
-- BCrypt hash of 891124wyh
-- ============================================
INSERT INTO sys_user (id, username, email, password_hash, status, role, storage_limit, storage_used, task_limit)
VALUES (
    '045f379896b5ac50752fde29f1836028',
    'mdo',
    'mdo@example.com',
    '$2a$10$4slin12C7dUvhTx96zrJ6O6/ZdT0exews1YtprKnpef/rAJR2cyTS',
    'ACTIVE',
    'ADMIN',
    10737418240,
    0,
    100
);

-- Create a test collection task
INSERT INTO collection_task (id, title, description, allow_anonymous, require_login, max_file_count, created_by, status, collection_type)
VALUES (
    'XV7TCJ',
    '测试收集任务',
    '这是一个测试任务，用于验证文件收集功能',
    TRUE,
    FALSE,
    10,
    '045f379896b5ac50752fde29f1836028',
    'OPEN',
    'FILE'
);

SELECT 'Schema reset complete!' as status;
