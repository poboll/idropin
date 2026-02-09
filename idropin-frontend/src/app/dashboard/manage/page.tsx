'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Database, FileText, Eye, Archive, AlertTriangle, HardDrive, Activity,
  TrendingUp, TrendingDown, Minus, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getOverviewStats, getOperationLogs, formatFileSize, OverviewStats, OperationLog } from '@/lib/api/admin';

export default function ManageOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logPage, setLogPage] = useState(1);
  const [logPages, setLogPages] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [logPageSize, setLogPageSize] = useState(10);
  const [jumpPage, setJumpPage] = useState('');

  const fetchData = async (page = logPage, size = logPageSize) => {
    setLoading(true);
    try {
      const [statsData, logsData] = await Promise.all([
        getOverviewStats(),
        getOperationLogs({ page, size })
      ]);
      setStats(statsData);
      setLogs(logsData.records);
      setLogPage(logsData.current);
      setLogPages(logsData.pages);
      setLogTotal(logsData.total);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">加载管理数据中...</p>
        </div>
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
          onClick={() => fetchData()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 子导航 */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        <Link
          href="/dashboard/manage"
          className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg font-medium"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 用户数量 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            {stats && renderTrend(stats.userCount, stats.userCountYesterday)}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.userCount || 0}</p>
            <p className="text-sm text-gray-500">用户数量</p>
          </div>
        </div>

        {/* 记录/OSS */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <Database className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            {stats && renderTrend(stats.recordCount, stats.recordCountYesterday)}
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
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            {stats && renderTrend(stats.logCount, stats.logCountYesterday)}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.logCount || 0}</p>
            <p className="text-sm text-gray-500">日志数量</p>
          </div>
        </div>

        {/* 今日活跃 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.activeUserCount || 0}
            </p>
            <p className="text-sm text-gray-500">
              活跃用户
            </p>
          </div>
        </div>

        {/* 存储使用 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <HardDrive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatFileSize(stats?.ossStorageBytes || 0)}
            </p>
            <p className="text-sm text-gray-500">总存储使用</p>
          </div>
        </div>

        {/* 无效文件 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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

        {/* PV/UV */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.pvCount || 0}/{stats?.uvCount || 0}
            </p>
            <p className="text-sm text-gray-500">
              今日 PV/UV
              <span className="text-xs text-gray-400 ml-2">
                历史: {stats?.historyPvCount || 0}/{stats?.historyUvCount || 0}
              </span>
            </p>
          </div>
        </div>

        {/* 归档文件 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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

        {logPages > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">共 {logTotal} 条</span>
              <select
                value={logPageSize}
                onChange={(e) => { const s = Number(e.target.value); setLogPageSize(s); fetchData(1, s); }}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
              >
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchData(logPage - 1)}
                disabled={logPage <= 1}
                className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: Math.min(logPages, 5) }, (_, i) => {
                let p: number;
                if (logPages <= 5) { p = i + 1; }
                else if (logPage <= 3) { p = i + 1; }
                else if (logPage >= logPages - 2) { p = logPages - 4 + i; }
                else { p = logPage - 2 + i; }
                return (
                  <button
                    key={p}
                    onClick={() => fetchData(p)}
                    className={`min-w-[28px] h-7 text-xs rounded-lg border transition-colors ${
                      p === logPage
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900 dark:border-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => fetchData(logPage + 1)}
                disabled={logPage >= logPages}
                className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">跳至</span>
              <input
                type="number"
                min={1}
                max={logPages}
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const p = Math.min(Math.max(1, Number(jumpPage)), logPages);
                    fetchData(p);
                    setJumpPage('');
                  }
                }}
                className="w-14 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-center"
                placeholder=""
              />
              <span className="text-xs text-gray-500">页</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
