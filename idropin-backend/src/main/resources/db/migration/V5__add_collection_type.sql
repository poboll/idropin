-- 添加收集类型字段到 collection_task 表
-- collection_type: 'INFO' = 仅收集信息, 'FILE' = 收集文件（默认）

ALTER TABLE collection_task 
ADD COLUMN collection_type VARCHAR(20) DEFAULT 'FILE';

COMMENT ON COLUMN collection_task.collection_type IS '收集类型: INFO=仅收集信息, FILE=收集文件';

-- 更新现有记录为 FILE 类型（保持向后兼容）
UPDATE collection_task 
SET collection_type = 'FILE' 
WHERE collection_type IS NULL;
