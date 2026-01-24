-- 创建人员名单表
CREATE TABLE IF NOT EXISTS people_list (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  people_name VARCHAR(100) NOT NULL,
  admin_username VARCHAR(100) NOT NULL,
  parent_name VARCHAR(100),
  child_name VARCHAR(100),
  status INT NOT NULL DEFAULT 0,
  last_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_people_admin_username ON people_list(admin_username);
CREATE INDEX idx_people_parent_name ON people_list(parent_name);
CREATE INDEX idx_people_child_name ON people_list(child_name);
CREATE INDEX idx_people_status ON people_list(status);

-- 添加注释
COMMENT ON TABLE people_list IS '人员名单表';
COMMENT ON COLUMN people_list.people_name IS '允许人员姓名';
COMMENT ON COLUMN people_list.admin_username IS '管理员账号';
COMMENT ON COLUMN people_list.parent_name IS '所属父类';
COMMENT ON COLUMN people_list.child_name IS '所属子类';
COMMENT ON COLUMN people_list.status IS '是否提交：0-未提交，1-已提交';
COMMENT ON COLUMN people_list.last_date IS '最后提交时间';
