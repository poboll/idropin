-- ========================================
-- 访问日志表 - PV/UV统计
-- PostgreSQL 16
-- ========================================

-- 访问日志表
CREATE TABLE IF NOT EXISTS sys_access_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(36), -- 用户ID，未登录为NULL
    ip_address VARCHAR(50) NOT NULL,
    user_agent TEXT,
    request_path VARCHAR(500) NOT NULL,
    request_method VARCHAR(10),
    referer VARCHAR(500),
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE SET NULL
);

COMMENT ON TABLE sys_access_log IS '访问日志表 - 用于PV/UV统计';
COMMENT ON COLUMN sys_access_log.user_id IS '用户ID，未登录为NULL';
COMMENT ON COLUMN sys_access_log.session_id IS '会话ID，用于UV统计';

-- 访问日志索引
CREATE INDEX IF NOT EXISTS idx_access_log_user ON sys_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_ip ON sys_access_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_access_log_session ON sys_access_log(session_id);
CREATE INDEX IF NOT EXISTS idx_access_log_created_at ON sys_access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_log_date ON sys_access_log(DATE(created_at));
