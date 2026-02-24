'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Modal from '@/components/Modal';
import { Download, Search, ArrowUpDown, Loader2, Users } from 'lucide-react';
import { getPeople, deletePeople, type People } from '@/lib/api/people';
import { getTaskInfoSubmissions, exportInfoSubmissions } from '@/lib/api/tasks';

interface SubmissionStatusDialogProps {
  taskKey: string;
  taskTitle: string;
  open: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'submitted' | 'unsubmitted';
type SortDir = 'asc' | 'desc';

interface MergedRow {
  id: number;
  name: string;
  status: number;
  submitCount: number;
  lastTime: string | null;
}

export function SubmissionStatusDialog({ taskKey, taskTitle, open, onClose }: SubmissionStatusDialogProps) {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [people, setPeople] = useState<People[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showDetails, setShowDetails] = useState(false);

  const loadData = useCallback(async () => {
    if (!taskKey) return;
    setLoading(true);
    try {
      const [peopleData, subData] = await Promise.allSettled([
        getPeople(taskKey),
        getTaskInfoSubmissions(taskKey),
      ]);
      setPeople(peopleData.status === 'fulfilled' ? peopleData.value : []);
      setSubmissions(
        subData.status === 'fulfilled' && subData.value?.submissions
          ? subData.value.submissions
          : []
      );
    } catch {
      setPeople([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [taskKey]);

  useEffect(() => {
    if (open && taskKey) loadData();
  }, [open, taskKey, loadData]);

  const rows = useMemo<MergedRow[]>(() => {
    return people.map((p) => {
      const personSubs = submissions.filter(
        (s) => s.submitterName === p.name
      );
      const latestSub = personSubs.length
        ? personSubs.reduce((a, b) =>
            new Date(a.submittedAt) > new Date(b.submittedAt) ? a : b
          )
        : null;
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        submitCount: personSubs.length || (p.status === 1 ? 1 : 0),
        lastTime: p.lastSubmitTime || latestSub?.submittedAt || null,
      };
    });
  }, [people, submissions]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (filter === 'submitted') result = result.filter((r) => r.status === 1);
    if (filter === 'unsubmitted') result = result.filter((r) => r.status === 0);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      const ta = a.lastTime ? new Date(a.lastTime).getTime() : 0;
      const tb = b.lastTime ? new Date(b.lastTime).getTime() : 0;
      return sortDir === 'desc' ? tb - ta : ta - tb;
    });
    return result;
  }, [rows, filter, search, sortDir]);

  const stats = useMemo(() => {
    const total = rows.length;
    const submitted = rows.filter((r) => r.status === 1).length;
    return { total, submitted, unsubmitted: total - submitted };
  }, [rows]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportInfoSubmissions(taskKey, 'excel');
    } catch (e) {
      alert('导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (person: MergedRow) => {
    if (!window.confirm(`确定要删除「${person.name}」吗？`)) return;
    try {
      await deletePeople(taskKey, person.id);
      await loadData();
    } catch {
      alert('删除失败，请重试');
    }
  };

  const formatTime = (t: string | null) => {
    if (!t) return '-';
    const d = new Date(t);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="提交情况" size="lg">
      <div className="flex flex-col max-h-[70vh]">
        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-3 px-5 pt-4 pb-3 shrink-0">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-100 disabled:opacity-50 text-white dark:text-gray-900 text-sm font-medium rounded-lg transition-colors"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            导出记录
          </button>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="all">全部</option>
            <option value="submitted">已提交</option>
            <option value="unsubmitted">未提交</option>
          </select>

          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="输入要查询的姓名"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 py-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
          共 <span className="font-semibold text-gray-900 dark:text-white">{stats.total}</span> 条数据，
          已提交: <span className="font-semibold text-green-600 dark:text-green-400">{stats.submitted}</span>，
          未提交: <span className="font-semibold text-gray-500">{stats.unsubmitted}</span>
        </div>

        {/* Detail toggle */}
        <div className="flex justify-center py-3 shrink-0">
          <button
            onClick={() => setShowDetails(v => !v)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${showDetails ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
          >
            {showDetails ? '隐藏详细提交情况' : '显示详细提交情况'}
          </button>
        </div>

        {/* Column explanations */}
        {showDetails && (
          <div className="px-5 pb-3 space-y-1 text-xs text-gray-500 dark:text-gray-400 shrink-0">
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">&ldquo;提交次数&rdquo;</span> 用户实际的提交次数</p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">&ldquo;现存数量&rdquo;</span> 还存在于服务器上的文件数 (不包含删除) --- 慢查询</p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">&ldquo;提交数量&rdquo;</span> 用户实际提交的文件数 (不包含撤回) --- 慢查询</p>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              加载中...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users className="w-10 h-10 mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm">{people.length === 0 ? '暂无名单数据' : '无匹配结果'}</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse border border-gray-200 dark:border-gray-700">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/80 z-10">
                <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 w-[60px] text-center border border-gray-200 dark:border-gray-700">序号</th>
                  <th className="px-4 py-3 border border-gray-200 dark:border-gray-700">姓名</th>
                  <th className="px-4 py-3 w-[100px] text-center border border-gray-200 dark:border-gray-700">提交状态</th>
                  <th className="px-4 py-3 w-[100px] text-center border border-gray-200 dark:border-gray-700">提交次数</th>
                  {showDetails && (
                    <>
                      <th className="px-4 py-3 w-[100px] text-center border border-gray-200 dark:border-gray-700">现存数量</th>
                      <th className="px-4 py-3 w-[100px] text-center border border-gray-200 dark:border-gray-700">提交数量</th>
                    </>
                  )}
                  <th
                    className="px-4 py-3 w-[170px] cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors border border-gray-200 dark:border-gray-700"
                    onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                  >
                    <span className="inline-flex items-center gap-1">
                      最后操作时间
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </span>
                  </th>
                  <th className="px-4 py-3 w-[80px] text-center border border-gray-200 dark:border-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 even:bg-gray-50/50 dark:even:bg-gray-800/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">{row.name}</td>
                    <td className="px-4 py-3 text-center border border-gray-200 dark:border-gray-700">
                      {row.status === 1 ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">已提交</span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">未提交</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{row.submitCount}</td>
                    {showDetails && (
                      <>
                        <td className="px-4 py-3 text-center text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700">—</td>
                        <td className="px-4 py-3 text-center text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700">—</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs border border-gray-200 dark:border-gray-700">{formatTime(row.lastTime)}</td>
                    <td className="px-4 py-3 text-center border border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleDelete(row)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
