'use client';

import { useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import ShareList from '@/components/shares/ShareList';
import { Share2, ArrowRight, Info } from 'lucide-react';

export default function SharesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">文件分享</h1>
              <p className="page-description">管理你的文件分享链接</p>
            </div>
            <button
              onClick={() => (window.location.href = '/dashboard/files')}
              className="btn-primary"
            >
              <Share2 className="w-4 h-4" />
              去分享文件
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">如何创建分享？</p>
              <p className="text-blue-700 dark:text-blue-300">
                前往"文件管理"页面，在文件列表中找到要分享的文件，点击"分享"按钮即可创建分享链接。
              </p>
            </div>
          </div>
        </div>

        {/* Share List */}
        <div key={refreshKey}>
          <ShareList />
        </div>
      </div>
    </AuthGuard>
  );
}
