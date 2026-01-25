# Idrop.in Frontend

> 智能文件收集与管理平台前端应用 | Idrop.in Frontend Application

## 📖 项目简介

Idrop.in Frontend 是基于 Next.js 14 构建的现代化前端应用，提供文件管理、收集任务、分享协作等核心功能的用户界面。

## 🏗️ 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5.x
- **UI组件**: Radix UI + shadcn/ui
- **样式**: Tailwind CSS 3.x
- **状态管理**: Zustand 4.x + TanStack Query 5.x
- **图表**: Recharts
- **PWA**: next-pwa
- **表单**: React Hook Form + Zod

## 📁 项目结构

```
idropin-frontend/
├── app/                    # App Router页面
│   ├── api/               # API路由
│   ├── auth/              # 认证页面
│   ├── files/             # 文件管理页面
│   ├── tasks/             # 收集任务页面
│   ├── shares/            # 分享页面
│   ├── layout.tsx         # 布局组件
│   └── page.tsx          # 首页
├── components/             # 可复用组件
│   ├── ui/               # UI基础组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/           # 布局组件
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   └── features/         # 功能组件
│       ├── file-upload/
│       ├── file-list/
│       └── task-form/
├── lib/                  # 工具库
│   ├── api/              # API调用
│   │   ├── client.ts
│   │   ├── files.ts
│   │   ├── tasks.ts
│   │   └── shares.ts
│   ├── utils/            # 工具函数
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── constants.ts
│   └── hooks/            # 自定义Hooks
│       ├── use-auth.ts
│       ├── use-files.ts
│       └── use-theme.ts
├── public/               # 静态资源
│   ├── images/
│   ├── icons/
│   └── manifest.json
├── styles/               # 全局样式
│   └── globals.css
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 9+ 或 pnpm 8+

### 安装依赖

```bash
# 使用npm
npm install

# 使用pnpm (推荐)
pnpm install

# 使用yarn
yarn install
```

### 配置环境变量

创建 `.env.local` 文件：

```bash
# API地址
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# 文件上传地址
NEXT_PUBLIC_UPLOAD_URL=http://localhost:9000

# 应用标题
NEXT_PUBLIC_APP_TITLE=Idrop.in - 云集
```

### 启动开发服务器

```bash
# 开发模式
npm run dev

# 访问 http://localhost:3000
```

### 构建生产版本

```bash
# 构建
npm run build

# 启动生产服务器
npm start

# 预览构建结果
npm run serve
```

## 🎨 样式与主题

### Tailwind CSS

项目使用 Tailwind CSS 进行样式开发：

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <h1 className="text-2xl font-bold text-gray-900">标题</h1>
</div>
```

### 暗黑模式

项目支持暗黑模式切换：

```tsx
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
```

### shadcn/ui组件

使用 shadcn/ui 组件库：

```tsx
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>对话框标题</DialogTitle>
    </DialogHeader>
    <Button onClick={handleClose}>关闭</Button>
  </DialogContent>
</Dialog>
```

## 🔧 核心功能

### 文件管理

- 文件上传（拖拽支持）
- 文件预览
- 文件列表
- 批量操作
- 文件分类

### 收集任务

- 创建任务
- 提交文件
- 查看进度
- 任务管理

### 分享功能

- 生成分享链接
- 设置密码
- 访问分享
- 下载文件

### 用户认证

- 用户登录
- 用户注册
- 密码重置
- 权限管理

## 📊 状态管理

### Zustand

使用 Zustand 进行全局状态管理：

```tsx
// store/use-auth.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}))
```

### TanStack Query

使用 TanStack Query 进行服务端状态管理：

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// 获取文件列表
function FileList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['files'],
    queryFn: () => fetchFiles(),
  })

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败</div>

  return <FileList files={data} />
}

// 上传文件
function FileUpload() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })

  return <UploadForm onSubmit={mutation.mutate} />
}
```

## 🎯 自定义Hooks

### useAuth

```tsx
function useAuth() {
  const { user, token, login, logout } = useAuth()

  const isAuthenticated = !!token

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
  }
}
```

### useFiles

```tsx
function useFiles() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['files'],
    queryFn: fetchFiles,
  })

  return {
    files: data || [],
    isLoading,
    refetch,
  }
}
```

## 📱 PWA支持

项目支持 PWA，可以离线访问：

```bash
# 构建 PWA
npm run build

# PWA 会自动注册 Service Worker
```

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试并生成覆盖率
npm run test:coverage

# E2E测试
npm run test:e2e
```

## 📦 部署

### Vercel部署

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Docker部署

```bash
# 构建镜像
docker build -t idropin-frontend:1.0.0 .

# 运行容器
docker run -p 3000:3000 idropin-frontend:1.0.0
```

### 静态部署

```bash
# 构建静态文件
npm run build

# 部署到Nginx
# 将 .next 目录复制到 Nginx 静态文件目录
```

## 🔍 性能优化

### 代码分割

Next.js 自动进行代码分割，无需手动配置。

### 图片优化

```tsx
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={500}
  height={300}
  priority
/>
```

### 懒加载

```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>加载中...</p>,
})
```

## 🤝 开发规范

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 组件使用 PascalCase
- 工具函数使用 camelCase

### 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 样式调整
refactor: 重构
test: 测试相关
chore: 构建/工具链相关
```

## 📝 待办事项

- [ ] 完成文件上传组件
- [ ] 完成文件列表组件
- [ ] 完成收集任务组件
- [ ] 完成分享功能
- [ ] 添加暗黑模式
- [ ] 完成PWA功能
- [ ] 添加单元测试

## 📄 许可证

MIT License

## 👥 作者

Idrop.in Team
