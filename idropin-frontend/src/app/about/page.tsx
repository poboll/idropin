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
  Globe,
  ArrowLeft,
  Github,
  Mail
} from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: '智能文件收集',
    description: '创建收集任务，支持多种文件格式，自动归类整理',
    color: 'bg-blue-500',
  },
  {
    icon: FolderOpen,
    title: '高效文件管理',
    description: '分类管理、标签筛选、批量操作，轻松管理海量文件',
    color: 'bg-green-500',
  },
  {
    icon: Share2,
    title: '安全文件分享',
    description: '密码保护、过期设置、下载限制，分享更安心',
    color: 'bg-purple-500',
  },
  {
    icon: BarChart3,
    title: '实时数据统计',
    description: '多维度统计分析，可视化展示，掌握全局数据',
    color: 'bg-orange-500',
  },
  {
    icon: Shield,
    title: '数据安全保障',
    description: 'JWT认证、权限控制、数据加密，全方位安全防护',
    color: 'bg-red-500',
  },
  {
    icon: Zap,
    title: '极速上传体验',
    description: '大文件分片上传、断点续传、秒传，告别等待',
    color: 'bg-yellow-500',
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>返回首页</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link 
                href="/login"
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                登录
              </Link>
              <Link 
                href="/register"
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                注册
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-3xl mb-6">
              <Cloud className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">
              云集
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-2">
              Idrop.in - 智能文件收集与管理平台
            </p>
            <p className="text-slate-500 dark:text-slate-500 max-w-2xl mx-auto">
              为教育场景设计的一站式文件管理解决方案，让文件收集、管理、分享变得简单高效
            </p>
          </div>
        </section>

        <section className="py-16 px-6 bg-white dark:bg-slate-800">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-12">
              核心功能
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={feature.title}
                    className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700"
                  >
                    <div className={`inline-flex items-center justify-center w-12 h-12 ${feature.color} rounded-xl mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-12">
              技术栈
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {techStack.map((stack) => (
                <div 
                  key={stack.category}
                  className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"
                >
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                    {stack.category}
                  </h3>
                  <ul className="space-y-2">
                    {stack.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-white dark:bg-slate-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-8">
              项目信息
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <div className="text-3xl font-bold text-blue-500 mb-2">14000+</div>
                <div className="text-slate-600 dark:text-slate-400">代码行数</div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <div className="text-3xl font-bold text-green-500 mb-2">40+</div>
                <div className="text-slate-600 dark:text-slate-400">API接口</div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                <div className="text-3xl font-bold text-purple-500 mb-2">85%</div>
                <div className="text-slate-600 dark:text-slate-400">测试覆盖率</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-8">
              联系我们
            </h2>
            <div className="flex justify-center gap-6">
              <a 
                href="mailto:support@idrop.in"
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span>support@idrop.in</span>
              </a>
              <a 
                href="https://github.com/your-org/idropin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <Github className="w-5 h-5" />
                <span>GitHub</span>
              </a>
              <a 
                href="https://docs.idrop.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span>文档</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-6 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © 2024 Idrop.in 云集 - 智能文件收集与管理平台
          </p>
        </div>
      </footer>
    </div>
  );
}
