'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSuperAdmin, isAuthenticated, isLoading, system } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoading && isAuthenticated && !isSuperAdmin && !system) {
      router.push('/dashboard');
    }
  }, [mounted, isLoading, isAuthenticated, isSuperAdmin, system, router]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">验证权限中...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin && !system) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            需要管理员权限
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            您没有访问管理后台的权限。如需帮助，请联系系统管理员。
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              返回仪表盘
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                前往登录
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
