'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Github,
  Mail,
  Globe,
  ArrowRight,
  LayoutDashboard,
  Calendar,
  Users,
  Heart,
  Code,
  BookOpen,
  Star
} from 'lucide-react';
import { getToken } from '@/lib/api/client';

const milestones = [
  { date: '2025.06', title: '项目启动', desc: '需求分析，技术选型，搭建开发环境' },
  { date: '2025.09', title: '核心开发', desc: '完成文件上传、管理、分享核心功能' },
  { date: '2025.12', title: '功能完善', desc: '实现分片上传、全文搜索、数据统计' },
  { date: '2026.03', title: '测试上线', desc: '完成测试，优化性能，正式发布' },
];

const stats = [
  { label: '开发周期', value: '9个月' },
  { label: '代码提交', value: '60+' },
  { label: '代码行数', value: '15K+' },
  { label: '测试用例', value: '64个' },
];

const techHighlights = [
  { title: '前后端分离', desc: 'Next.js 14 + Spring Boot 3 现代化架构' },
  { title: 'DDD 领域驱动', desc: '清晰的分层架构，易于维护和扩展' },
  { title: '高性能设计', desc: 'Redis 缓存 + 数据库优化，响应速度 <100ms' },
  { title: 'PWA 支持', desc: 'Service Worker 离线访问，原生应用体验' },
];

const features = [
  { title: '大文件上传', desc: '5MB 分片上传，支持断点续传和秒传' },
  { title: '全文检索', desc: 'PostgreSQL 16 全文搜索，毫秒级响应' },
  { title: '数据可视化', desc: 'Recharts 图表，实时统计多维度数据' },
  { title: '权限体系', desc: 'JWT + Spring Security，细粒度权限控制' },
  { title: '暗黑模式', desc: '自动适配系统主题，保护视力' },
  { title: '响应式设计', desc: '完美适配手机、平板、电脑多端' },
];

const openSourceLibs = [
  'Spring Boot', 'Next.js', 'PostgreSQL', 'Redis', 
  'MyBatis Plus', 'Tailwind CSS', 'Radix UI', 'Recharts',
  'MinIO', 'TypeScript', 'React Query', 'Zustand'
];

