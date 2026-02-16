-- ========================================
-- 邮件配置迁移脚本
-- 将邮件配置从 application.yml 迁移到数据库
-- ========================================

-- 插入邮件配置项到 sys_system_config 表
INSERT INTO sys_system_config (id, config_key, config_value, config_type, description, is_enabled) VALUES
(gen_random_uuid(), 'email.smtp.host', 'smtp-mail.outlook.com', 'string', 'SMTP 服务器地址', TRUE),
(gen_random_uuid(), 'email.smtp.port', '587', 'number', 'SMTP 服务器端口', TRUE),
(gen_random_uuid(), 'email.smtp.username', 'i@caiths.com', 'string', '发件人邮箱地址', TRUE),
(gen_random_uuid(), 'email.smtp.password', '', 'password', 'SMTP 授权码（需要配置）', TRUE),
(gen_random_uuid(), 'email.smtp.auth', 'true', 'boolean', '是否启用 SMTP 认证', TRUE),
(gen_random_uuid(), 'email.smtp.starttls.enable', 'true', 'boolean', '是否启用 TLS 加密', TRUE),
(gen_random_uuid(), 'email.from.name', '云集平台', 'string', '发件人显示名称', TRUE)
ON CONFLICT (config_key) DO UPDATE SET
    config_value = EXCLUDED.config_value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- 添加 category 字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sys_system_config' AND column_name = 'category'
    ) THEN
        ALTER TABLE sys_system_config ADD COLUMN category VARCHAR(50) DEFAULT 'system';
    END IF;
END $$;

-- 更新邮件配置的 category
UPDATE sys_system_config 
SET category = 'email' 
WHERE config_key LIKE 'email.%';
