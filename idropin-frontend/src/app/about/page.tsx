'use client';

import Link from 'next/link';
import { 
  Cloud, 
  Upload, 
  FolderOpen, 
  Share2, 
  BarChart3, 
  Shield, 
  Zap, 
  ArrowLeft,
  Github,
  Mail,
  Globe,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: '智能文件收集',
    description: '创建收集任务，支持多种文件格式，自动归类整理',
  },
  {
    icon: FolderOpen,
    title: '高效文件管理',
    description: '分类管理、标签筛选、批量操作，轻松管理海量文件',
  },
  {
    icon: Share2,
    title: '安全文件分享',
    description: '密码保护、过期设置、下载限制，分享更安心',
  },
  {
    icon: BarChart3,
    title: '实时数据统计',
    description: '多维度统计分析，可视化展示，掌握全局数据',
  },
  {
    icon: Shield,
    title: '数据安全保障',
    description: 'JWT认证、权限控制、数据加密，全方位安全防护',
  },
  {
    icon: Zap,
    title: '极速上传体验',
    description: '大文件分片上传、断点续传、秒传，告别等待',
  },
];

const techStack = [
  { category: '前端', items: ['Next.js 14', 'React 18', 'TypeScript', 'Tailwind CSS', 'Zustand'] },
  { category: '后端', items: ['Spring Boot 3', 'Spring Security', 'MyBatis Plus', 'JWT'] },
  { category: '存储', items: ['PostgreSQL 16', 'Redis', 'MinIO'] },
  { category: '特性', items: ['PWA离线', '暗黑模式', '响应式设计', '全文搜索'] },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回首页</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost btn-sm">登录</Link>
            <Link href="/register" className="btn-primary btn-sm">注册</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 dark:bg-white rounded-2xl mb-6">
              <Cloud className="w-8 h-8 text-white dark:text-gray-900" />
            </div>
            <h1 className="text-4xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">
              云集
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              Idrop.in - 智能文件收集与管理平台
            </p>
            <p className="text-gray-500 dark:text-gray-500 max-w-xl mx-auto">
              为教育场景设计的一站式文件管理解决方案
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-12">
              核心功能
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={feature.title}
                    className="card p-6 card-hover"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-16 px-6 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-12">
              技术栈
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {techStack.map((stack) => (
                <div key={stack.category} className="card p-5">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    {stack.category}
                  </h3>
                  <ul className="space-y-2">
                    {stack.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="w-1 h-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 px-6 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-12">
              项目信息
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="stat-card text-center">
                <p className="stat-value">14000+</p>
                <p className="stat-label">代码行数</p>
              </div>
              <div className="stat-card text-center">
                <p className="stat-value">40+</p>
                <p className="stat-label">API接口</p>
              </div>
              <div className="stat-card text-center">
                <p className="stat-value">85%</p>
                <p className="stat-label">测试覆盖率</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16 px-6 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-8">
              联系我们
            </h2>
            <div className="flex justify-center gap-3 flex-wrap">
              <a href="mailto:support@idrop.in" className="btn-secondary">
                <Mail className="w-4 h-4" />
                support@idrop.in
              </a>
              <a 
                href="https://github.com/your-org/idropin"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <a 
                href="https://docs.idrop.in"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <Globe className="w-4 h-4" />
                文档
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              开始使用
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              立即注册，体验智能文件管理
            </p>
            <Link href="/register" className="btn-primary btn-lg">
              免费注册
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 Idrop.in 云集
          </p>
        </div>
      </footer>
    </div>
  );
}
