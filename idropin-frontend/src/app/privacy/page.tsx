'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* 返回按钮 */}
        <Link 
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">
            隐私政策
          </h1>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              最后更新日期：2026年1月27日
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                1. 信息收集
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                我们收集以下类型的信息：
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mt-2">
                <li>账户信息：用户名、邮箱地址、密码（加密存储）</li>
                <li>文件信息：您上传的文件及其元数据</li>
                <li>使用数据：访问日志、设备信息、IP地址</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                2. 信息使用
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                我们使用收集的信息用于：
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mt-2">
                <li>提供和改进我们的服务</li>
                <li>处理您的请求和交易</li>
                <li>发送服务相关通知</li>
                <li>保护服务安全和防止滥用</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                3. 信息存储与安全
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                我们采取适当的技术和组织措施保护您的个人信息，包括：
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mt-2">
                <li>数据加密传输（HTTPS）</li>
                <li>密码加密存储</li>
                <li>访问控制和权限管理</li>
                <li>定期安全审计</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                4. 信息共享
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                我们不会出售您的个人信息。仅在以下情况下可能共享信息：
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mt-2">
                <li>经您明确同意</li>
                <li>法律要求或政府机关依法要求</li>
                <li>保护我们的合法权益</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                5. 您的权利
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                您有权：
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mt-2">
                <li>访问和更新您的个人信息</li>
                <li>删除您的账户和数据</li>
                <li>导出您的数据</li>
                <li>撤回同意</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                6. Cookie 使用
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                我们使用 Cookie 和类似技术来改善用户体验、分析服务使用情况。
                您可以通过浏览器设置管理 Cookie 偏好。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                7. 政策更新
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                我们可能会不时更新本隐私政策。重大变更将通过网站公告或邮件通知您。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                8. 联系我们
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                如有任何隐私相关问题，请联系我们：
              </p>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                邮箱：privacy@idrop.in
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
