'use client';

import { useEffect, useState } from 'react';
import { FileText, HardDrive, Upload, Calendar, Clock, ArrowRight } from 'lucide-react';
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
    },
    {
      title: '占用空间',
      value: stats ? formatFileSize(stats.totalStorageSize) : '-',
      sub: `总容量: ${stats?.storageUsage?.total ? formatFileSize(stats.storageUsage.total) : '无限制'}`,
      icon: HardDrive,
    },
    {
      title: '今日上传',
      value: stats ? stats.todayUploads.toString() : '-',
      sub: '今日新增文件',
      icon: Upload,
    },
    {
      title: '本月上传',
      value: stats ? stats.monthUploads.toString() : '-',
      sub: '本月活跃度',
      icon: Calendar,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">你好，{user?.username || '用户'}</h1>
            <p className="page-description">数据实时更新</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <card.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            <p className="stat-label">{card.title}</p>
            <p className="stat-value">{card.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              最近上传
            </h3>
            <Link href="/dashboard/files" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors">
              查看全部
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>文件名</th>
                  <th>大小</th>
                  <th>上传时间</th>
                </tr>
              </thead>
              <tbody>
                {recentFiles.length > 0 ? (
                  recentFiles.map((file) => (
                    <tr key={file.id}>
                      <td className="max-w-[200px] truncate">{file.originalName}</td>
                      <td>{formatFileSize(file.fileSize)}</td>
                      <td>{new Date(file.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center py-8 text-gray-400">
                      暂无上传记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-gray-500" />
            存储使用情况
          </h3>
          
          <div className="text-center space-y-5">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-gray-100 dark:text-gray-800"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${stats?.storageUsage?.percentage || 0}, 100`}
                  className="text-gray-900 dark:text-white"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats?.storageUsage?.percentage || 0}%
                </span>
                <span className="text-xs text-gray-500">已使用</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">已用空间</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {stats ? formatFileSize(stats.storageUsage.used) : '-'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">剩余空间</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
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
