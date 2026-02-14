-- ========================================
-- 系统配置项初始化脚本
-- 添加8个配置模块的配置项
-- ========================================

-- ========================================
-- 1. 安全与认证配置 (Security & Authentication)
-- ========================================
INSERT INTO sys_system_config (id, config_key, config_value, config_type, description, is_enabled) VALUES
(gen_random_uuid(), 'auth.jwt.expiry', '604800000', 'number', 'JWT Token过期时间（毫秒，默认7天）', true),
(gen_random_uuid(), 'auth.jwt.refresh.expiry', '2592000000', 'number', '刷新Token过期时间（毫秒，默认30天）', true),
(gen_random_uuid(), 'auth.password.min.length', '8', 'number', '密码最小长度', true),
(gen_random_uuid(), 'auth.password.require.uppercase', 'true', 'boolean', '密码是否要求大写字母', true),
(gen_random_uuid(), 'auth.password.require.lowercase', 'true', 'boolean', '密码是否要求小写字母', true),
(gen_random_uuid(), 'auth.password.require.number', 'true', 'boolean', '密码是否要求数字', true),
(gen_random_uuid(), 'auth.password.require.special', 'false', 'boolean', '密码是否要求特殊字符', true),
(gen_random_uuid(), 'auth.login.max.attempts', '5', 'number', '登录失败最大尝试次数', true),
(gen_random_uuid(), 'auth.login.lock.duration', '1800000', 'number', '账户锁定时长（毫秒，默认30分钟）', true),
(gen_random_uuid(), 'auth.session.timeout', '3600000', 'number', '会话超时时间（毫秒，默认1小时）', true),
(gen_random_uuid(), 'auth.two.factor.enabled', 'false', 'boolean', '是否启用双因素认证', true)
ON CONFLICT (config_key) DO NOTHING;

