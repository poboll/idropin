'use client';

import Link from 'next/link';
import { ArrowLeft, Bell } from 'lucide-react';

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回首页</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7 text-gray-600 dark:text-gray-400" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              反馈入口已迁移
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">请在通知界面提交反馈与建议</p>
          </div>

          <div className="card p-6">
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  为了统一体验，原本的 <span className="font-medium">/feedback</span> 提交入口已停用。
                  现在请登录后，在右上角 <span className="font-medium">铃铛（通知）</span> 中切换到「反馈」提交。
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/login" className="btn-primary w-full">
                  去登录
                </Link>
                <Link href="/dashboard" className="btn-secondary w-full">
                  打开仪表盘
                </Link>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                如需邮件联系：{' '}
                <a
                  href="mailto:i@caiths.com"
                  className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                >
                  i@caiths.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center border-t border-gray-200 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © 2024 在虎
        </p>
      </footer>
    </div>
  );
}
