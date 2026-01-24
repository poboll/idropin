-- 创建密码重置令牌表
CREATE TABLE IF NOT EXISTS password_reset_token (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX idx_password_reset_token_user_id ON password_reset_token(user_id);
CREATE INDEX idx_password_reset_token_token ON password_reset_token(token);
CREATE INDEX idx_password_reset_token_created_at ON password_reset_token(created_at DESC);

-- 添加注释
COMMENT ON TABLE password_reset_token IS '密码重置令牌表';
COMMENT ON COLUMN password_reset_token.id IS '主键ID';
COMMENT ON COLUMN password_reset_token.user_id IS '用户ID';
COMMENT ON COLUMN password_reset_token.token IS '重置令牌';
COMMENT ON COLUMN password_reset_token.expiry_date IS '过期时间';
COMMENT ON COLUMN password_reset_token.used IS '是否已使用';
COMMENT ON COLUMN password_reset_token.created_at IS '创建时间';
