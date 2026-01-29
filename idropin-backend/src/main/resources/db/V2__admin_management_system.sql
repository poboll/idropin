-- ========================================
-- Admin Management System - 数据库迁移脚本
-- PostgreSQL 16
-- ========================================

-- ========================================
-- 1. 站内消息表 (sys_message)
-- ========================================
CREATE TABLE IF NOT EXISTS sys_message (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    sender_type VARCHAR(20) NOT NULL, -- 'admin' | 'system'
    sender_id VARCHAR(36), -- 管理员ID，系统消息为NULL
    recipient_id VARCHAR(36) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES sys_user(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES sys_user(id) ON DELETE SET NULL
);

COMMENT ON TABLE sys_message IS '站内消息表';
COMMENT ON COLUMN sys_message.sender_type IS '发送者类型: admin-管理员, system-系统';
COMMENT ON COLUMN sys_message.is_read IS '是否已读';

-- 消息表索引
CREATE INDEX IF NOT EXISTS idx_message_recipient ON sys_message(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_read ON sys_message(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_message_created_at ON sys_message(created_at DESC);

-- ========================================
-- 2. 需求反馈表 (sys_feedback)
-- ========================================
CREATE TABLE IF NOT EXISTS sys_feedback (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    contact VARCHAR(100), -- 联系方式
    status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'in_progress' | 'resolved' | 'closed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE
);

COMMENT ON TABLE sys_feedback IS '需求反馈表';
COMMENT ON COLUMN sys_feedback.status IS '状态: pending-待处理, in_progress-处理中, resolved-已解决, closed-已关闭';

-- 反馈表索引
CREATE INDEX IF NOT EXISTS idx_feedback_user ON sys_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON sys_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON sys_feedback(created_at DESC);

-- ========================================
-- 3. 反馈回复表 (sys_feedback_reply)
-- ========================================
CREATE TABLE IF NOT EXISTS sys_feedback_reply (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    feedback_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES sys_feedback(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE
);

COMMENT ON TABLE sys_feedback_reply IS '反馈回复表';
COMMENT ON COLUMN sys_feedback_reply.is_admin IS '是否为管理员回复';

-- 回复表索引
CREATE INDEX IF NOT EXISTS idx_reply_feedback ON sys_feedback_reply(feedback_id);
CREATE INDEX IF NOT EXISTS idx_reply_created_at ON sys_feedback_reply(created_at);

-- ========================================
-- 4. 路由配置表 (sys_route_config)
-- ========================================
CREATE TABLE IF NOT EXISTS sys_route_config (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    route_path VARCHAR(100) NOT NULL UNIQUE,
    route_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    redirect_url VARCHAR(200),
    redirect_message VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sys_route_config IS '路由配置表';
COMMENT ON COLUMN sys_route_config.is_enabled IS '是否启用';

-- 路由配置初始数据
INSERT INTO sys_route_config (id, route_path, route_name, is_enabled, redirect_url, redirect_message) VALUES
    (gen_random_uuid()::text, '/register', '用户注册', TRUE, '/disabled', '注册功能已关闭'),
    (gen_random_uuid()::text, '/', '首页', TRUE, '/disabled', '首页已关闭'),
    (gen_random_uuid()::text, '/reset-password', '找回密码', TRUE, '/disabled', '找回密码功能已关闭')
ON CONFLICT (route_path) DO NOTHING;

-- ========================================
-- 5. 操作日志表 (sys_operation_log)
-- ========================================
CREATE TABLE IF NOT EXISTS sys_operation_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    operator_id VARCHAR(36) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(36),
    description TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (operator_id) REFERENCES sys_user(id) ON DELETE CASCADE
);

COMMENT ON TABLE sys_operation_log IS '操作日志表';
COMMENT ON COLUMN sys_operation_log.operation_type IS '操作类型';
COMMENT ON COLUMN sys_operation_log.target_type IS '目标类型';

-- 操作日志索引
CREATE INDEX IF NOT EXISTS idx_oplog_operator ON sys_operation_log(operator_id);
CREATE INDEX IF NOT EXISTS idx_oplog_time ON sys_operation_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oplog_type ON sys_operation_log(operation_type);

-- ========================================
-- 6. 更新用户表，添加管理员相关字段
-- ========================================
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'USER';
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 10737418240; -- 10GB
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0;
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS task_limit INTEGER DEFAULT 100;
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE sys_user ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(50);

COMMENT ON COLUMN sys_user.role IS '用户角色: USER-普通用户, ADMIN-管理员, SUPER_ADMIN-超级管理员';
COMMENT ON COLUMN sys_user.storage_limit IS '存储配额(字节)';
COMMENT ON COLUMN sys_user.storage_used IS '已使用存储(字节)';
COMMENT ON COLUMN sys_user.task_limit IS '任务数量限制';

-- 创建角色索引
CREATE INDEX IF NOT EXISTS idx_sys_user_role ON sys_user(role);
