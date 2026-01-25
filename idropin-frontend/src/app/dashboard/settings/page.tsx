'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white">系统设置</h1>

      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Monitor className="w-5 h-5" />
          外观设置
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
              theme === 'light' 
                ? 'border-blue-500 bg-blue-50/50 text-blue-600' 
                : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sun className="w-6 h-6" />
            <span className="text-sm font-medium">浅色模式</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
              theme === 'dark' 
                ? 'border-blue-500 bg-blue-50/50 text-blue-600' 
                : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Moon className="w-6 h-6" />
            <span className="text-sm font-medium">深色模式</span>
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
              theme === 'system' 
                ? 'border-blue-500 bg-blue-50/50 text-blue-600' 
                : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Monitor className="w-6 h-6" />
            <span className="text-sm font-medium">跟随系统</span>
          </button>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Bell className="w-5 h-5" />
          通知设置
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200">启用邮件通知</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">当有新文件提交时发送邮件提醒</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Shield className="w-5 h-5" />
          通用设置
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200">自动保存表单</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">在编辑任务时自动保存草稿</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
