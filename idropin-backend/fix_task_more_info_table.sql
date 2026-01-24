-- Fix task_more_info table structure
-- This script updates the table to match the correct schema

-- Drop the existing table if it has wrong structure
DROP TABLE IF EXISTS task_more_info CASCADE;

-- Recreate with correct structure
CREATE TABLE task_more_info (
    id BIGSERIAL PRIMARY KEY,
    task_id UUID NOT NULL,
    ddl TEXT,
    tip TEXT,
    info TEXT,
    people BOOLEAN DEFAULT FALSE,
    format VARCHAR(255),
    template TEXT,
    bind_field TEXT,
    rewrite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_more_info_task FOREIGN KEY (task_id) REFERENCES collection_task(id) ON DELETE CASCADE
);

-- Create index
CREATE INDEX idx_task_more_info_task_id ON task_more_info(task_id);

-- Add comments
COMMENT ON TABLE task_more_info IS '任务更多信息表';
COMMENT ON COLUMN task_more_info.id IS '主键ID';
COMMENT ON COLUMN task_more_info.task_id IS '任务ID (UUID)';
COMMENT ON COLUMN task_more_info.ddl IS '截止时间提示';
COMMENT ON COLUMN task_more_info.tip IS '任务提示信息';
COMMENT ON COLUMN task_more_info.info IS '任务详细信息 (JSON)';
COMMENT ON COLUMN task_more_info.people IS '是否需要填写人员信息';
COMMENT ON COLUMN task_more_info.format IS '文件格式要求';
COMMENT ON COLUMN task_more_info.template IS '模板文件路径';
COMMENT ON COLUMN task_more_info.bind_field IS '绑定字段 (JSON)';
COMMENT ON COLUMN task_more_info.rewrite IS '是否允许重写';
COMMENT ON COLUMN task_more_info.created_at IS '创建时间';
COMMENT ON COLUMN task_more_info.updated_at IS '更新时间';