export default function AboutPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="relative min-h-screen bg-white dark:bg-black overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-black dark:via-gray-950 dark:to-black" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-gray-900/10 to-gray-500/10 blur-3xl dark:from-white/5 dark:to-gray-500/5" />
        <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-gradient-to-br from-gray-200/50 to-transparent blur-3xl dark:from-gray-800/30" />
      </div>

      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            返回首页
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn-primary btn-sm">
                <LayoutDashboard className="w-4 h-4" />
                进入控制台
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">登录</Link>
                <Link href="/register" className="btn-primary btn-sm">注册</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="pt-36 pb-24 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-6">
              关于云集
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-2xl mx-auto">
              一个为教育场景设计的开源文件管理平台，让文件收集变得简单、高效、可追溯
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>2025.06 - 2026.03</span>
              </div>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span>MIT 开源</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>持续维护</span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-4 sm:px-6 bg-gray-50/80 dark:bg-gray-950/50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                项目起源
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                为什么要做这个项目
              </p>
            </div>
            
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900/60 p-8 sm:p-12">
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  在教育场景中，老师经常需要收集学生的作业、报告等文件。传统方式通过邮件、聊天工具收集，存在文件散乱、难以管理、无法追溯等问题。
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  云集项目的初衷，就是为教育工作者提供一个专业的文件收集与管理工具。通过创建收集任务、生成提交链接、自动归档整理，让文件管理变得井然有序。
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  项目采用现代化技术栈，注重用户体验和性能优化，并以开源形式发布，希望能帮助更多教育工作者提升工作效率。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                技术亮点
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                现代化技术栈，追求极致性能
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {techHighlights.map((item) => (
                <div 
                  key={item.title}
                  className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900/60 p-8 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-white/5 transition-all duration-500"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 sm:px-6 bg-gray-50/80 dark:bg-gray-950/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                核心特性
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                精心打磨的功能细节
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature) => (
                <div 
                  key={feature.title}
                  className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900/60 p-6 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-white/5 transition-all duration-500"
                >
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}

              <div className="md:col-span-2 lg:col-span-3 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900/60 p-8 relative overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-white/5 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5 pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-semibold">
                      ✦ AI 赋能
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">智能批改与语义检索</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-2xl leading-relaxed">
                    基于 SiliconFlow 大语言模型驱动的智能批改引擎，结合 pgvector 向量数据库实现语义相似度查重，让文件评估更智能、更精准。
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'AI 智能批改', desc: '自动评分 + 详细反馈', icon: '🧠' },
                      { label: '向量查重', desc: 'pgvector 语义相似度', icon: '🔍' },
                      { label: 'SiliconFlow', desc: '国产大模型驱动', icon: '⚡' },
                      { label: '异步处理', desc: 'Spring @Async 队列', icon: '🔄' },
                    ].map(item => (
                      <div key={item.label} className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                开发历程
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                从想法到实现的旅程
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {milestones.map((milestone, i) => (
                <div 
                  key={milestone.date}
                  className="relative"
                >
                  <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900/60 p-6 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-white/5 transition-all duration-500">
                    <div className="text-sm font-mono text-gray-400 dark:text-gray-500 mb-3">{milestone.date}</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{milestone.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{milestone.desc}</p>
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gray-200 dark:bg-gray-800" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-4 sm:px-6 bg-gray-50/80 dark:bg-gray-950/50">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/60 shadow-xl shadow-gray-900/5 dark:shadow-white/5 backdrop-blur-sm overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4">
                {stats.map((stat, i) => (
                  <div 
                    key={stat.label} 
                    className={`text-center py-10 px-6 ${i < 3 ? 'border-r border-gray-100 dark:border-gray-800' : ''}`}
                  >
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">{stat.value}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                开源项目
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                欢迎参与贡献
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900/60 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <Github className="w-5 h-5 text-gray-900 dark:text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GitHub 仓库</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                  完整的源代码托管在 GitHub，欢迎 Star、Fork 和提交 PR
                </p>
                <a 
                  href="https://github.com/poboll/idropin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  访问仓库
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900/60 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-gray-900 dark:text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">开发文档</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                  详细的 API 文档、部署指南和开发规范
                </p>
                <a 
                  href="https://docs.idrop.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  查看文档
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900/60 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-gray-900 dark:text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">致谢开源</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                本项目基于以下优秀的开源项目构建：
              </p>
              <div className="flex flex-wrap gap-2">
                {openSourceLibs.map((lib) => (
                  <span 
                    key={lib}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  >
                    {lib}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-4 sm:px-6 bg-gray-50/80 dark:bg-gray-950/50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              联系我们
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-10">
              有任何问题或建议，欢迎联系
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a 
                href="mailto:i@caiths.com" 
                className="inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-white/5 transition-all duration-300 group"
              >
                <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">i@caiths.com</span>
              </a>
              <a 
                href="https://github.com/poboll/idropin"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-white/5 transition-all duration-300 group"
              >
                <Github className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">GitHub</span>
              </a>
              <a 
                href="https://docs.idrop.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-white/5 transition-all duration-300 group"
              >
                <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">文档</span>
              </a>
            </div>
          </div>
        </section>

        <section className="py-24 px-4 sm:px-6 bg-gray-900 dark:bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white dark:text-gray-900 mb-4 tracking-tight">
              开始使用云集
            </h2>
            <p className="text-gray-400 dark:text-gray-600 mb-10 text-lg">
              立即体验智能文件管理
            </p>
            {isLoggedIn ? (
              <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shadow-lg"
              >
                进入控制台
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link 
                href="/register" 
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shadow-lg"
              >
                免费注册
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </section>
      </main>

      <footer className="py-12 px-4 sm:px-6 border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            © 2024 在虎
          </p>
        </div>
      </footer>
    </div>
  );
}
