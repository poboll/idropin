'use client';

import { useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import ShareList from '@/components/shares/ShareList';

export default function SharesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">文件分享</h1>
                <p className="mt-2 text-gray-600">管理你的文件分享链接</p>
              </div>
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                分享文件
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
