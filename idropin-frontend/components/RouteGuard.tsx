'use client';

import { useRouteCheck } from '@/lib/hooks/useRouteCheck';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { isChecking, isDisabled, message } = useRouteCheck();

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">检查路由状态...</p>
        </div>
      </div>
    );
  }

  if (isDisabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">功能已禁用</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回登录
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
