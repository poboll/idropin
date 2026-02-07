'use client';

import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回首页</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Title */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-900 rounded-lg mb-6">
            <Shield className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            隐私政策
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            最后更新：2026年1月30日
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. 信息收集
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              我们收集以下类型的信息：
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>账户信息：用户名、邮箱地址、密码（加密存储）</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>文件信息：您上传的文件及其元数据</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>使用数据：访问日志、设备信息、IP地址</span>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. 信息使用
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              我们使用收集的信息用于：
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>提供和改进我们的服务</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>处理您的请求和交易</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>发送服务相关通知</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>保护服务安全和防止滥用</span>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. 信息存储与安全
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              我们采取适当的技术和组织措施保护您的个人信息，包括：
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>数据加密传输（HTTPS）</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>密码加密存储</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>访问控制和权限管理</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>定期安全审计</span>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. 信息共享
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              我们不会出售您的个人信息。仅在以下情况下可能共享信息：
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>经您明确同意</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>法律要求或政府机关依法要求</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>保护我们的合法权益</span>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. 您的权利
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              您有权：
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>访问和更新您的个人信息</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>删除您的账户和数据</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>导出您的数据</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>撤回同意</span>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Cookie 使用
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              我们使用 Cookie 和类似技术来改善用户体验、分析服务使用情况。
              您可以通过浏览器设置管理 Cookie 偏好。
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. 政策更新
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              我们可能会不时更新本隐私政策。重大变更将通过网站公告或邮件通知您。
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. 联系我们
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              如有任何隐私相关问题，请联系我们：
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              邮箱：<a href="mailto:i@caiths.com" className="text-gray-900 dark:text-white hover:underline">i@caiths.com</a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2024 在虎
          </p>
        </div>
      </footer>
    </div>
  );
}
