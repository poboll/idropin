'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, MessageSquare, Settings } from 'lucide-react';
import { AuthGuard } from '@/components/auth';
import { useAuthStore } from '@/lib/stores/auth';

const manageNavItems = [
  { key: 'overview', label: '概况', icon: LayoutDashboard, href: '/dashboard/manage/overview' },
  { key: 'user', label: '用户', icon: Users, href: '/dashboard/manage/user' },
  { key: 'wish', label: '需求', icon: MessageSquare, href: '/dashboard/manage/wish' },
  { key: 'config', label: '配置', icon: Settings, href: '/dashboard/manage/config' },
];

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSuperAdmin, isAuthenticated, isLoading } = useAuthStore();
  const currentKey = pathname.split('/').pop() || 'overview';

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, isSuperAdmin, router]);

  if (isLoading) return null;
  if (!isSuperAdmin) return null;

  return (
    <AuthGuard>
      <div className="flex gap-4 max-w-7xl mx-auto">
        <nav className="w-36 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {manageNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentKey === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-l-2 border-blue-600' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
