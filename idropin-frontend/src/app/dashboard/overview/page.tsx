'use client';

import { useEffect, useState } from 'react';
import { FileText, Database, UploadCloud, Calendar, Clock } from 'lucide-react';
import { getFileStatistics, FileStatistics, formatFileSize } from '@/lib/api/statistics';
import { getFiles, FileItem } from '@/lib/api/files';
import { useAuthStore } from '@/lib/stores/auth';
import Link from 'next/link';

export default function OverviewPage() {
  const [stats, setStats] = useState<FileStatistics | null>(null);
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, filesData] = await Promise.all([
        getFileStatistics(),
        getFiles({ page: 1, size: 5 })
      ]);
      setStats(statsData);
      setRecentFiles(filesData.records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: '文件总数',
      value: stats ? stats.totalFiles.toString() : '-',
      sub: '个人累计上传',
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: '占用空间',
      value: stats ? formatFileSize(stats.totalStorageSize) : '-',
      sub: `总容量: ${stats?.storageUsage?.total ? formatFileSize(stats.storageUsage.total) : '无限制'}`,
      icon: Database,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: '今日上传',
      value: stats ? stats.todayUploads.toString() : '-',
      sub: '今日新增文件',
      icon: UploadCloud,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: '本月上传',
      value: stats ? stats.monthUploads.toString() : '-',
      sub: '本月活跃度',
      icon: Calendar,
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          你好，{user?.username || '用户'} 👋
        </h1>
        <span className="text-sm text-slate-500">数据实时更新</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="glass-card p-6 flex items-center justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div>
              <p className="text-sm text-slate-500 mb-1">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{card.value}</h3>
              <p className="text-xs text-slate-400">{card.sub}</p>
            </div>
            <div className={`p-4 rounded-2xl ${card.bg}`}>
              <card.icon className={`w-8 h-8 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              最近上传
            </h3>
            <Link href="/dashboard/files" className="text-sm text-blue-500 hover:text-blue-600">
              查看全部
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-500 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-lg">文件名</th>
                  <th className="px-4 py-3 font-medium">大小</th>
                  <th className="px-4 py-3 font-medium rounded-tr-lg">上传时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {recentFiles.length > 0 ? (
                  recentFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200 max-w-[200px] truncate">
                        {file.originalName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {formatFileSize(file.fileSize)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(file.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                      暂无上传记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-center">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-500" />
            存储使用情况
          </h3>
          
          <div className="text-center space-y-6">
            <div className="relative w-40 h-40 mx-auto">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#eee"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray={`${stats?.storageUsage?.percentage || 0}, 100`}
                  className="animate-[spin_1s_ease-out_reverse]"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.storageUsage?.percentage || 0}%
                </span>
                <span className="text-xs text-slate-400">已使用</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">已用空间</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  {stats ? formatFileSize(stats.storageUsage.used) : '-'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">剩余空间</p>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  {stats ? formatFileSize(stats.storageUsage.remaining) : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
