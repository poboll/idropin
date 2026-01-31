-- 添加自动重命名字段到task_more_info表
ALTER TABLE task_more_info ADD COLUMN IF NOT EXISTS auto_rename BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN task_more_info.auto_rename IS '是否使用提交信息自动更新文件名';
