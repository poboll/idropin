'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Upload, Search, BarChart3, Shield, Zap, Globe, LayoutDashboard } from 'lucide-react';
import { getToken } from '@/lib/api/client';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div className="relative min-h-screen bg-white dark:bg-black overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-80">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-950 dark:to-black" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 blur-3xl opacity-20 dark:opacity-40" />
        <div className="absolute left-10 top-64 h-72 w-72 rounded-full bg-gradient-to-br from-gray-200 via-white to-gray-100 blur-3xl opacity-70 dark:from-gray-800 dark:via-gray-900 dark:to-black dark:opacity-60" />
      </div>
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
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="btn-primary btn-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  进入控制台
                </Link>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-900/70 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm backdrop-blur">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>全新升级 · 更快更稳</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-700 dark:text-gray-200">联系：i@caiths.com</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight mb-6 leading-tight">
            让文件收集
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-gray-100 dark:via-gray-200 dark:to-gray-400">快、准、可感知</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10">
            云集为教学与团队协作场景打造的收集平台，智能分类、全文检索、实时统计与安全审计一次到位，让管理不再繁琐。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link href="/dashboard" className="btn-primary btn-lg w-full sm:w-auto shadow-lg shadow-gray-900/5 dark:shadow-gray-50/5">
              开始使用
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/about" className="btn-secondary btn-lg w-full sm:w-auto">
              了解更多
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { title: '一键收集', desc: '生成链接与二维码，覆盖多终端场景' },
              { title: '实时透视', desc: '进度、类型、容量实时更新，随时决策' },
              { title: '极致安全', desc: 'JWT、防刷、权限分级，守护数据安全' }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-4 py-3 backdrop-blur shadow-sm">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{item.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
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
        <div className="max-w-6xl mx-auto rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-lg shadow-gray-900/5 dark:shadow-gray-50/5 backdrop-blur">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8">
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
            免费注册，立即体验智能文件收集。如需定制支持，联系 <a className="underline hover:text-white/90 dark:hover:text-gray-800" href="mailto:i@caiths.com">i@caiths.com</a>
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
              <a href="mailto:i@caiths.com" className="hover:text-gray-900 dark:hover:text-white transition-colors">
                i@caiths.com
              </a>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-500">
              © 2024 在虎
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
