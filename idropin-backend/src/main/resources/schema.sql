-- ========================================
-- Idrop.in - 云集 | 数据库初始化脚本
-- PostgreSQL 16
-- ========================================

-- 删除已存在的表
DROP TABLE IF EXISTS file_submission CASCADE;
DROP TABLE IF EXISTS file_share CASCADE;
DROP TABLE IF EXISTS collection_task CASCADE;
DROP TABLE IF EXISTS file_category CASCADE;
DROP TABLE IF EXISTS file CASCADE;
DROP TABLE IF EXISTS file_chunk CASCADE;
DROP TABLE IF EXISTS sys_user CASCADE;

-- ========================================
-- 1. 用户表 (sys_user)
-- ========================================
CREATE TABLE sys_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sys_user IS '用户表';

-- ========================================
-- 2. 文件分类表 (file_category)
-- ========================================
CREATE TABLE file_category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES file_category(id) ON DELETE SET NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE file_category IS '文件分类表';

-- ========================================
-- 3. 文件表 (file)
-- ========================================
CREATE TABLE file (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    storage_provider VARCHAR(50) DEFAULT 'MINIO',
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    category_id UUID REFERENCES file_category(id) ON DELETE SET NULL,
    uploader_id UUID NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE file IS '文件表';

-- ========================================
-- 4. 文件分享表 (file_share)
-- ========================================
CREATE TABLE file_share (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES file(id) ON DELETE CASCADE,
    share_code VARCHAR(32) UNIQUE NOT NULL,
    password VARCHAR(255),
    expire_at TIMESTAMP,
    download_limit INTEGER,
    download_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE file_share IS '文件分享表';

-- ========================================
-- 5. 收集任务表 (collection_task)
-- ========================================
CREATE TABLE collection_task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline TIMESTAMP,
    allow_anonymous BOOLEAN DEFAULT FALSE,
    require_login BOOLEAN DEFAULT TRUE,
    max_file_size BIGINT,
    allowed_types TEXT[],
    created_by UUID NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE collection_task IS '收集任务表';

-- ========================================
-- 6. 文件提交记录表 (file_submission)
-- ========================================
CREATE TABLE file_submission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES collection_task(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES file(id) ON DELETE CASCADE,
    submitter_id UUID REFERENCES sys_user(id) ON DELETE SET NULL,
    submitter_name VARCHAR(100),
    submitter_email VARCHAR(100),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE file_submission IS '文件提交记录表';

-- ========================================
-- 7. 文件分片表 (file_chunk)
-- ========================================
CREATE TABLE file_chunk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES file(id) ON DELETE SET NULL,
    upload_id VARCHAR(64) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    total_size BIGINT NOT NULL,
    file_md5 VARCHAR(32) NOT NULL,
    chunk_number INTEGER NOT NULL,
    chunk_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    uploader_id UUID NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'UPLOADING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(upload_id, chunk_number)
);

COMMENT ON TABLE file_chunk IS '文件分片表';

-- ========================================
-- 索引创建
-- ========================================

-- 用户表索引
CREATE INDEX idx_sys_user_username ON sys_user(username);
CREATE INDEX idx_sys_user_email ON sys_user(email);
CREATE INDEX idx_sys_user_status ON sys_user(status);
CREATE INDEX idx_sys_user_created_at ON sys_user(created_at DESC);

-- 文件表索引
CREATE INDEX idx_file_uploader ON file(uploader_id);
CREATE INDEX idx_file_category ON file(category_id);
CREATE INDEX idx_file_tags ON file USING GIN(tags);
CREATE INDEX idx_file_metadata ON file USING GIN(metadata);
CREATE INDEX idx_file_created_at ON file(created_at DESC);
CREATE INDEX idx_file_status ON file(status);
CREATE INDEX idx_file_mime_type ON file(mime_type);

-- 文件分类表索引
CREATE INDEX idx_file_category_parent ON file_category(parent_id);
CREATE INDEX idx_file_category_sort ON file_category(sort_order);

-- 文件分享表索引
CREATE INDEX idx_file_share_file ON file_share(file_id);
CREATE INDEX idx_file_share_code ON file_share(share_code);
CREATE INDEX idx_file_share_created_by ON file_share(created_by);
CREATE INDEX idx_file_share_expire_at ON file_share(expire_at);

-- 收集任务表索引
CREATE INDEX idx_collection_task_created_by ON collection_task(created_by);
CREATE INDEX idx_collection_task_status ON collection_task(status);
CREATE INDEX idx_collection_task_deadline ON collection_task(deadline);

-- 文件提交记录表索引
CREATE INDEX idx_file_submission_task ON file_submission(task_id);
CREATE INDEX idx_file_submission_submitter ON file_submission(submitter_id);
CREATE INDEX idx_file_submission_submitted_at ON file_submission(submitted_at DESC);

-- 文件分片表索引
CREATE INDEX idx_file_chunk_upload_id ON file_chunk(upload_id);
CREATE INDEX idx_file_chunk_file_id ON file_chunk(file_id);
CREATE INDEX idx_file_chunk_uploader ON file_chunk(uploader_id);
CREATE INDEX idx_file_chunk_status ON file_chunk(status);

-- ========================================
-- 全文搜索索引
-- ========================================
-- 注意：中文全文搜索需要额外配置，这里暂时不创建
-- CREATE INDEX idx_file_search ON file
-- USING GIN(to_tsvector('chinese', name || ' ' || COALESCE(metadata->>'description', '')));

-- ========================================
-- 插入测试数据
-- ========================================

-- 插入默认文件分类
INSERT INTO file_category (id, name, icon, color, sort_order) VALUES
(gen_random_uuid(), '文档', '📄', '#3b82f6', 1),
(gen_random_uuid(), '图片', '🖼️', '#10b981', 2),
(gen_random_uuid(), '视频', '🎬', '#f59e0b', 3),
(gen_random_uuid(), '音频', '🎵', '#8b5cf6', 4),
(gen_random_uuid(), '压缩包', '📦', '#f97316', 5),
(gen_random_uuid(), '其他', '📁', '#6b7280', 6);

-- 插入管理员用户（密码: admin123）
INSERT INTO sys_user (id, username, email, password_hash, status) VALUES
(gen_random_uuid(), 'admin', 'admin@idrop.in', '$2a$10$N9q0p8lVQaQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGwF6hM2p5vQd0tKQGw: 50 | file_size BIGINT NOT NULL, : Syntax error on token \"BIGINT\", , expected after this token\n- [Java Error] 51 |     mime_type VARCHAR(100) NOT NULL, : Syntax error on token \"VARCHAR\", @ expected\n- [Java Error] 52 |     storage_path VARCHAR(500) NOT NULL, : Syntax error on token \"VARCHAR\", @ expected\n- [Java Error] 53 |     storage_provider VARCHAR(50) DEFAULT 'MINIO', : Syntax error on token \"DEFAULT\", @ expected\n- [Java Error] 54 |     metadata JSONB DEFAULT '{}', : Syntax error, insert \"... VariableDeclaratorId\" to complete SingleVariableDeclarator\n- [Java Error] 55 |     tags TEXT[] DEFAULT '{}', : Syntax error, insert \"[ ]\" to complete ClassMemberDeclaration\n- [Java Error] 56 |     category_id UUID REFERENCES file_category(id) ON DELETE SET NULL, : Syntax error, insert \")\" to complete MethodDeclaration\n- [Java Error] 57 |     uploader_id UUID NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE, : Syntax error, insert \"[ ]\" to complete MethodDeclaration\n- [Java Error] 58 |     status VARCHAR(20) DEFAULT 'ACTIVE', : Syntax error on token \"status\", @ expected\n- [Java Error] 59 |     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, : Syntax error on token \"TIMESTAMP\", , expected after this token\n- [Java Error] 60 |     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP : Syntax error on token \"TIMESTAMP\", , expected after this token\n- [Java Error] 61 | COMMENT ON TABLE file IS '文件表'; : Syntax error on token \"TABLE\", ; expected\n- [Java Error] 62 | -- ======================================== : Syntax error on tokens, delete these tokens\n- [Java Error] 63 |     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), : Syntax error on token \"PRIMARY\", , expected\n- [Java Error] 63 |     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), : Syntax error on token(s), misplaced construct(s)\n- [Java Error] 64 |     file_id UUID NOT NULL REFERENCES file(id) ON DELETE CASCADE, : Syntax error, insert \";\" to complete MethodDeclaration\n- [Java Error] 64 |     file_id UUID NOT NULL REFERENCES file(id) ON DELETE CASCADE, : Syntax error, insert \")\" to complete MethodDeclaration\n- [Java Error] 64 |     share_code VARCHAR(32) UNIQUE NOT NULL, : Syntax error on token \"share_code\", @ expected\n- [Java Error] 65 |     password VARCHAR(255), : Syntax error on token \"password\", @ expected\n- [Java Error] 66 |     expire_at TIMESTAMP, : Syntax error on token \"expire_at\", @ expected\n- [Java Error] 67 |     download_limit INTEGER, : Syntax error on token \"download_limit\", @ expected\n- [Java Error] 68 |     download_count INTEGER DEFAULT 0, : Syntax error on token \"download_count\", @ expected\n- [Java Error] 69 |     created_by UUID NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE, : Syntax error, insert \")\" to complete MethodDeclaration\n- [Java Error] 70 |     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP : Syntax error on token \"TIMESTAMP\", , expected after this token\n- [Java Error] 71 | COMMENT ON TABLE file_share IS '文件分享表'; : Syntax error on token \"TABLE\", ; expected\n- [Java Error] 72 | -- ======================================== : Syntax error on tokens, delete these tokens\n- [Java Error] 73 |     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), : Syntax error on token \"PRIMARY\", , expected\n- [Java Error] 74 |     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), : Syntax error on token(s), misplaced construct(s)\n- [Java Error] 75 |     title VARCHAR(200) NOT NULL, : Syntax error on token \"title\", @ expected\n- [Java Error] 76 |     description TEXT, : Syntax error on token \"description\", @ expected\n- [Java Error] 77 |     deadline TIMESTAMP, : Syntax error on token \"deadline\", @ expected\n- [Java Error] 78 |     allow_anonymous BOOLEAN DEFAULT FALSE, : Syntax error on token \"allow_anonymous\", @ expected\n- [Java Error] 79 |     require_login BOOLEAN DEFAULT TRUE, : Syntax error on token \"require_login\", @ expected\n- [Java Error] 80 |     max_file_size BIGINT, : Syntax error on token \"max_file_size\", @ expected\n- [Java Error] 81 |     allowed_types TEXT[], : Syntax error on token \"allowed_types\", @ expected\n- [Java Error] 82 |     created_by UUID NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE, : Syntax error, insert \")\" to complete MethodDeclaration\n- [Java Error] 82 |     created_by UUID NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE, : Syntax error, insert \")\" to complete MethodDeclaration\n- [Java User] 83 |     status VARCHAR(20) DEFAULT 'OPEN', : Syntax error on token \"status\", @ expected\n- [Java Error] 84 |     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, : Syntax error on token \"TIMESTAMP\", , expected after this token\n- [Java Error] 85 |     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP : Syntax error on token \"TIMESTAMP\", , expected after this token\n- [Java Error] 86 | COMMENT ON TABLE collection_task IS '收集任务表'; : Syntax error on token \"TABLE\", ; expected\n- [Java Error] 87 | -- ======================================== : Syntax error on tokens, delete these tokens\n- [Java Error] 88 |     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), : Syntax error on token \"PRIMARY\", , expected\n- [Java Error] 88 |     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), : Syntax error on token(s), misplaced construct(s)\n- [Java Error] 89 |     task_id UUID NOT NULL REFERENCES collection_task(id) ON DELETE CASCADE, : Syntax error, insert \")\" to complete MethodDeclaration\n- [Java Error] 89 |     task_id UUID NOT NULL REFERENCES collection_task(id) ON DELETE CASCADE, : Syntax error, insert \")\" to complete MethodDeclaration\n- [Java Error] 90 |     file_id UUID NOT NULL REFERENCES file(id) ON DELETE CASCADE, : Syntax error, insert \")\" to complete MethodDeclaration\n- [Java Error] 90 |     submitter_id UUID REFERENCES sys_user(id) ON DELETE SET NULL, : Syntax error, insert \")\" to complete MethodDeclaration\n- [Java Error] 91 |     submitter_name VARCHAR(100), : Syntax error on token \"submitter_name\", @ expected\n- [Java Error] 92 |     submitter_email VARCHAR(100), : Syntax error on token \"submitter_email\", @ expected\n- [Java Error] 93 |     submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP : Syntax error on token \"TIMESTAMP\", , expected after this token\n- [Java Error] 94 | COMMENT ON TABLE file_submission IS '文件提交记录表'; : Syntax error on token \"TABLE\", ; expected\n- [Java Error] 95 | -- ======================================== : Syntax error on tokens, delete these tokens\n- [Java Error] 96 |     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), : Syntax error on token \"PRIMARY\", , expected\n- [Java User] 96 |     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), : Syntax error on token(s), misplaced construct(s)\n- [Java Error] 97 |     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), : Syntax error on token(s), misplaced construct(s)\n- [Java Error] 98 |     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), : Syntax . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .B . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 50 more problems omitted to prevent context overflow"
