'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">系统设置</h1>
        <p className="page-description">管理你的偏好与账户配置</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Monitor className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">外观设置</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">选择你喜欢的界面主题</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: '浅色模式', icon: Sun },
            { value: 'dark', label: '深色模式', icon: Moon },
            { value: 'system', label: '跟随系统', icon: Monitor },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2.5 transition-all ${
                theme === value
                  ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${theme === value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`} />
              <span className={`text-xs font-medium ${theme === value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 通知设置 */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">通知设置</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">管理系统通知与提醒</p>
          </div>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">启用邮件通知</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">当有新文件提交时发送邮件提醒</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notifications}
            onClick={() => setNotifications(v => !v)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              notifications ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full transition-transform ${
              notifications
                ? 'translate-x-[18px] bg-white dark:bg-gray-900'
                : 'translate-x-[3px] bg-white dark:bg-gray-400'
            }`} />
          </button>
        </div>
      </div>

      {/* 通用设置 */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">通用设置</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">其他系统行为配置</p>
          </div>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">自动保存表单</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">在编辑任务时自动保存草稿</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoSave}
            onClick={() => setAutoSave(v => !v)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              autoSave ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full transition-transform ${
              autoSave
                ? 'translate-x-[18px] bg-white dark:bg-gray-900'
                : 'translate-x-[3px] bg-white dark:bg-gray-400'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
}
