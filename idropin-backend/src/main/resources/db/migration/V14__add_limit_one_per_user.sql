-- Add per-user submission limit flag to collection_task
ALTER TABLE collection_task ADD COLUMN IF NOT EXISTS limit_one_per_user BOOLEAN DEFAULT false;
