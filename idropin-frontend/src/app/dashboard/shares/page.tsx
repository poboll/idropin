'use client';

import { useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import ShareList from '@/components/shares/ShareList';
import { Share2, ArrowRight } from 'lucide-react';

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
              分享文件
              <ArrowRight className="w-4 h-4" />
            </button>
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
