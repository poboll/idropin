'use client'

import { useStatistics } from '@/lib/hooks/useStatistics';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatBytes } from '@/lib/utils';
import { Loader2, RefreshCw, AlertCircle, FileText, HardDrive, Upload, Calendar } from 'lucide-react';

export default function StatisticsPage() {
  const { statistics, loading, error, connected, refresh } = useStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">加载统计数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">连接错误</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button onClick={refresh} className="btn-primary w-full">
            重试连接
          </button>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="empty-state">
          <FileText className="empty-state-icon" />
          <p className="empty-state-title">暂无数据</p>
          <p className="empty-state-description">统计数据将在有文件上传后显示</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#171717', '#525252', '#737373', '#a3a3a3', '#d4d4d4', '#e5e5e5'];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">数据统计</h1>
            <p className="page-description flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              {connected ? '实时连接中' : '连接已断开'}
            </p>
          </div>
          <button onClick={refresh} className="btn-secondary">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <p className="stat-label">总文件数</p>
          <p className="stat-value">{statistics.totalFiles}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <p className="stat-label">总存储大小</p>
          <p className="stat-value">{formatBytes(statistics.totalStorageSize)}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Upload className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <p className="stat-label">今日上传</p>
          <p className="stat-value">{statistics.todayUploads}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
          <p className="stat-label">本周上传</p>
          <p className="stat-value">{statistics.weekUploads}</p>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 上传趋势 */}
        <div className="card p-6">
          <div className="mb-6">
            <h3 className="text-base font-medium text-gray-900 dark:text-white">上传趋势</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">最近7天每日上传文件数量</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={statistics.uploadTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#737373" />
              <YAxis tick={{ fontSize: 12 }} stroke="#737373" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#171717"
                strokeWidth={2}
                name="文件数"
                dot={{ fill: '#171717', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 文件类型分布 */}
        <div className="card p-6">
          <div className="mb-6">
            <h3 className="text-base font-medium text-gray-900 dark:text-white">文件类型分布</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">按类型统计文件数量</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statistics.fileTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ typeName, percentage }) => `${typeName} ${percentage.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {statistics.fileTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 分类统计 */}
      <div className="card p-6">
        <div className="mb-6">
          <h3 className="text-base font-medium text-gray-900 dark:text-white">分类统计</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">按分类统计文件数量和存储大小</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={statistics.categoryStatistics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="categoryName" tick={{ fontSize: 12 }} stroke="#737373" />
            <YAxis tick={{ fontSize: 12 }} stroke="#737373" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e5e5',
                borderRadius: '8px'
              }} 
            />
            <Legend />
            <Bar dataKey="fileCount" fill="#171717" name="文件数" radius={[4, 4, 0, 0]} />
            <Bar dataKey="storageSize" fill="#737373" name="存储大小(字节)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 存储空间使用 */}
      <div className="card p-6">
        <div className="mb-6">
          <h3 className="text-base font-medium text-gray-900 dark:text-white">存储空间使用</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">总容量 {formatBytes(statistics.storageUsage.total)}</p>
        </div>
        <div className="space-y-4">
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gray-900 dark:bg-white h-full transition-all duration-500 rounded-full"
              style={{ width: `${statistics.storageUsage.percentage}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">已使用</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatBytes(statistics.storageUsage.used)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">剩余</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatBytes(statistics.storageUsage.remaining)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">使用率</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{statistics.storageUsage.percentage.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
