'use client';

import { useState, useEffect } from 'react';
import { getFileStatistics, formatFileSize, type FileStatistics } from '@/lib/api/statistics';
import StatisticsCard from './StatisticsCard';

export default function StatisticsDashboard() {
  const [statistics, setStatistics] = useState<FileStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await getFileStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!statistics) {
    return <div className="text-center text-gray-500">加载统计数据失败</div>;
  }

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatisticsCard
          title="总文件数"
          value={statistics.totalFiles}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          }
        />
        <StatisticsCard
          title="总存储空间"
          value={formatFileSize(statistics.totalStorageSize)}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
          }
        />
        <StatisticsCard
          title="本周上传"
          value={statistics.weekUploads}
          color="purple"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          }
        />
        <StatisticsCard
          title="今日上传"
          value={statistics.todayUploads}
          color="orange"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
        />
      </div>

      {/* 文件类型分布 */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">文件类型分布</h3>
        <div className="space-y-3">
          {statistics.fileTypeDistribution.map((item) => (
            <div key={item.type}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600 dark:text-gray-400">{item.typeName}</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {item.count} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                <div
                  className="bg-gray-900 dark:bg-white h-1.5 rounded-full transition-all"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 上传趋势 */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">上传趋势（最近7天）</h3>
        <div className="h-48 flex items-end justify-between gap-2">
          {statistics.uploadTrend.map((item, index) => {
            const maxCount = Math.max(...statistics.uploadTrend.map((t) => t.count));
            const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full relative group">
                  <div
                    className="w-full bg-gray-900 dark:bg-white rounded-t hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                    style={{ height: `${Math.max(height, 4)}px`, minHeight: '4px' }}
                  ></div>
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-lg py-1.5 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                    {item.count} 个文件<br />{formatFileSize(item.size)}
                  </div>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {new Date(item.date).getDate()}日
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 存储空间使用 */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">存储空间使用</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">已使用</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {formatFileSize(statistics.storageUsage.used)}
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                statistics.storageUsage.percentage > 80
                  ? 'bg-red-500'
                  : statistics.storageUsage.percentage > 60
                  ? 'bg-yellow-500'
                  : 'bg-gray-900 dark:bg-white'
              }`}
              style={{ width: `${statistics.storageUsage.percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">总容量</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {formatFileSize(statistics.storageUsage.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
