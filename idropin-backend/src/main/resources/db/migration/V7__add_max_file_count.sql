-- Add max_file_count column to collection_task table
ALTER TABLE collection_task ADD COLUMN IF NOT EXISTS max_file_count INTEGER DEFAULT 10;

COMMENT ON COLUMN collection_task.max_file_count IS '最大同时提交文件数量（1-16，默认10）';
