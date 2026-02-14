-- Add deleted_at column to collection_task table for 30-day auto-cleanup
ALTER TABLE collection_task ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add index for efficient cleanup query
CREATE INDEX IF NOT EXISTS idx_collection_task_deleted_at ON collection_task(deleted, deleted_at) WHERE deleted = true;

-- Add comment
COMMENT ON COLUMN collection_task.deleted_at IS 'Timestamp when task was moved to recycle bin. Tasks older than 30 days will be auto-deleted.';
