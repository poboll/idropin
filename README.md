# Idrop.in · 云集

> 面向教育场景的智能文件收集与管理平台

[![CI/CD](https://github.com/poboll/idropin/actions/workflows/build-and-release.yml/badge.svg)](https://github.com/poboll/idropin/actions/workflows/build-and-release.yml)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green.svg)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-poboll-2496ED.svg)](https://hub.docker.com/u/poboll)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 概览

Idrop.in 云集是一个前后端分离的教育文件管理平台，提供文件收集任务、大文件分片上传、AI 智能批阅、多存储后端切换、实时统计看板等核心能力。

## 功能

| 模块 | 能力 |
|---|---|
| 认证与权限 | JWT 无状态认证、令牌刷新、Spring Security 6、细粒度 RBAC |
| 收集任务 | 多类型收集（文件 / 信息 / 混合）、截止时间、提交统计、人员名单 |
| 文件管理 | 大文件分片上传（5 MB / 片）、断点续传、秒传、批量操作、回收站 |
| 多存储后端 | MinIO / 七牛云 / 阿里云 OSS，运行时动态切换，无需重启 |
| AI 批阅 | 提交内容自动评分、雷达图可视化、批量 AI Review |
| 文件分享 | 短链接、密码保护、过期时间、下载次数限制 |
| 实时统计 | WebSocket 推送、多维度图表（Recharts）、访问日志 |
| 后台管理 | 用户管理、系统配置、邮件 / 存储配置、反馈处理、操作审计 |
| 全文搜索 | PostgreSQL 16 全文搜索，复合过滤条件 |
| PWA | Service Worker、离线访问、App 级体验 |

## 技术栈

**后端**

| 组件 | 版本 |
|---|---|
| Java | 21 |
| Spring Boot | 3.2.0 |
| Spring Security | 6.2 |
| MyBatis Plus | 3.5.7 |
| PostgreSQL | 16 |
| Redis | 7.x |
| MinIO / 七牛云 | — |
| JWT (jjwt) | 0.12.3 |
| Knife4j | 4.4.0 |

**前端**

| 组件 | 版本 |
|---|---|
| Next.js | 14.0.4 |
| React | 18.2 |
| TypeScript | 5.3 |
| Tailwind CSS | 3.3 |
| Zustand | 5.x |
| SWR | 2.4 |
| Recharts | 2.10 |

## 快速开始

### 前置依赖

- Docker 20+（运行 PostgreSQL、Redis、MinIO）
- Java 21+
- Node.js 18+、npm 9+

### 启动

```bash
git clone https://github.com/poboll/idropin.git
cd idropin

# 启动依赖服务
docker start postgres redis minio

# 初始化数据库（首次）
docker exec -i devos-postgres psql -U idropin -d idropin < idropin-backend/src/main/resources/init-database.sql

# 启动后端
cd idropin-backend && mvn spring-boot:run &

# 启动前端
cd ../idropin-frontend && npm install && npm run dev
```

| 服务 | 地址 |
|---|---|
| 前端 | http://localhost:5224 |
| 后端 API | http://localhost:8081 |
| API 文档 | http://localhost:8081/api/doc.html |

**默认账号** — 管理员：`admin / admin123`，普通用户：`demo / admin123`

### Docker 镜像

```bash
docker pull poboll/idropin-frontend:latest
docker pull poboll/idropin-backend:latest
```

完整 compose 文件见 [部署文档](部署文档.md)。

## 数据库

初始化脚本位于 `idropin-backend/src/main/resources/`：

| 文件 | 用途 |
|---|---|
| `init-database.sql` | 完整初始化（含示例数据，推荐新环境使用） |
| `schema.sql` | 仅表结构，无示例数据 |
| `schema-reset.sql` | 开发环境一键重置 |
| `db/migration/` | 增量迁移脚本（V3 → V12） |

## 项目结构

```
idropin/
├── idropin-backend/
│   ├── src/main/java/com/idropin/
│   │   ├── common/          # 常量、异常、工具、配置
│   │   ├── domain/          # 实体、VO、DTO、枚举
│   │   ├── infrastructure/  # 持久化、缓存、存储、消息
│   │   ├── application/     # 业务服务
│   │   └── interfaces/      # REST API、WebSocket
│   └── src/main/resources/
│       ├── application.yml
│       ├── init-database.sql
│       └── db/migration/
└── idropin-frontend/
    ├── src/app/             # Next.js App Router 页面
    ├── src/components/      # React 组件
    ├── src/hooks/           # 自定义 Hooks
    └── public/              # 静态资源 / PWA 图标
```

## 开发

```bash
# 后端
cd idropin-backend
mvn clean package -DskipTests
java -jar target/idropin-backend-*.jar

# 前端
cd idropin-frontend
npm install
npm run dev      # 开发服务器（:5224）
npm run build    # 生产构建
```

## CI/CD

每次推送到 `main` 分支，GitHub Actions 自动：

1. 构建前后端产物
2. 构建 Docker 镜像并推送至 Docker Hub（`poboll/idropin-frontend`、`poboll/idropin-backend`）
3. 打 `vYYYYMMDD-HHMMSS` 版本 Tag，发布附带二进制包的 GitHub Release

在仓库 **Settings → Secrets → Actions** 中配置：

| Secret | 说明 |
|---|---|
| `DOCKER_USERNAME` | Docker Hub 用户名 |
| `DOCKER_PASSWORD` | Docker Hub 密码 |

## 贡献

1. Fork 仓库，创建特性分支
2. 提交遵循 [Conventional Commits](https://www.conventionalcommits.org/)
3. 发起 Pull Request

## 许可证

[MIT](LICENSE) © Idrop.in Team
