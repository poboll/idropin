import dynamic from 'next/dynamic';

const StatisticsPageClient = dynamic(() => import('./StatisticsPageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">加载统计数据...</p>
      </div>
    </div>
  ),
});

export default function StatisticsPage() {
  return <StatisticsPageClient />;
}
