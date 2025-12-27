# Idrop.in - 云集

> 智能文件收集与管理平台 | Intelligent File Collection & Management Platform

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Java](https://img.shields.io/badge/Java-17-orange.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.0-brightgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)

</div>

## 📖 项目简介

**Idrop.in - 云集** 是一个现代化的智能文件收集与管理平台，旨在为教育机构、企业团队、创意社群和个人用户提供高效的文件管理解决方案。

### 核心特性

- 🚀 **现代化架构** - 基于 Spring Boot 3.x + PostgreSQL 16 + Next.js 14
- 🔐 **安全可靠** - JWT认证、端到端加密、内容审核
- 🤖 **AI智能** - 自动分类、智能推荐、内容审核
- 🔍 **全文搜索** - 基于 Elasticsearch 的强大搜索能力
- 📊 **数据分析** - 实时统计、可视化报表
- 📱 **PWA支持** - 离线访问、跨平台兼容
- 🌐 **多租户** - 支持企业级多租户部署
- ⚡ **高性能** - Redis缓存、CDN加速、代码分割

## 🏗️ 技术栈

### 后端

- **框架**: Spring Boot 3.2.0
- **语言**: Java 17
- **数据库**: PostgreSQL 16
- **ORM**: MyBatis Plus 3.5.5
- **缓存**: Redis 7.x
- **搜索**: Elasticsearch 8.x
- **消息队列**: RabbitMQ
- **文件存储**: MinIO / 阿里云OSS
- **文档**: Knife4j 4.4.0

### 前端

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5.x
- **UI组件**: Radix UI + shadcn/ui
- **样式**: Tailwind CSS 3.x
- **状态管理**: Zustand 4.x + TanStack Query 5.x
- **图表**: Recharts
- **PWA**: next-pwa

### DevOps

- **容器化**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **监控**: Prometheus + Grafana
- **日志**: ELK Stack

## 📁 项目结构

```
idrop-in/
├── idropin-backend/              # 后端项目
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/idropin/
│   │       │       ├── common/          # 公共模块
│   │       │       ├── domain/          # 领域模型
│   │       │       ├── infrastructure/   # 基础设施
│   │       │       ├── application/     # 应用服务
│   │       │       └── interfaces/      # 接口层
│   │       └── resources/            # 配置文件
│   └── pom.xml
├── idropin-frontend/             # 前端项目
│   ├── app/                      # App Router
│   ├── components/                # 组件
│   ├── lib/                      # 工具库
│   ├── public/                   # 静态资源
│   ├── styles/                   # 样式文件
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
├── idropin-backend-legacy/       # 旧版后端（参考）
├── idropin-frontend-legacy/      # 旧版前端（参考）
├── idropin-server-legacy/        # 旧版服务端（参考）
└── docs/                       # 项目文档
```

## 🚀 快速开始

### 环境要求

- **Java**: JDK 17+
- **Node.js**: 18+
- **PostgreSQL**: 16+
- **Redis**: 7+
- **Maven**: 3.8+

### 后端启动

```bash
# 进入后端目录
cd idropin-backend

# 配置数据库
# 修改 src/main/resources/application.yml 中的数据库连接信息

# 启动应用
mvn spring-boot:run

# 或者打包后运行
mvn clean package
java -jar target/idropin-backend-1.0.0.jar
```

### 前端启动

```bash
# 进入前端目录
cd idropin-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
npm start
```

### Docker 部署

```bash
# 使用 Docker Compose 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 📚 核心功能

### 文件管理
- ✅ 多文件上传（支持拖拽）
- ✅ 文件预览（图片、视频、PDF、Office文档）
- ✅ 批量操作（删除、移动、分享）
- ✅ 文件版本管理
- ✅ 文件分类与标签

### 收集任务
- ✅ 创建收集任务
- ✅ 设置截止时间
- ✅ 访问控制
- ✅ 进度追踪
- ✅ 匿名提交支持

### 分享协作
- ✅ 生成分享链接
- ✅ 密码保护
- ✅ 有效期设置
- ✅ 下载次数限制

### AI智能
- ✅ 自动分类
- ✅ 内容审核
- ✅ 智能推荐
- ✅ OCR文字识别

### 数据分析
- ✅ 文件统计
- ✅ 用户行为分析
- ✅ 存储使用情况
- ✅ 可视化报表

## 🔧 配置说明

### 后端配置

主要配置文件: `src/main/resources/application.yml`

```yaml
# 数据库配置
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/idropin
    username: idropin
    password: your_password

# Redis配置
  data:
    redis:
      host: localhost
      port: 6379

# MinIO配置
minio:
  endpoint: http://localhost:9000
  access-key: your_access_key
  secret-key: your_secret_key
```

### 前端配置

环境变量文件: `.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_UPLOAD_URL=http://localhost:9000
```

## 📖 API 文档

启动后端服务后，访问 API 文档：

```
http://localhost:8080/api/doc.html
```

## 🧪 测试

```bash
# 后端测试
cd idropin-backend
mvn test

# 前端测试
cd idropin-frontend
npm test
```

## 📝 开发计划

详细的开发计划请查看：[Idrop.in-云集-详细实施计划.md](Idrop.in-云集-详细实施计划.md)

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 👥 作者

**Idrop.in Team**

## 🙏 致谢

感谢所有为本项目做出贡献的开发者！

## 📮 联系方式

- 项目主页: [https://github.com/yourusername/idropin](https://github.com/yourusername/idropin)
- 问题反馈: [Issues](https://github.com/yourusername/idropin/issues)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star 支持一下！**

Made with ❤️ by Idrop.in Team

</div>
