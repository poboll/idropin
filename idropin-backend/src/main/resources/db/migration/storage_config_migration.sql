INSERT INTO sys_system_config (config_key, config_value, config_type, category, description, created_at, updated_at)
VALUES
    ('storage.type', 'local', 'string', 'storage', '存储类型：local/minio/qiniu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('storage.local.path', './uploads', 'string', 'storage', '本地存储路径', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('storage.local.base-url', 'http://localhost:8081/api/files/download', 'string', 'storage', '本地存储访问基础URL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('storage.minio.endpoint', 'http://localhost:9000', 'string', 'storage', 'MinIO服务端点', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('storage.minio.accessKey', 'minioadmin', 'string', 'storage', 'MinIO访问密钥', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('storage.minio.secretKey', '', 'string', 'storage', 'MinIO密钥', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('storage.minio.bucket', 'idropin-files', 'string', 'storage', 'MinIO存储桶', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('storage.qiniu.accessKey', '', 'string', 'storage', '七牛云AccessKey', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('storage.qiniu.secretKey', '', 'string', 'storage', '七牛云SecretKey', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('storage.qiniu.bucket', '', 'string', 'storage', '七牛云存储桶', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('storage.qiniu.domain', '', 'string', 'storage', '七牛云CDN域名', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('storage.qiniu.region', 'as0', 'string', 'storage', '七牛云区域(z0/z1/z2/na0/as0)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (config_key) DO NOTHING;
