-- AI evaluation history table: stores each grading attempt for trend comparison
CREATE TABLE IF NOT EXISTS ai_evaluation_history (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    submission_id VARCHAR(64) NOT NULL REFERENCES file_submission(id) ON DELETE CASCADE,
    score INTEGER,
    dimensions JSONB,
    feedback TEXT,
    summary TEXT,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_eval_history_submission ON ai_evaluation_history(submission_id);
CREATE INDEX IF NOT EXISTS idx_ai_eval_history_created ON ai_evaluation_history(created_at);

COMMENT ON TABLE ai_evaluation_history IS 'Stores AI evaluation history for each submission, enabling score trend comparison';

-- Custom evaluation dimensions per task (JSONB array of {name, weight})
ALTER TABLE collection_task ADD COLUMN IF NOT EXISTS custom_dimensions JSONB;
COMMENT ON COLUMN collection_task.custom_dimensions IS 'Custom AI evaluation dimensions as JSON array: [{name, weight}, ...]';
