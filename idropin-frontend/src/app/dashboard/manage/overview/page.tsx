'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, Activity, BarChart3, Archive, RefreshCw, Trash2, Search } from 'lucide-react';
import { formatDate, formatSize } from '@/lib/utils/string';

interface StatCard {
  type: string;
  title: string;
  value: string;
  supplement: string;
  icon: React.ElementType;
  color: string;
}

interface LogRecord {
  id: number;
  date: string;
  type: string;
  ip: string;
  msg: string;
}

const initialCards: StatCard[] = [
  { type: 'user', title: '用户数量', value: '0', supplement: '较昨日 +0', icon: Users, color: '#40c9c6' },
  { type: 'file', title: '记录/OSS', value: '0', supplement: '记录较昨日 +0', icon: FileText, color: '#36a3f7' },
  { type: 'log', title: '日志数量', value: '0', supplement: '较昨日 +0', icon: Activity, color: '#f4516c' },
  { type: 'pv', title: 'PV/UV', value: '0/0', supplement: '', icon: BarChart3, color: '#34bfa3' },
  { type: 'compress', title: '归档&无效文件', value: '0/0KB', supplement: '已失效0个', icon: Archive, color: '#e38013' },
];

const logTypeList = [
  { label: '用户行为', type: 'behavior' },
  { label: '网络请求', type: 'request' },
  { label: '服务端错误', type: 'error' },
  { label: '页面访问', type: 'pv' },
];

export default function OverviewPage() {
  const [cards, setCards] = useState<StatCard[]>(initialCards);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const [filterLogType, setFilterLogType] = useState('behavior');
  const [searchWord, setSearchWord] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pageCurrent, setPageCurrent] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    loadOverviewData();
    loadLogs();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filterLogType, searchWord, pageCurrent, pageSize]);

  const loadOverviewData = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setCards([
        { type: 'user', title: '用户数量', value: '128', supplement: '较昨日 +5', icon: Users, color: '#40c9c6' },
        { type: 'file', title: '记录/OSS', value: '1,234/890 (2.5GB)', supplement: '记录较昨日 +23', icon: FileText, color: '#36a3f7' },
        { type: 'log', title: '日志数量', value: '45,678', supplement: '较昨日 +1,234', icon: Activity, color: '#f4516c' },
        { type: 'pv', title: 'PV/UV', value: '567/123', supplement: '历史: 12,345/4,567', icon: BarChart3, color: '#34bfa3' },
        { type: 'compress', title: '归档&无效文件', value: '45/128MB', supplement: '已失效 12/45MB', icon: Archive, color: '#e38013' },
      ]);
      setIsLoading(false);
    }, 500);
  };

  const loadLogs = async () => {
    const mockLogs: LogRecord[] = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1 + (pageCurrent - 1) * pageSize,
      date: new Date(Date.now() - i * 3600000).toISOString(),
      type: filterLogType,
      ip: `192.168.1.${100 + i}`,
      msg: `${logTypeList.find(l => l.type === filterLogType)?.label} - 操作记录 #${i + 1}`,
    }));
    setLogs(mockLogs);
    setLogTotal(156);
  };

  const handleClearExpired = async () => {
    setIsCleaning(true);
    setTimeout(() => {
      alert('清理成功，数据同步可能有延迟');
      setIsCleaning(false);
      loadOverviewData();
    }, 2000);
  };

  const handleExportLogs = () => {
    if (logs.length === 0) {
      alert('没有可导出的日志');
      return;
    }
    alert(`导出成功 ${logs.length} 条日志`);
  };

  const pageCount = Math.ceil(logTotal / pageSize);

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 ${isLoading ? 'opacity-50' : ''}`}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.type}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${card.color}20` }}
              >
                <Icon className="w-6 h-6" style={{ color: card.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-500 dark:text-gray-400">{card.title}</div>
                <div className="text-lg font-semibold text-gray-800 dark:text-white truncate">{card.value}</div>
                <div className="text-xs text-gray-400">{card.supplement}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">类型</span>
            <select
              value={filterLogType}
              onChange={(e) => { setFilterLogType(e.target.value); setPageCurrent(1); }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500
                dark:bg-gray-700 dark:text-white"
            >
              {logTypeList.map((item) => (
                <option key={item.type} value={item.type}>{item.label}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder="请输入要检索的内容"
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500
                dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            onClick={loadLogs}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>

          <button
            onClick={handleExportLogs}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            导出日志 {logs.length} 条
          </button>

          <button
            onClick={handleClearExpired}
            disabled={isCleaning}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isCleaning ? '清理中...' : '清理无效文件'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400">日期</th>
                <th className="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400">IP</th>
                <th className="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400">内容</th>
                <th className="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {formatDate(new Date(log.date))}
                  </td>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{log.ip}</td>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{log.msg}</td>
                  <td className="py-2 px-3">
                    <button className="text-blue-600 hover:text-blue-700 text-sm">
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <span className="text-sm text-gray-500">共 {logTotal} 条</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPageCurrent(1); }}
              className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
            >
              <option value={10}>10条/页</option>
              <option value={50}>50条/页</option>
              <option value={100}>100条/页</option>
            </select>
            <div className="flex gap-1">
              <button
                onClick={() => setPageCurrent(p => Math.max(1, p - 1))}
                disabled={pageCurrent <= 1}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm">{pageCurrent} / {pageCount}</span>
              <button
                onClick={() => setPageCurrent(p => Math.min(pageCount, p + 1))}
                disabled={pageCurrent >= pageCount}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
