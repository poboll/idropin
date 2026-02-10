'use client'

import { useStatistics } from '@/lib/hooks/useStatistics';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatBytes } from '@/lib/utils';
import { RefreshCw, AlertCircle, FileText, HardDrive, Upload, Calendar } from 'lucide-react';

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

  const COLORS = ['#111827', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#4b5563', '#1f2937', '#e5e7eb'];

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
              <CartesianGrid strokeDasharray="3 3" className="[&_line]:stroke-gray-200 dark:[&_line]:stroke-gray-700" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400" />
              <YAxis tick={{ fontSize: 12 }} className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--tooltip-bg, #fff)', 
                  border: '1px solid var(--tooltip-border, #e5e5e5)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  color: 'var(--tooltip-text, #171717)',
                }} 
                wrapperClassName="[&]:!border-0 [--tooltip-bg:theme(colors.white)] dark:[--tooltip-bg:theme(colors.gray.900)] [--tooltip-border:theme(colors.gray.200)] dark:[--tooltip-border:theme(colors.gray.700)] [--tooltip-text:theme(colors.gray.900)] dark:[--tooltip-text:theme(colors.gray.100)]"
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#374151"
                strokeWidth={2}
                name="文件数"
                dot={{ fill: '#374151', strokeWidth: 2 }}
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
                {statistics.fileTypeDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--tooltip-bg, #fff)', 
                  border: '1px solid var(--tooltip-border, #e5e5e5)',
                  borderRadius: '8px',
                  color: 'var(--tooltip-text, #171717)',
                }} 
                wrapperClassName="[&]:!border-0 [--tooltip-bg:theme(colors.white)] dark:[--tooltip-bg:theme(colors.gray.900)] [--tooltip-border:theme(colors.gray.200)] dark:[--tooltip-border:theme(colors.gray.700)] [--tooltip-text:theme(colors.gray.900)] dark:[--tooltip-text:theme(colors.gray.100)]"
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
        {statistics.categoryStatistics && statistics.categoryStatistics.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={statistics.categoryStatistics}
                  margin={{ top: 20, right: 30, left: 30, bottom: 80 }}
                >
                  <defs>
                    <linearGradient id="barGray" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1f2937" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#4b5563" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="barGrayDark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e5e7eb" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#9ca3af" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="[&_line]:stroke-gray-200 dark:[&_line]:stroke-gray-700" vertical={false} />
                  <XAxis
                    dataKey="categoryName"
                    tick={{ fontSize: 11 }}
                    className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400"
                    angle={-25}
                    textAnchor="end"
                    height={90}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="[&_text]:fill-gray-500 dark:[&_text]:fill-gray-400"
                    label={{ value: '文件数', angle: -90, position: 'insideLeft', fontSize: 11, offset: -5 }}
                    width={50}
                  />
                  <Tooltip
                    formatter={(value, name, props) => {
                      if (name === '文件数') {
                        const storage = props.payload?.storageSize;
                        return [`${value} 个（占用 ${formatBytes(storage || 0)}）`, name];
                      }
                      return [value, name];
                    }}
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #fff)',
                      border: '1px solid var(--tooltip-border, #e5e5e5)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      color: 'var(--tooltip-text, #171717)',
                      padding: '8px 12px',
                    }}
                    wrapperClassName="[&]:!border-0 [--tooltip-bg:theme(colors.white)] dark:[--tooltip-bg:theme(colors.gray.900)] [--tooltip-border:theme(colors.gray.200)] dark:[--tooltip-border:theme(colors.gray.700)] [--tooltip-text:theme(colors.gray.900)] dark:[--tooltip-text:theme(colors.gray.100)]"
                    cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                  />
                  <Bar
                    dataKey="fileCount"
                    fill="url(#barGray)"
                    name="文件数"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={50}
                    className="dark:fill-[url(#barGrayDark)]"
                  />
                </BarChart>
              </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-gray-400 dark:text-gray-600">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无分类数据</p>
            </div>
          </div>
        )}
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
