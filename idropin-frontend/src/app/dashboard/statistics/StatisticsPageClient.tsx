'use client'

import { useState, useEffect, useMemo } from 'react';
import { useStatistics } from '@/lib/hooks/useStatistics';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { formatBytes } from '@/lib/utils';
import { useApi } from '@/lib/hooks/useApi';
import { RefreshCw, AlertCircle, FileText, HardDrive, Upload, Calendar, Database, Cpu, Brain, Layers, CheckCircle2, XCircle, Clock, Zap, Server, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface ArchMetrics {
  cache: { hits: number; misses: number; hitRate: number; totalKeys: number; memoryUsedBytes: number; memoryUsedHuman: string };
  kafka: { connected: boolean; totalProduced: number; totalConsumed: number; pendingMessages: number; topic: string; partitions: number };
  ai: { totalProcessed: number; pendingCount: number; successCount: number; failedCount: number; successRate: number; serviceAvailable: boolean; modelProvider: string };
  system: { postgresConnected: boolean; redisConnected: boolean; kafkaConnected: boolean; minioConnected: boolean; pgvectorEnabled: boolean; uptimeSeconds: number; javaVersion: string; heapUsedMB: number; heapMaxMB: number };
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      {ok && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
    </span>
  );
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const TS = {
  backgroundColor: 'var(--tw-bg,#fff)',
  border: '1px solid rgba(0,0,0,0.06)',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
  padding: '8px 12px',
  fontSize: '12px',
};

export default function StatisticsPage() {
  const { statistics, loading, error, connected, refresh } = useStatistics();
  const { data: arch, isLoading: archLoading, mutate: mutateArch } = useApi<ArchMetrics>('/statistics/architecture', { refreshInterval: 120000 });
  const [retrying, setRetrying] = useState(false);
  const [aiHistoryOpen, setAiHistoryOpen] = useState(true);
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [aiHistoryLoading, setAiHistoryLoading] = useState(false);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);

  useEffect(() => {
    setAiHistoryLoading(true);
    apiClient.get('/tasks/all-submissions')
      .then((res: any) => {
        const list = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
        setAllSubmissions(list);
        setAiHistory(list.filter((s: any) => s.aiStatus === 2 || s.aiStatus === 3));
      })
      .catch(() => {})
      .finally(() => setAiHistoryLoading(false));
  }, []);

  async function handleRetryPending() {
    setRetrying(true);
    try {
      await apiClient.post('/statistics/ai/retry-pending');
      setTimeout(() => mutateArch(), 3000);
    } finally {
      setRetrying(false);
    }
  }

  const scoredSubs = useMemo(() => allSubmissions.filter((s: any) => s.aiEvaluation?.score != null), [allSubmissions]);
  const scoreHistogram = useMemo(() => {
    const buckets = [{ range: '0-59', min: 0, max: 59, count: 0 }, { range: '60-69', min: 60, max: 69, count: 0 }, { range: '70-79', min: 70, max: 79, count: 0 }, { range: '80-89', min: 80, max: 89, count: 0 }, { range: '90-100', min: 90, max: 100, count: 0 }];
    scoredSubs.forEach((s: any) => { const sc = s.aiEvaluation.score; buckets.forEach(b => { if (sc >= b.min && sc <= b.max) b.count++; }); });
    return buckets;
  }, [scoredSubs]);
  const gradeDistribution = useMemo(() => {
    const grades = [{ name: 'S', min: 90, max: 100, count: 0 }, { name: 'A', min: 80, max: 89, count: 0 }, { name: 'B', min: 70, max: 79, count: 0 }, { name: 'C', min: 60, max: 69, count: 0 }, { name: 'D', min: 0, max: 59, count: 0 }];
    scoredSubs.forEach((s: any) => { const sc = s.aiEvaluation.score; grades.forEach(g => { if (sc >= g.min && sc <= g.max) g.count++; }); });
    return grades.filter(g => g.count > 0);
  }, [scoredSubs]);
  const avgDimensions = useMemo(() => {
    const dimMap: Record<string, { total: number; count: number }> = {};
    scoredSubs.forEach((s: any) => {
      const dims = s.aiEvaluation?.dimensions;
      if (dims && typeof dims === 'object') {
        Object.entries(dims).forEach(([k, v]) => {
          if (!dimMap[k]) dimMap[k] = { total: 0, count: 0 };
          dimMap[k].total += v as number;
          dimMap[k].count++;
        });
      }
    });
    return Object.entries(dimMap).map(([name, { total, count }]) => ({ dimension: name, score: Math.round(total / count), fullMark: 100 }));
  }, [scoredSubs]);

  if (loading && !statistics) {
    return (
      <div className="space-y-5 pb-6 animate-pulse">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 skeleton w-24 rounded-lg" />
            <div className="h-4 skeleton w-32 rounded" />
          </div>
          <div className="h-9 skeleton w-16 rounded-lg flex-shrink-0" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5">
              <div className="w-9 h-9 skeleton rounded-lg mb-4" />
              <div className="h-3 skeleton w-16 rounded mb-2" />
              <div className="h-7 skeleton w-14 rounded mb-1" />
              <div className="h-3 skeleton w-20 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-6 h-[300px] skeleton" />
          <div className="card p-6 h-[300px] skeleton" />
        </div>
        <div className="card p-6 h-[240px] skeleton" />
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

  const PIE_COLORS = ['#111827', '#4b5563', '#9ca3af', '#d1d5db', '#374151', '#6b7280'];
  const aiTotal = arch?.ai.totalProcessed ?? 0;
  const aiSuccess = arch?.ai.successCount ?? 0;
  const aiFailed = arch?.ai.failedCount ?? 0;
  const aiPending = arch?.ai.pendingCount ?? 0;
  const aiRate = arch?.ai.successRate ?? 0;
  const heapPct = arch ? Math.round((arch.system.heapUsedMB / arch.system.heapMaxMB) * 100) : 0;

  return (
    <div className="space-y-5 pb-6 page-enter">

      <div className="flex items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">数据统计</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusDot ok={connected} />
            <span className="text-sm text-gray-500 dark:text-gray-400">{connected ? '实时连接中' : '连接已断开'}</span>
          </div>
        </div>
        <button onClick={refresh} className="btn-secondary gap-1.5 flex-shrink-0">
          <RefreshCw className="w-3.5 h-3.5" />
          刷新
        </button>
      </div>

      {error && !connected && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-800/60">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400 flex-1">{error}</p>
          <button onClick={refresh} className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors underline underline-offset-2">立即重试</button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <FileText className="w-5 h-5" />, label: '总文件数', value: statistics.totalFiles, sub: `本周新增 ${statistics.weekUploads}`, ic: 'text-blue-600 dark:text-blue-400', ib: 'bg-blue-50 dark:bg-blue-900/20' },
          { icon: <HardDrive className="w-5 h-5" />, label: '总存储大小', value: formatBytes(statistics.totalStorageSize), sub: `使用率 ${statistics.storageUsage.percentage.toFixed(2)}%`, ic: 'text-violet-600 dark:text-violet-400', ib: 'bg-violet-50 dark:bg-violet-900/20' },
          { icon: <Upload className="w-5 h-5" />, label: '今日上传', value: statistics.todayUploads, sub: '实时统计', ic: 'text-emerald-600 dark:text-emerald-400', ib: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { icon: <Calendar className="w-5 h-5" />, label: '本周上传', value: statistics.weekUploads, sub: '最近7天', ic: 'text-amber-600 dark:text-amber-400', ib: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map(item => (
          <div key={item.label} className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
            <div className={`w-9 h-9 rounded-lg ${item.ib} ${item.ic} flex items-center justify-center mb-4`}>{item.icon}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{item.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="card p-6 overflow-hidden">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">上传趋势</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">最近 7 天每日上传量</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={statistics.uploadTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#111827" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TS} formatter={(v: number | undefined) => [v ?? 0, '文件数']} />
              <Area type="monotone" dataKey="count" stroke="#374151" strokeWidth={2} fill="url(#ag)" dot={false} activeDot={{ r: 4, fill: '#111827', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">文件类型分布</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">按类型统计文件数量</p>
          </div>
          {statistics.fileTypeDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-[160px] text-gray-400 dark:text-gray-600">
              <div className="text-center">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">暂无文件类型数据</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0 w-[220px] h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statistics.fileTypeDistribution} cx="50%" cy="50%" innerRadius={56} outerRadius={90} dataKey="count" strokeWidth={2} stroke="transparent">
                      {statistics.fileTypeDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={TS} formatter={(v: number, _: string, p: { payload?: { typeName?: string; percentage?: number } }) => [`${v} 个 (${(p.payload?.percentage ?? 0).toFixed(1)}%)`, p.payload?.typeName ?? '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-2.5 min-w-0">
                {statistics.fileTypeDistribution.map((item, i) => (
                  <div key={item.typeName} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{item.typeName}</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{item.count}</span>
                    <span className="text-xs text-gray-400 w-9 text-right">{item.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6 overflow-hidden">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">分类统计</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">按分类统计文件数量和存储大小</p>
        </div>
        {statistics.categoryStatistics && statistics.categoryStatistics.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statistics.categoryStatistics} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={40}>
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1f2937" />
                  <stop offset="100%" stopColor="#4b5563" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="categoryName" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TS} formatter={(v: number, _: string, p: { payload?: { storageSize?: number } }) => [`${v} 个（${formatBytes(p.payload?.storageSize ?? 0)}）`, '文件数']} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
              <Bar dataKey="fileCount" fill="url(#bg)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[160px] text-gray-400 dark:text-gray-600">
            <div className="text-center">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">暂无分类数据</p>
            </div>
          </div>
        )}
      </div>

      {allSubmissions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'AI 批改完成',
              value: allSubmissions.filter(s => s.aiStatus === 2).length,
              sub: `共 ${allSubmissions.length} 次提交`,
              ic: 'text-violet-600 dark:text-violet-400',
              ib: 'bg-violet-50 dark:bg-violet-900/20',
              icon: <Brain className="w-5 h-5" />,
            },
            {
              label: 'AI 批改失败',
              value: allSubmissions.filter(s => s.aiStatus === 3).length,
              sub: '处理异常记录',
              ic: 'text-red-500',
              ib: 'bg-red-50 dark:bg-red-900/20',
              icon: <XCircle className="w-5 h-5" />,
            },
            {
              label: '平均批改分',
              value: (() => {
                const scored = allSubmissions.filter(s => s.aiEvaluation?.score != null);
                if (!scored.length) return '—';
                return (scored.reduce((acc, s) => acc + s.aiEvaluation.score, 0) / scored.length).toFixed(1);
              })(),
              sub: `${allSubmissions.filter(s => s.aiEvaluation?.score != null).length} 篇已评分`,
              ic: 'text-emerald-600 dark:text-emerald-400',
              ib: 'bg-emerald-50 dark:bg-emerald-900/20',
              icon: <CheckCircle2 className="w-5 h-5" />,
            },
          ].map(item => (
            <div key={item.label} className="card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
              <div className={`w-9 h-9 rounded-lg ${item.ib} ${item.ic} flex items-center justify-center mb-4`}>{item.icon}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
              <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{item.value}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{item.sub}</p>
            </div>
          ))}
        </div>
      )}

      {scoredSubs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card p-6">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI 评分分布</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">按分数段统计</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreHistogram} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={32}>
                <defs>
                  <linearGradient id="aiScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f2937" />
                    <stop offset="100%" stopColor="#4b5563" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TS} formatter={(v: number) => [v, '人数']} />
                <Bar dataKey="count" fill="url(#aiScoreGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">等级分布</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">S/A/B/C/D 等级占比</p>
            </div>
            {gradeDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-[160px] text-gray-400 dark:text-gray-600">
                <p className="text-sm">暂无等级数据</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-[180px] h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={gradeDistribution} cx="50%" cy="50%" innerRadius={48} outerRadius={76} dataKey="count" strokeWidth={2} stroke="transparent">
                        {gradeDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={TS} formatter={(v: number, _: string, p: { payload?: { name?: string } }) => [`${v} 人`, `${p.payload?.name ?? ''} 级`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-1.5">
                  {gradeDistribution.map((g, i) => (
                    <div key={g.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">{g.name} 级 ({g.min}-{g.max}分)</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">{g.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">维度平均分</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">各评估维度平均得分</p>
            </div>
            {avgDimensions.length === 0 ? (
              <div className="flex items-center justify-center h-[160px] text-gray-400 dark:text-gray-600">
                <p className="text-sm">暂无维度数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={avgDimensions} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="rgba(0,0,0,0.08)" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Radar dataKey="score" stroke="#374151" fill="#111827" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip contentStyle={TS} formatter={(v: number) => [`${v} 分`, '平均分']} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">存储空间使用</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">总容量 {formatBytes(statistics.storageUsage.total)}</p>
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {statistics.storageUsage.percentage.toFixed(2)}<span className="text-sm font-normal text-gray-400 ml-0.5">%</span>
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden mb-4">
          <div className="h-full bg-gray-900 dark:bg-white rounded-full transition-all duration-700" style={{ width: `${Math.max(statistics.storageUsage.percentage, 0.1)}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '已使用', value: formatBytes(statistics.storageUsage.used) },
            { label: '剩余', value: formatBytes(statistics.storageUsage.remaining) },
            { label: '使用率', value: `${statistics.storageUsage.percentage.toFixed(2)}%` },
          ].map(item => (
            <div key={item.label} className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.label}</p>
              <p className="text-base font-semibold text-gray-900 dark:text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {arch && (
        <div className="card overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-blue-500/15 flex items-center justify-center">
                <Brain className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">AI 批改引擎</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${arch.ai.serviceAvailable ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${arch.ai.serviceAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                    {arch.ai.serviceAvailable ? '运行中' : '离线'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{arch.ai.modelProvider || '未配置'} · Spring @Async 线程池</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{aiTotal}</p>
                <p className="text-xs text-gray-400">总处理量</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {!arch.ai.serviceAvailable && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-800/60">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">AI 服务未配置。请在后台管理 → 系统配置中填写 <span className="font-mono font-semibold">ai.api_key</span>、<span className="font-mono font-semibold">ai.base_url</span> 和 <span className="font-mono font-semibold">ai.chat_model</span>，配置完成后重启服务即可启用。</p>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: '总处理', value: aiTotal, ic: 'text-gray-500 dark:text-gray-400', ib: 'bg-gray-100 dark:bg-gray-800', icon: <FileText className="w-4 h-4" /> },
                { label: '成功', value: aiSuccess, ic: 'text-emerald-600 dark:text-emerald-400', ib: 'bg-emerald-50 dark:bg-emerald-900/20', icon: <CheckCircle2 className="w-4 h-4" /> },
                { label: '失败', value: aiFailed, ic: 'text-red-600 dark:text-red-400', ib: 'bg-red-50 dark:bg-red-900/20', icon: <XCircle className="w-4 h-4" /> },
                { label: '待处理', value: aiPending, ic: 'text-amber-600 dark:text-amber-400', ib: 'bg-amber-50 dark:bg-amber-900/20', icon: <Clock className="w-4 h-4" /> },
              ].map(item => (
                <div key={item.label} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className={`w-8 h-8 ${item.ib} ${item.ic} rounded-lg flex items-center justify-center mb-3`}>{item.icon}</div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600 dark:text-gray-400">批改成功率</span>
                <span className="font-bold text-gray-900 dark:text-white">{aiRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-700" style={{ width: `${Math.min(aiRate, 100)}%` }} />
              </div>
            </div>

            {aiTotal > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'S 级', sub: '90-100分', color: 'bg-violet-500' },
                  { label: 'A 级', sub: '80-89分', color: 'bg-blue-500' },
                  { label: 'B 级', sub: '70-79分', color: 'bg-emerald-500' },
                  { label: 'C 级', sub: '<70分', color: 'bg-gray-400' },
                ].map(band => (
                  <div key={band.label} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`w-2 h-2 rounded-full ${band.color}`} />
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{band.label}</span>
                    </div>
                    <p className="text-xs text-gray-400">{band.sub}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <button
                onClick={() => setAiHistoryOpen(o => !o)}
                className="w-full flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span>批改历史记录</span>
                {aiHistoryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {aiHistoryOpen && (
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {aiHistoryLoading ? (
                    <div className="text-xs text-gray-400 text-center py-4">加载中...</div>
                  ) : aiHistory.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-4">暂无批改记录</div>
                  ) : (
                    aiHistory.slice(0, 20).map((s: any, i: number) => {
                      const score = s.aiEvaluation?.score ?? s.aiScore ?? null;
                      const summary = s.aiEvaluation?.summary ?? s.aiEvaluation?.feedback ?? '';
                      const scoreColor = score == null ? 'text-gray-400' : score >= 90 ? 'text-violet-600 dark:text-violet-400' : score >= 80 ? 'text-blue-600 dark:text-blue-400' : score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400';
                      const statusFailed = s.aiStatus === 3;
                      return (
                        <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                          <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${statusFailed ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-violet-50 dark:bg-violet-900/20'}`}>
                            {statusFailed ? <XCircle className="w-4 h-4" /> : <span className={scoreColor}>{score ?? '—'}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{s.fileName || s.submitterName || '未知文件'}</p>
                            {summary && <p className="text-xs text-gray-400 truncate mt-0.5">{summary}</p>}
                            {s.submittedAt && <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">{new Date(s.submittedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">系统状态</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">缓存 · AI 引擎 · 数据库与存储</p>
          </div>
          {arch && !archLoading && (
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 px-2.5 py-1 rounded-full">
              已运行 {formatUptime(arch.system.uptimeSeconds)}
            </span>
          )}
        </div>

        {archLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
                <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-full" />
              </div>
            ))}
          </div>
        ) : !arch ? (
          <div className="card p-6 text-center text-gray-400 dark:text-gray-600">
            <Cpu className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">系统指标数据不可用</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">多级缓存</p>
                  <p className="text-xs text-gray-400">Redis + Spring Cache</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{arch.cache.hitRate.toFixed(1)}</span>
                <span className="text-sm text-gray-400">% 命中率</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden mb-3">
                <div className="h-full bg-sky-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(arch.cache.hitRate, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>命中 {arch.cache.hits.toLocaleString()}</span>
                <span>未命中 {arch.cache.misses.toLocaleString()}</span>
                <span>{arch.cache.memoryUsedHuman}</span>
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">AI 引擎</p>
                  <p className="text-xs text-gray-400">{arch.ai.modelProvider || '未配置'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusDot ok={arch.ai.serviceAvailable} />
                  <span className="text-xs text-gray-400">{arch.ai.serviceAvailable ? '可用' : '离线'}</span>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5 mb-4">
                <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{arch.ai.totalProcessed}</span>
                <span className="text-sm text-gray-400">总处理量</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '✓ 成功', value: arch.ai.successCount, c: 'text-emerald-600 dark:text-emerald-400' },
                  { label: '✗ 失败', value: arch.ai.failedCount, c: 'text-red-500' },
                  { label: '⏳ 待处理', value: arch.ai.pendingCount, c: 'text-amber-600 dark:text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="text-center p-2 bg-gray-50 dark:bg-gray-800/60 rounded-lg">
                    <p className={`text-sm font-bold ${s.c}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">数据库 & 存储</p>
                  <p className="text-xs text-gray-400">Java {arch.system.javaVersion}</p>
                </div>
              </div>
              <div className="space-y-2.5 mb-4">
                {[
                  { label: 'PostgreSQL', ok: arch.system.postgresConnected },
                  { label: 'Redis', ok: arch.system.redisConnected },
                  { label: 'MinIO', ok: arch.system.minioConnected },
                  { label: 'pgvector', ok: arch.system.pgvectorEnabled },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{s.label}</span>
                    <div className="flex items-center gap-1.5">
                      <StatusDot ok={s.ok} />
                      <span className={`text-xs font-medium ${s.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{s.ok ? '正常' : '异常'}</span>
                    </div>
                  </div>
                ))}
              </div>
              {arch.ai.pendingCount > 0 && (
                <button
                  onClick={handleRetryPending}
                  disabled={retrying}
                  className="mb-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                  {retrying ? '提交中...' : `重试 ${arch.ai.pendingCount} 条待处理`}
                </button>
              )}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500 dark:text-gray-400">JVM 堆内存</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{arch.system.heapUsedMB}MB / {arch.system.heapMaxMB}MB</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${heapPct > 80 ? 'bg-red-500' : heapPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${heapPct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{heapPct}% 已用</span>
                  <Activity className="w-3 h-3" />
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
