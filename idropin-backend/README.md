# Idrop.in Backend

> 智能文件收集与管理平台后端服务 | Idrop.in Backend Service

## 📖 项目简介

Idrop.in Backend 是基于 Spring Boot 3.x 构建的现代化后端服务，提供文件管理、用户认证、收集任务、分享协作等核心功能。

## 🏗️ 技术栈

- **框架**: Spring Boot 3.2.0
- **语言**: Java 17
- **数据库**: PostgreSQL 16
- **ORM**: MyBatis Plus 3.5.5
- **缓存**: Redis 7.x
- **搜索**: Elasticsearch 8.x
- **消息队列**: RabbitMQ
- **文件存储**: MinIO / 阿里云OSS
- **API文档**: Knife4j 4.4.0

## 📁 项目结构

```
idropin-backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/idropin/
│   │   │       ├── common/              # 公共模块
│   │   │       │   ├── constant/       # 常量定义
│   │   │       │   ├── exception/      # 异常处理
│   │   │       │   ├── util/          # 工具类
│   │   │       │   ├── config/        # 配置类
│   │   │       │   └── vo/            # 视图对象
│   │   │       ├── domain/              # 领域模型
│   │   │       │   ├── entity/         # 实体类
│   │   │       │   ├── vo/            # 视图对象
│   │   │       │   ├── dto/           # 数据传输对象
│   │   │       │   └── enums/         # 枚举类
│   │   │       ├── infrastructure/       # 基础设施
│   │   │       │   ├── persistence/    # 数据持久化
│   │   │       │   ├── cache/         # 缓存实现
│   │   │       │   ├── mq/            # 消息队列
│   │   │       │   └── storage/       # 文件存储
│   │   │       ├── application/         # 应用服务
│   │   │       │   ├── service/       # 业务服务
│   │   │       │   └── facade/        # 门面接口
│   │   │       └── interfaces/          # 接口层
│   │   │           ├── rest/           # REST API
│   │   │           ├── websocket/      # WebSocket
│   │   │           └── scheduler/      # 定时任务
│   │   └── resources/                # 配置文件
│   │       ├── application.yml         # 主配置
│   │       └── mapper/              # MyBatis映射
│   └── test/                       # 测试代码
└── pom.xml                          # Maven配置
```

## 🚀 快速开始

### 环境要求

- JDK 17+
- Maven 3.8+
- PostgreSQL 16+
- Redis 7+
- Elasticsearch 8.x (可选)
- RabbitMQ 3.12+ (可选)

### 配置数据库

```sql
-- 创建数据库
CREATE DATABASE idropin;

-- 创建用户
CREATE USER idropin WITH PASSWORD 'idropin123';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE idropin TO idropin;
```

### 修改配置

编辑 `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/idropin
    username: idropin
    password: your_password

  data:
    redis:
      host: localhost
      port: 6379

minio:
  endpoint: http://localhost:9000
  access-key: your_access_key
  secret-key: your_secret_key
```

### 启动应用

```bash
# 使用Maven启动
mvn spring-boot:run

# 或者打包后启动
mvn clean package
java -jar target/idropin-backend-1.0.0.jar

# 指定配置文件
java -jar target/idropin-backend-1.0.0.jar --spring.profiles.active=prod
```

### 访问应用

- **应用地址**: http://localhost:8081/api
- **API文档**: http://localhost:8081/api/doc.html

## 📖 API文档

启动应用后，访问 Knife4j 文档：

```
http://localhost:8081/api/doc.html
```

## 🔧 核心功能

### 用户认证
- JWT Token认证
- 用户注册/登录
- 密码重置
- 权限管理

### 文件管理
- 文件上传/下载
- 文件预览
- 文件分类
- 标签管理

### 收集任务
- 创建收集任务
- 文件提交
- 进度追踪
- 访问控制

### 分享功能
- 生成分享链接
- 密码保护
- 有效期设置
- 下载限制

### AI智能
- 自动分类
- 内容审核
- 智能推荐

## 🧪 测试

```bash
# 运行所有测试
mvn test

# 运行指定测试类
mvn test -Dtest=UserServiceTest

# 生成测试报告
mvn test jacoco:report
```

## 📦 打包部署

```bash
# 打包
mvn clean package

# 跳过测试打包
mvn clean package -DskipTests

# 指定环境打包
mvn clean package -Pprod
```

### Docker部署

```bash
# 构建镜像
docker build -t idropin-backend:1.0.0 .

# 运行容器
docker run -p 8080:8080 idropin-backend:1.0.0
```

## 🔍 监控与日志

### 日志配置

日志文件位置: `logs/idropin.log`

日志级别配置: `application.yml`

```yaml
logging:
  level:
    com.idropin: debug
    org.springframework.web: info
```

### 健康检查

```bash
curl http://localhost:8081/api/actuator/health
```

## 🤝 开发规范

### 代码规范

- 遵循阿里巴巴Java开发手册
- 使用Lombok简化代码
- 统一异常处理
- 统一返回格式

### 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具链相关
```

## 📝 待办事项

- [ ] 完成用户认证模块
- [ ] 完成文件上传功能
- [ ] 完成收集任务功能
- [ ] 集成AI分类
- [ ] 集成Elasticsearch
- [ ] 完成单元测试

## 📄 许可证

MIT License

## 👥 作者

Idrop.in Team
