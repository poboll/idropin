'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, fetchCurrentUser } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const verified = useRef(false);

  useEffect(() => {
    if (verified.current) return;
    verified.current = true;
    fetchCurrentUser().finally(() => setIsVerifying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isVerifying && !isAuthenticated) {
      const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.push(`/login${redirectParam}`);
    }
  }, [isVerifying, isAuthenticated, router, pathname]);

  if (isVerifying || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
