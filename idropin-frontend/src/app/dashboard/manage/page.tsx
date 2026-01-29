'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Database, FileText, Eye, Archive, AlertTriangle,
  TrendingUp, TrendingDown, Minus, RefreshCw
} from 'lucide-react';
import { getOverviewStats, getOperationLogs, formatFileSize, OverviewStats, OperationLog } from '@/lib/api/admin';

export default function ManageOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, logsData] = await Promise.all([
        getOverviewStats(),
        getOperationLogs({ page: 1, size: 10 })
      ]);
      setStats(statsData);
      setLogs(logsData.records);
    } catch (error) {
      console.error('Failed to fetch overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const renderTrend = (current: number, yesterday: number) => {
    const diff = current - yesterday;
    if (diff > 0) {
      return (
        <span className="flex items-center text-green-600 text-xs">
          <TrendingUp className="w-3 h-3 mr-1" />
          +{diff}
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="flex items-center text-red-600 text-xs">
          <TrendingDown className="w-3 h-3 mr-1" />
          {diff}
        </span>
      );
    }
    return (
      <span className="flex items-center text-gray-400 text-xs">
        <Minus className="w-3 h-3 mr-1" />
        +0
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">应用管理</h1>
          <p className="text-sm text-gray-500 mt-1">平台概况与数据统计</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 子导航 */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        <Link
          href="/dashboard/manage"
          className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg font-medium"
        >
          概况
        </Link>
        <Link
          href="/dashboard/manage/users"
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          用户
        </Link>
        <Link
          href="/dashboard/manage/feedback"
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          需求
        </Link>
        <Link
          href="/dashboard/manage/config"
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          配置
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 用户数量 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            {stats && renderTrend(stats.userCount, stats.userCount - stats.userCountYesterday)}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.userCount || 0}</p>
            <p className="text-sm text-gray-500">用户数量</p>
          </div>
        </div>

        {/* 记录/OSS */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            {stats && renderTrend(stats.recordCount, stats.recordCount - stats.recordCountYesterday)}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.recordCount || 0}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({formatFileSize(stats?.ossStorageBytes || 0)})
              </span>
            </p>
            <p className="text-sm text-gray-500">记录/OSS</p>
          </div>
        </div>

        {/* 日志数量 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            {stats && renderTrend(stats.logCount, stats.logCount - stats.logCountYesterday)}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.logCount || 0}</p>
            <p className="text-sm text-gray-500">日志数量</p>
          </div>
        </div>

        {/* PV/UV */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Eye className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.pvCount || 0}/{stats?.uvCount || 0}
            </p>
            <p className="text-sm text-gray-500">
              PV/UV · 历史: {stats?.historyPvCount || 0}/{stats?.historyUvCount || 0}
            </p>
          </div>
        </div>

        {/* 归档文件 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
              <Archive className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.archivedFileCount || 0}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({formatFileSize(stats?.archivedFileSize || 0)})
              </span>
            </p>
            <p className="text-sm text-gray-500">归档文件</p>
          </div>
        </div>

        {/* 无效文件 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.invalidFileCount || 0}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({formatFileSize(stats?.invalidFileSize || 0)})
              </span>
            </p>
            <p className="text-sm text-gray-500">已失效</p>
          </div>
        </div>
      </div>

      {/* 操作日志 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">最近操作日志</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {logs.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-500">暂无操作日志</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{log.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {log.operatorName} · {log.ipAddress}
                  </p>
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap ml-4">
                  {formatTime(log.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
