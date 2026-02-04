-- 添加IP地址和时间戳字段到提交记录表

-- 为 file_submission 表添加 IP 地址字段
ALTER TABLE file_submission ADD COLUMN IF NOT EXISTS submitter_ip VARCHAR(45);
ALTER TABLE file_submission ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 为 task_submission 表添加 IP 地址字段（如果还没有）
ALTER TABLE task_submission ADD COLUMN IF NOT EXISTS submitter_ip VARCHAR(45);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_file_submission_ip ON file_submission(submitter_ip);
CREATE INDEX IF NOT EXISTS idx_task_submission_ip ON task_submission(submitter_ip);
CREATE INDEX IF NOT EXISTS idx_file_submission_created_at ON file_submission(created_at);
