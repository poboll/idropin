'use client';

import { useAuthStore } from '@/lib/stores';
import { User, Mail, Calendar, Key, Camera } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">个人资料</h1>
        <p className="page-description">管理你的账户信息</p>
      </div>

      <div className="card p-8">
        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="relative group cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 text-2xl font-semibold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.username}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">普通用户</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="form-group">
            <label className="form-label">用户名</label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">{user?.username}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">邮箱</label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">{user?.email || '未绑定邮箱'}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">注册时间</label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">
                {user?.createdAt ? formatDate(user.createdAt) : '-'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">账户ID</label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Key className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white font-mono">{user?.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
