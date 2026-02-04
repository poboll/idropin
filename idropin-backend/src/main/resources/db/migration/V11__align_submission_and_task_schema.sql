-- Align collection_task and submission tables with application entities

-- 1) collection_task columns and defaults
ALTER TABLE collection_task
    ADD COLUMN IF NOT EXISTS max_file_count INTEGER DEFAULT 10,
    ADD COLUMN IF NOT EXISTS task_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS collection_type VARCHAR(20) DEFAULT 'FILE';

-- ensure sensible defaults for existing rows
UPDATE collection_task SET max_file_count = 10 WHERE max_file_count IS NULL;
UPDATE collection_task SET collection_type = 'FILE' WHERE collection_type IS NULL;

-- require_login default should be FALSE by business decision (anonymous allowed by default)
ALTER TABLE collection_task ALTER COLUMN require_login SET DEFAULT FALSE;
UPDATE collection_task SET require_login = FALSE WHERE require_login IS NULL;

-- 2) file_submission IP and created_at columns
ALTER TABLE file_submission
    ADD COLUMN IF NOT EXISTS submitter_ip VARCHAR(45),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_file_submission_ip ON file_submission(submitter_ip);
CREATE INDEX IF NOT EXISTS idx_file_submission_created_at ON file_submission(created_at);

-- 3) task_submission table (information collection submissions)
CREATE TABLE IF NOT EXISTS task_submission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_key UUID NOT NULL,
    file_name VARCHAR(255),
    file_hash VARCHAR(64),
    file_size BIGINT,
    submitter_name VARCHAR(100),
    submitter_email VARCHAR(100),
    submit_info TEXT,
    info_data TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitter_id UUID,
    submitter_ip VARCHAR(45),
    status INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_submission_task_key ON task_submission(task_key);
CREATE INDEX IF NOT EXISTS idx_task_submission_submitter ON task_submission(submitter_id);
CREATE INDEX IF NOT EXISTS idx_task_submission_created_at ON task_submission(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_submission_ip ON task_submission(submitter_ip);
