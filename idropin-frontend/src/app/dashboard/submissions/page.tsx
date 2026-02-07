'use client';

import AuthGuard from '@/components/auth/AuthGuard';

export default function SubmissionsPage() {
  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="page-header">
          <div>
            <h1 className="page-title">提交记录</h1>
            <p className="page-description">查看你的所有提交记录</p>
          </div>
        </div>

        <div className="card p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            该页面暂未实现。你可以在任务列表中点击“查看提交”，进入单个任务的提交记录页。
          </p>
        </div>
      </div>
    </AuthGuard>
  );
}
