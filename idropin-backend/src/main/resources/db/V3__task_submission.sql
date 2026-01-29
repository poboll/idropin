-- 任务提交记录表
CREATE TABLE IF NOT EXISTS task_submission (
    id VARCHAR(36) PRIMARY KEY,
    task_key VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_hash VARCHAR(64),
    file_size BIGINT,
    submitter_name VARCHAR(100),
    submit_info TEXT,
    submitter_id VARCHAR(36),
    status INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_task_submission_task_key ON task_submission(task_key);
CREATE INDEX IF NOT EXISTS idx_task_submission_submitter ON task_submission(submitter_name);
CREATE INDEX IF NOT EXISTS idx_task_submission_hash ON task_submission(file_hash);

COMMENT ON TABLE task_submission IS '任务提交记录表';
COMMENT ON COLUMN task_submission.task_key IS '任务Key';
COMMENT ON COLUMN task_submission.file_name IS '文件名';
COMMENT ON COLUMN task_submission.file_hash IS '文件哈希';
COMMENT ON COLUMN task_submission.file_size IS '文件大小';
COMMENT ON COLUMN task_submission.submitter_name IS '提交者姓名';
COMMENT ON COLUMN task_submission.submit_info IS '提交信息JSON';
COMMENT ON COLUMN task_submission.status IS '状态：0-已提交，1-已撤回';
