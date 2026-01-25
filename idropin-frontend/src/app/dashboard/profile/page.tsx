'use client';

import { useAuthStore } from '@/lib/stores';
import { User, Mail, Calendar, Key, Camera } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">个人资料</h1>

      <div className="glass-panel p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{user?.username}</h2>
            <p className="text-slate-500 dark:text-slate-400">普通用户</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">用户名</label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <User className="w-5 h-5 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-200">{user?.username}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">邮箱</label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <Mail className="w-5 h-5 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-200">{user?.email || '未绑定邮箱'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">注册时间</label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-200">
                {user?.createdAt ? formatDate(user.createdAt) : '-'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-500 dark:text-slate-400">账户ID</label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <Key className="w-5 h-5 text-slate-400" />
              <span className="text-slate-700 dark:text-slate-200">{user?.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
