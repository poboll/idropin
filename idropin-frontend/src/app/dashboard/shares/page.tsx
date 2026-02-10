'use client';

import { useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import ShareList from '@/components/shares/ShareList';
import { Share2, ArrowRight, Info } from 'lucide-react';

export default function SharesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AuthGuard>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="page-header animate-slide-in-down">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">文件分享</h1>
              <p className="page-description">管理你的文件分享链接</p>
            </div>
            <button
              onClick={() => (window.location.href = '/dashboard/files')}
              className="btn-primary hover-lift"
            >
              <Share2 className="w-4 h-4" />
              去分享文件
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="card p-4 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 animate-slide-in-up">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-900 dark:text-gray-100">
              <p className="font-medium mb-1">如何创建分享？</p>
              <p className="text-gray-700 dark:text-gray-300">
                前往&ldquo;文件管理&rdquo;页面，在文件列表中找到要分享的文件，点击&ldquo;分享&rdquo;按钮即可创建分享链接。
              </p>
            </div>
          </div>
        </div>

        {/* Share List */}
        <div key={refreshKey} className="animate-slide-in-up" style={{ animationDelay: '100ms' }}>
          <ShareList />
        </div>
      </div>
    </AuthGuard>
  );
}
