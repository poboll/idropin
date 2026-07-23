'use client';

import dynamic from 'next/dynamic';

const StatisticsPageClient = dynamic(() => import('./StatisticsPageClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">加载统计数据中...</p>
      </div>
    </div>
  ),
});

export default function StatisticsPage() {
  return <StatisticsPageClient />;
}
