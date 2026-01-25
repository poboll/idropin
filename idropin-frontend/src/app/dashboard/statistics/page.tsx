'use client'

import { useStatistics } from '@/lib/hooks/useStatistics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatBytes } from '@/lib/utils';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StatisticsPage() {
  const { statistics, loading, error, connected, refresh } = useStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>加载统计数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              连接错误
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={refresh} className="w-full">
              重试连接
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>暂无数据</p>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">数据统计</h1>
          <p className="text-gray-600 mt-1">
            {connected ? '✓ 实时连接中' : '✗ 连接已断开'}
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">总文件数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalFiles}</div>
            <p className="text-xs text-gray-500 mt-1">个文件</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">总存储大小</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(statistics.totalStorageSize)}</div>
            <p className="text-xs text-gray-500 mt-1">已使用</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">今日上传</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.todayUploads}</div>
            <p className="text-xs text-gray-500 mt-1">个文件</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">本周上传</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.weekUploads}</div>
            <p className="text-xs text-gray-500 mt-1">个文件</p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 上传趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>上传趋势（最近7天）</CardTitle>
            <CardDescription>每日上传文件数量</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={statistics.uploadTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  name="文件数"
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 文件类型分布 */}
        <Card>
          <CardHeader>
            <CardTitle>文件类型分布</CardTitle>
            <CardDescription>按类型统计文件数量</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statistics.fileTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ typeName, percentage }) => `${typeName} ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statistics.fileTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 分类统计 */}
      <Card>
        <CardHeader>
          <CardTitle>分类统计</CardTitle>
          <CardDescription>按分类统计文件数量和存储大小</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statistics.categoryStatistics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoryName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="fileCount" fill="#3b82f6" name="文件数" />
              <Bar dataKey="storageSize" fill="#10b981" name="存储大小(字节)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 存储空间使用 */}
      <Card>
        <CardHeader>
          <CardTitle>存储空间使用</CardTitle>
          <CardDescription>总容量 {formatBytes(statistics.storageUsage.total)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${statistics.storageUsage.percentage}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">已使用</p>
                <p className="font-semibold">{formatBytes(statistics.storageUsage.used)}</p>
              </div>
              <div>
                <p className="text-gray-600">剩余</p>
                <p className="font-semibold">{formatBytes(statistics.storageUsage.remaining)}</p>
              </div>
              <div>
                <p className="text-gray-600">使用率</p>
                <p className="font-semibold">{statistics.storageUsage.percentage.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
