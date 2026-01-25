'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import LoadingScreen from '@/components/LoadingScreen';

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
  }, [fetchCurrentUser, isMounted]);

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
  if (isChecking || isLoading) {
    return <LoadingScreen message="验证登录状态" />;
  }

  // 未认证时不渲染内容（等待跳转）
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
