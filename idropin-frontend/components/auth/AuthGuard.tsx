'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, fetchCurrentUser } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    const checkAuth = async () => {
      // 尝试获取当前用户信息验证 token
      await fetchCurrentUser();
      setIsChecking(false);
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]); // 只依赖 isMounted，避免 fetchCurrentUser 导致无限循环

  useEffect(() => {
    if (!isMounted) return;
    
    if (!isChecking && !isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isChecking, isLoading, isAuthenticated, router, isMounted]);

  // 防止 hydration 错误：在客户端挂载前不渲染任何内容
  if (!isMounted) {
    return null;
  }

  // 显示加载状态
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">验证登录状态...</p>
        </div>
      </div>
    );
  }

  // 未认证时不渲染内容（等待跳转）
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
