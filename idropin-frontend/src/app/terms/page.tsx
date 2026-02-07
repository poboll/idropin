'use client';

import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
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
            <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            服务条款
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            最后更新：2026年1月30日
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. 服务说明
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              云集（Idrop.in）是一个文件收集与管理平台，为用户提供文件上传、收集、管理和分享服务。
              使用本服务即表示您同意遵守本服务条款。
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. 用户责任
            </h2>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>您必须提供准确、完整的注册信息</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>您有责任保护您的账户安全和密码</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>您不得上传违法、侵权或有害内容</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>您不得滥用本服务或干扰其他用户使用</span>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. 内容政策
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
              用户上传的内容必须符合法律法规，不得包含：
            </p>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>侵犯他人知识产权的内容</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>色情、暴力或其他违法内容</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>恶意软件或病毒</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mt-2 flex-shrink-0" />
                <span>垃圾信息或欺诈内容</span>
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. 服务变更
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              我们保留随时修改、暂停或终止服务的权利。重大变更将提前通知用户。
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. 免责声明
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              本服务按“现状”提供，我们不对服务的可用性、准确性或完整性做出任何保证。
              对于因使用本服务而产生的任何损失，我们不承担责任。
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. 联系我们
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              如有任何问题或建议，请通过以下方式联系我们：
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
