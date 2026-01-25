'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Search, Cloud } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full mb-6">
            <Cloud className="w-10 h-10 text-slate-400 dark:text-slate-500" />
          </div>
          
          <h1 className="text-8xl font-bold text-slate-300 dark:text-slate-700 mb-2">
            404
          </h1>
          
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
            页面未找到
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400">
            抱歉，您访问的页面不存在或已被移除
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
            您可以尝试以下操作：
          </p>
          <ul className="text-slate-500 dark:text-slate-400 text-sm space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
              检查网址是否输入正确
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
              返回首页重新导航
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
              使用搜索功能查找内容
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
              如有问题请联系客服
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回上一页
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            返回首页
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
          <Link
            href="/dashboard/search"
            className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors text-sm"
          >
            <Search className="w-4 h-4" />
            使用搜索功能查找内容
          </Link>
        </div>

        <p className="text-slate-400 text-sm mt-8">
          © 2024 Idrop.in 云集
        </p>
      </div>
    </div>
  );
}
