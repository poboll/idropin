'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Upload, Search, BarChart3, Shield, Zap, Globe, LayoutDashboard, ChevronDown, FileText, Layers, Smartphone } from 'lucide-react';
import { getToken } from '@/lib/api/client';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  const hero = useInView(0.1);
  const steps = useInView();
  const features = useInView();
  const stats = useInView();
  const tech = useInView();
  const faq = useInView();
  const cta = useInView();

  return (
    <div className="relative min-h-screen bg-white dark:bg-black overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-black dark:via-gray-950 dark:to-black" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-gray-900/10 to-gray-500/10 blur-3xl dark:from-white/5 dark:to-gray-500/5" />
        <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-gradient-to-br from-gray-200/50 to-transparent blur-3xl dark:from-gray-800/30" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
                <Upload className="w-4 h-4 text-white dark:text-gray-900" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">云集</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">功能</Link>
              <Link href="#tech" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">技术</Link>
              <Link href="/docs" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">文档</Link>
              <Link href="/feedback" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">反馈</Link>
              <Link href="/about" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">关于</Link>
            </div>
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
        </div>
      </nav>

      <section ref={hero.ref} className="pt-36 pb-24 px-4 sm:px-6">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${hero.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-sm text-gray-600 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-900/80 rounded-full border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            全新升级 · 更快更稳
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-8">
            让文件收集
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-600 to-gray-400 dark:from-white dark:via-gray-300 dark:to-gray-500">
              快、准、可感知
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            为教学与团队协作场景打造的文件收集平台。智能分类、全文检索、实时统计，让管理不再繁琐。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/dashboard" className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg shadow-gray-900/10 dark:shadow-white/10 w-full sm:w-auto justify-center">
              开始使用
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/about" className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all w-full sm:w-auto justify-center">
              了解更多
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { title: '一键收集', desc: '链接与二维码，覆盖多终端场景' },
              { title: '实时透视', desc: '进度、类型、容量实时更新' },
              { title: '极致安全', desc: 'JWT + 权限分级，守护数据' }
            ].map((item, i) => (
              <div
                key={item.title}
                className={`rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/60 dark:bg-gray-900/40 px-5 py-4 backdrop-blur-sm transition-all duration-700 ${hero.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${300 + i * 150}ms` }}
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{item.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={steps.ref} className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${steps.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">三步开始收集</h2>
            <p className="text-gray-500 dark:text-gray-400">从创建任务到收齐文件，只需三步</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: '创建任务', desc: '设置任务名称、截止时间和文件要求，一键生成收集链接与二维码', icon: <FileText className="w-6 h-6" /> },
              { step: '02', title: '分发链接', desc: '将链接或二维码分享给提交者，支持密码保护和访问限制', icon: <Globe className="w-6 h-6" /> },
              { step: '03', title: '自动归档', desc: '提交的文件自动分类归档，实时查看进度和统计数据', icon: <Layers className="w-6 h-6" /> },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`flex flex-col items-center text-center transition-all duration-700 ${steps.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 200}ms` }}
              >
                <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-gray-900 mb-5 shadow-lg shadow-gray-900/10 dark:shadow-white/10">
                  {item.icon}
                </div>
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500 mb-2 tracking-widest">STEP {item.step}</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={features.ref} id="features" className="py-24 px-4 sm:px-6 bg-gray-50/80 dark:bg-gray-950/50">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${features.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">为收集而生的功能</h2>
            <p className="text-gray-500 dark:text-gray-400">精心设计的能力矩阵，覆盖文件收集全链路</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Upload className="w-5 h-5" />, title: '便捷收集', desc: '一键生成链接与二维码，多格式支持，自动重命名归档' },
              { icon: <Search className="w-5 h-5" />, title: '全文搜索', desc: '基于 PostgreSQL 高效全文检索，毫秒级定位目标文件' },
              { icon: <BarChart3 className="w-5 h-5" />, title: '实时统计', desc: '可视化数据面板，收集进度、文件分布一目了然' },
              { icon: <Shield className="w-5 h-5" />, title: '安全审计', desc: 'JWT 认证 + Spring Security 权限体系，操作全程可追溯' },
              { icon: <Zap className="w-5 h-5" />, title: '分片上传', desc: '5MB 分片、断点续传、秒传校验，大文件不再卡顿' },
              { icon: <Smartphone className="w-5 h-5" />, title: '全端适配', desc: '响应式 + PWA 离线支持，手机平板电脑无缝切换' },
            ].map((item, i) => (
              <div
                key={item.title}
                className={`group p-6 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900/60 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-white/5 transition-all duration-500 ${features.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-11 h-11 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-900 dark:text-white mb-4 group-hover:bg-gray-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-gray-900 transition-colors duration-300">
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={stats.ref} className="py-24 px-4 sm:px-6">
        <div className={`max-w-5xl mx-auto transition-all duration-700 ${stats.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="rounded-3xl border border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/60 shadow-xl shadow-gray-900/5 dark:shadow-white/5 backdrop-blur-sm overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                { value: '99.9%', label: '服务可用' },
                { value: '<100ms', label: '响应时间' },
                { value: '500MB', label: '单文件上限' },
                { value: '∞', label: '收集次数' },
              ].map((item, i) => (
                <div key={item.label} className={`text-center py-10 px-6 ${i < 3 ? 'border-r border-gray-100 dark:border-gray-800' : ''}`}>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">{item.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={tech.ref} id="tech" className="py-24 px-4 sm:px-6 bg-gray-50/80 dark:bg-gray-950/50">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${tech.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">技术架构</h2>
            <p className="text-gray-500 dark:text-gray-400">基于主流开源技术栈构建，稳定可靠</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'Next.js 14', desc: '前端框架' },
              { name: 'Spring Boot 3', desc: '后端服务' },
              { name: 'PostgreSQL 16', desc: '数据存储' },
              { name: 'Redis', desc: '高速缓存' },
              { name: 'MinIO', desc: '对象存储' },
              { name: 'TypeScript', desc: '类型安全' },
              { name: 'Tailwind CSS', desc: '样式系统' },
              { name: 'Docker', desc: '容器部署' },
            ].map((t, i) => (
              <div
                key={t.name}
                className={`p-5 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900/60 text-center hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all duration-500 ${tech.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={faq.ref} className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-700 ${faq.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">常见问题</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: '支持哪些文件格式？', a: '支持所有常见文件格式，包括文档、图片、压缩包、视频等，单文件最大支持 500MB。' },
              { q: '数据安全如何保障？', a: '采用 JWT 无状态认证、HTTPS 传输加密，文件存储于独立对象存储服务，支持权限分级管理。' },
              { q: '可以私有化部署吗？', a: '完全支持。项目开源，提供 Docker 一键部署方案，数据完全自主可控。' },
              { q: '有收集数量限制吗？', a: '管理员可在后台灵活配置用户配额和任务数量上限，默认无硬性限制。' },
            ].map((item, i) => (
              <details
                key={item.q}
                className={`group rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-gray-900/60 overflow-hidden transition-all duration-500 ${faq.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {item.q}
                  <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section ref={cta.ref} className="py-24 px-4 sm:px-6 bg-gray-900 dark:bg-white">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${cta.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h2 className="text-3xl sm:text-4xl font-bold text-white dark:text-gray-900 mb-4 tracking-tight">准备好开始了吗？</h2>
          <p className="text-gray-400 dark:text-gray-600 mb-10 text-lg">免费注册，立即体验智能文件收集</p>
          <Link href="/register" className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shadow-lg">
            免费开始
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="py-12 px-4 sm:px-6 border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-900 dark:bg-white rounded flex items-center justify-center">
                <Upload className="w-3 h-3 text-white dark:text-gray-900" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">云集</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">服务条款</Link>
              <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">隐私政策</Link>
              <Link href="/docs" className="hover:text-gray-900 dark:hover:text-white transition-colors">使用文档</Link>
              <Link href="/feedback" className="hover:text-gray-900 dark:hover:text-white transition-colors">反馈</Link>
              <a href="mailto:i@caiths.com" className="hover:text-gray-900 dark:hover:text-white transition-colors">联系我们</a>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">© 2024 在虎</p>
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
