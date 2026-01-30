-- 添加task_submission表缺失的字段

-- 添加submitter_email字段
ALTER TABLE task_submission 
ADD COLUMN IF NOT EXISTS submitter_email VARCHAR(255);

-- 添加info_data字段（用于存储仅信息收集的数据）
ALTER TABLE task_submission 
ADD COLUMN IF NOT EXISTS info_data TEXT;

-- 添加submitted_at字段
ALTER TABLE task_submission 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

COMMENT ON COLUMN task_submission.submitter_email IS '提交者邮箱';
COMMENT ON COLUMN task_submission.info_data IS '信息数据（JSON格式）- 用于仅信息收集类型';
COMMENT ON COLUMN task_submission.submitted_at IS '提交时间';