-- ========================================
-- 2. 文件上传配置 (File Upload)
-- ========================================
INSERT INTO sys_system_config (id, config_key, config_value, config_type, description, is_enabled) VALUES
(gen_random_uuid(), 'upload.max.file.size', '104857600', 'number', '单文件最大大小（字节，默认100MB）', true),
(gen_random_uuid(), 'upload.max.files.count', '10', 'number', '单次上传文件数量限制', true),
(gen_random_uuid(), 'upload.allowed.types', 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,video/mp4,audio/mpeg,application/zip,text/plain', 'string', '允许的文件MIME类型（逗号分隔）', true),
(gen_random_uuid(), 'upload.forbidden.extensions', 'exe,bat,sh,cmd,com,scr,vbs,js,jar', 'string', '禁止的文件扩展名（逗号分隔）', true),
(gen_random_uuid(), 'upload.filename.max.length', '255', 'number', '文件名最大长度', true),
(gen_random_uuid(), 'upload.chunk.size', '5242880', 'number', '分片上传大小（字节，默认5MB）', true),
(gen_random_uuid(), 'upload.concurrent.limit', '3', 'number', '并发上传数量限制', true)
ON CONFLICT (config_key) DO NOTHING;

-- ========================================
-- 3. 存储配额配置 (Storage Quota)
-- ========================================
INSERT INTO sys_system_config (id, config_key, config_value, config_type, description, is_enabled) VALUES
(gen_random_uuid(), 'storage.total.limit', '107374182400', 'number', '系统总存储容量限制（字节，默认100GB）', true),
(gen_random_uuid(), 'storage.user.default.quota', '10737418240', 'number', '默认用户存储配额（字节，默认10GB）', true),
(gen_random_uuid(), 'storage.file.max.retention', '365', 'number', '单文件最大保留天数（默认365天）', true),
(gen_random_uuid(), 'storage.recycle.retention', '30', 'number', '回收站文件保留天数（默认30天）', true),
(gen_random_uuid(), 'storage.auto.cleanup.enabled', 'true', 'boolean', '是否自动清理过期文件', true),
(gen_random_uuid(), 'storage.warning.threshold', '80', 'number', '存储空间预警阈值（百分比）', true),
(gen_random_uuid(), 'storage.critical.threshold', '90', 'number', '存储空间严重预警阈值（百分比）', true)
ON CONFLICT (config_key) DO NOTHING;

-- ========================================
-- 4. 分享功能配置 (Share)
-- ========================================
INSERT INTO sys_system_config (id, config_key, config_value, config_type, description, is_enabled) VALUES
(gen_random_uuid(), 'share.default.expiry', '7', 'number', '分享链接默认过期天数（默认7天）', true),
(gen_random_uuid(), 'share.max.expiry', '30', 'number', '分享链接最大有效天数（默认30天）', true),
(gen_random_uuid(), 'share.default.download.limit', '100', 'number', '默认下载次数限制', true),
(gen_random_uuid(), 'share.max.download.limit', '1000', 'number', '最大下载次数限制', true),
(gen_random_uuid(), 'share.password.min.length', '4', 'number', '分享密码最小长度', true),
(gen_random_uuid(), 'share.allow.anonymous', 'true', 'boolean', '是否允许匿名访问分享', true),
(gen_random_uuid(), 'share.require.login', 'false', 'boolean', '分享是否强制要求登录', true)
ON CONFLICT (config_key) DO NOTHING;

-- ========================================
-- 5. 收集任务配置 (Collection Task)
-- ========================================
INSERT INTO sys_system_config (id, config_key, config_value, config_type, description, is_enabled) VALUES
(gen_random_uuid(), 'task.max.count.per.user', '50', 'number', '单用户最大任务数量', true),
(gen_random_uuid(), 'task.default.expiry', '30', 'number', '任务默认过期天数（默认30天）', true),
(gen_random_uuid(), 'task.max.files.per.task', '1000', 'number', '单任务最大文件数量', true),
(gen_random_uuid(), 'task.max.storage.per.task', '10737418240', 'number', '单任务最大存储空间（字节，默认10GB）', true),
(gen_random_uuid(), 'task.deadline.reminder.days', '3', 'number', '任务截止提醒提前天数', true),
(gen_random_uuid(), 'task.allow.resubmit', 'true', 'boolean', '是否允许重复提交', true),
(gen_random_uuid(), 'task.auto.close.after.deadline', 'false', 'boolean', '截止后是否自动关闭任务', true)
ON CONFLICT (config_key) DO NOTHING;

-- ========================================
-- 6. 邮件通知配置 (Email Notification)
-- ========================================
INSERT INTO sys_system_config (id, config_key, config_value, config_type, description, is_enabled) VALUES
(gen_random_uuid(), 'email.smtp.host', 'smtp-mail.outlook.com', 'string', 'SMTP服务器地址', true),
(gen_random_uuid(), 'email.smtp.port', '587', 'number', 'SMTP端口', true),
(gen_random_uuid(), 'email.from.address', 'noreply@idrop.in', 'string', '发件人邮箱地址', true),
(gen_random_uuid(), 'email.from.name', 'Idrop.in 云集', 'string', '发件人名称', true),
(gen_random_uuid(), 'email.notification.enabled', 'true', 'boolean', '是否启用邮件通知', true),
(gen_random_uuid(), 'email.rate.limit.per.hour', '10', 'number', '每小时邮件发送频率限制', true),
(gen_random_uuid(), 'email.template.register', 'welcome', 'string', '注册邮件模板名称', true),
(gen_random_uuid(), 'email.template.reset.password', 'reset-password', 'string', '重置密码邮件模板名称', true)
ON CONFLICT (config_key) DO NOTHING;

-- ========================================
-- 7. 网站基础配置 (Website)
-- ========================================
INSERT INTO sys_system_config (id, config_key, config_value, config_type, description, is_enabled) VALUES
(gen_random_uuid(), 'website.name', 'Idrop.in - 云集', 'string', '网站名称', true),
(gen_random_uuid(), 'website.logo.url', '/logo.png', 'string', '网站Logo URL', true),
(gen_random_uuid(), 'website.description', '智能化教育文件管理平台', 'string', '网站描述', true),
(gen_random_uuid(), 'website.keywords', '文件分享,文件收集,云存储,教育平台', 'string', '网站关键词（SEO）', true),
(gen_random_uuid(), 'website.icp.number', '', 'string', 'ICP备案号', true),
(gen_random_uuid(), 'website.police.number', '', 'string', '公安备案号', true),
(gen_random_uuid(), 'website.contact.email', 'support@idrop.in', 'string', '联系邮箱', true),
(gen_random_uuid(), 'website.support.url', 'https://support.idrop.in', 'string', '客服链接', true),
(gen_random_uuid(), 'website.announcement.enabled', 'false', 'boolean', '是否显示公告', true),
(gen_random_uuid(), 'website.announcement.content', '', 'string', '公告内容', true)
ON CONFLICT (config_key) DO NOTHING;

-- ========================================
-- 8. 限流与防护配置 (Rate Limiting)
-- ========================================
INSERT INTO sys_system_config (id, config_key, config_value, config_type, description, is_enabled) VALUES
(gen_random_uuid(), 'ratelimit.api.requests.per.minute', '60', 'number', 'API调用频率限制（次/分钟）', true),
(gen_random_uuid(), 'ratelimit.upload.requests.per.hour', '100', 'number', '文件上传频率限制（次/小时）', true),
(gen_random_uuid(), 'ratelimit.login.attempts.per.hour', '10', 'number', '登录尝试频率限制（次/小时）', true),
(gen_random_uuid(), 'ratelimit.captcha.enabled', 'false', 'boolean', '是否启用验证码', true),
(gen_random_uuid(), 'ratelimit.captcha.threshold', '3', 'number', '触发验证码的失败次数', true),
(gen_random_uuid(), 'ratelimit.ip.blacklist', '', 'string', 'IP黑名单（逗号分隔）', true),
(gen_random_uuid(), 'ratelimit.ip.whitelist', '', 'string', 'IP白名单（逗号分隔）', true)
ON CONFLICT (config_key) DO NOTHING;

-- ========================================
-- 9. 系统性能配置 (System Performance)
-- ========================================
INSERT INTO sys_system_config (id, config_key, config_value, config_type, description, is_enabled) VALUES
(gen_random_uuid(), 'system.jvm.max.memory', '2048', 'number', '后端最大运行内存（MB）', true),
(gen_random_uuid(), 'system.concurrency.mode', 'default', 'string', '并发模式（light/default/high）', true),
(gen_random_uuid(), 'system.thread.pool.core.size', '10', 'number', '线程池核心大小', true),
(gen_random_uuid(), 'system.thread.pool.max.size', '50', 'number', '线程池最大大小', true),
(gen_random_uuid(), 'system.connection.pool.size', '20', 'number', '数据库连接池大小', true)
ON CONFLICT (config_key) DO NOTHING;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_system_config_key ON sys_system_config(config_key);
CREATE INDEX IF NOT EXISTS idx_system_config_type ON sys_system_config(config_type);
CREATE INDEX IF NOT EXISTS idx_system_config_enabled ON sys_system_config(is_enabled);

-- 完成
COMMENT ON TABLE sys_system_config IS '系统配置表 - 包含安全认证、文件上传、存储配额、分享、任务、邮件、网站、限流等配置';
