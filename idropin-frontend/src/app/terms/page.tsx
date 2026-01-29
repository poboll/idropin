'use client';

import Link from 'next/link';

export default function TermsPage() {
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
            服务条款
          </h1>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              最后更新日期：2026年1月27日
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                1. 服务说明
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                云集（Idrop.in）是一个文件收集与管理平台，为用户提供文件上传、收集、管理和分享服务。
                使用本服务即表示您同意遵守本服务条款。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                2. 用户责任
              </h2>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
                <li>您必须提供准确、完整的注册信息</li>
                <li>您有责任保护您的账户安全和密码</li>
                <li>您不得上传违法、侵权或有害内容</li>
                <li>您不得滥用本服务或干扰其他用户使用</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                3. 内容政策
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                用户上传的内容必须符合法律法规，不得包含：
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mt-2">
                <li>侵犯他人知识产权的内容</li>
                <li>色情、暴力或其他违法内容</li>
                <li>恶意软件或病毒</li>
                <li>垃圾信息或欺诈内容</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                4. 服务变更
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                我们保留随时修改、暂停或终止服务的权利。重大变更将提前通知用户。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                5. 免责声明
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                本服务按&ldquo;现状&rdquo;提供，我们不对服务的可用性、准确性或完整性做出任何保证。
                对于因使用本服务而产生的任何损失，我们不承担责任。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                6. 联系我们
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                如有任何问题或建议，请通过以下方式联系我们：
              </p>
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                邮箱：support@idrop.in
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
