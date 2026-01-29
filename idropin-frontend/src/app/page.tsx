'use client';

import Link from 'next/link';
import { ArrowRight, Upload, Search, BarChart3, Shield, Zap, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
                <Upload className="w-4 h-4 text-white dark:text-gray-900" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">云集</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                功能
              </Link>
              <Link href="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                关于
              </Link>
              <Link href="/feedback" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                反馈
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="btn-primary btn-sm"
              >
                注册
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 rounded-full border border-gray-200 dark:border-gray-800">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>全新升级，更快更强</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
            智能文件收集
            <br />
            <span className="gradient-text">简单高效</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            云集是一个现代化的文件收集与管理平台，支持智能分类、全文搜索、实时统计，让文件管理变得简单。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="btn-primary btn-lg w-full sm:w-auto">
              开始使用
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/about" className="btn-secondary btn-lg w-full sm:w-auto">
              了解更多
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              强大的功能
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              为文件收集场景精心设计的功能，满足各种需求
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Upload className="w-5 h-5" />}
              title="便捷收集"
              description="一键生成收集链接，支持多种文件格式，自动重命名"
            />
            <FeatureCard
              icon={<Search className="w-5 h-5" />}
              title="全文搜索"
              description="基于 PostgreSQL 的高效全文检索，快速定位文件"
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="实时统计"
              description="可视化数据面板，实时监控收集进度和系统状态"
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              title="安全可靠"
              description="JWT 认证，数据加密存储，保障文件安全"
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5" />}
              title="高性能"
              description="分片上传，断点续传，大文件轻松处理"
            />
            <FeatureCard
              icon={<Globe className="w-5 h-5" />}
              title="多端适配"
              description="响应式设计，手机、平板、电脑完美适配"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value="10K+" label="活跃用户" />
            <StatItem value="100K+" label="文件收集" />
            <StatItem value="99.9%" label="服务可用" />
            <StatItem value="<100ms" label="响应时间" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 bg-gray-900 dark:bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white dark:text-gray-900 mb-4">
            准备好开始了吗？
          </h2>
          <p className="text-gray-400 dark:text-gray-600 mb-8">
            免费注册，立即体验智能文件收集
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            免费开始
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-900 dark:bg-white rounded flex items-center justify-center">
                <Upload className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">云集</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                服务条款
              </Link>
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                隐私政策
              </Link>
              <Link href="/feedback" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                问题反馈
              </Link>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-500">
              © 2024 Idrop.in 云集
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="card p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-900 dark:text-white mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
    </div>
  );
}
