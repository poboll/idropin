'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  Loader2,
  Download,
  Trash2,
  FileIcon,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Copy,
  ExternalLink,
  Edit3,
  Eye,
  Share2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  User,
  HardDrive,
  FolderOpen
} from 'lucide-react';
import { AuthGuard } from '@/components/auth';
import { useCategoryStore } from '@/lib/stores/category';
import { useTaskStore } from '@/lib/stores/task';
import { formatDate, formatSize, getFileSuffix } from '@/lib/utils/string';
import { copyRes } from '@/lib/utils/string';
import { SkeletonLoader } from '@/components/SkeletonLoader';

interface FileRecord {
  id: string | number;
  date: string;
  task_key: string;
  task_name: string;
  name: string;
  origin_name?: string;
  size: number;
  people?: string;
  info: string;
  cover?: string;
  downloadCount?: number;
  fileId?: string;
  mimeType?: string;
}

// 飞书风格的任务颜色配置
const TASK_COLORS = [
  { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
  { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800' },
  { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
];

// 根据任务key生成稳定的颜色索引
function getTaskColorIndex(taskKey: string): number {
  let hash = 0;
  for (let i = 0; i < taskKey.length; i++) {
    hash = ((hash << 5) - hash) + taskKey.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % TASK_COLORS.length;
}

type SortField = 'date' | 'name' | 'size' | 'task_name' | 'people';
type SortOrder = 'asc' | 'desc';

function FilesPageContent() {
  const { categoryList: categories, getCategory: fetchCategories } = useCategoryStore();
  const { taskList: tasks, getTask: fetchTasks } = useTaskStore();

  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTask, setSelectedTask] = useState('all');
  const [searchWord, setSearchWord] = useState('');
  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);

  // 排序状态
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [pageSize, setPageSize] = useState(10);
  const [pageCurrent, setPageCurrent] = useState(1);

  const [activeModal, setActiveModal] = useState<'info' | 'rename' | 'download' | 'share' | null>(null);
  const [currentFile, setCurrentFile] = useState<FileRecord | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [shareFormData, setShareFormData] = useState({
    password: '',
    expireAt: '',
    downloadLimit: '',
  });
  const [shareResult, setShareResult] = useState<{ shareCode: string; url: string } | null>(null);

  // 任务颜色映射缓存
  const taskColorMap = useMemo(() => {
    const map = new Map<string, typeof TASK_COLORS[0]>();
    tasks.forEach(task => {
      map.set(task.key, TASK_COLORS[getTaskColorIndex(task.key)]);
    });
    return map;
  }, [tasks]);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getAllUserTaskSubmissions } = await import('@/lib/api/tasks');
      const submissions = await getAllUserTaskSubmissions();

      const apiFiles: FileRecord[] = submissions.map((s: any, index: number) => ({
        id: `submission-${s.id || index}`,
        date: s.submittedAt || new Date().toISOString(),
        task_key: s.taskId,
        task_name: s.taskTitle || '未知任务',
        name: s.fileName || (s.submitterName ? `提交_${s.submitterName}` : '未命名'),
        origin_name: s.fileName,
        size: s.fileSize || 0,
        people: s.submitterName || '-',
        info: '[]',
        downloadCount: 0,
        fileId: s.fileId,
        mimeType: s.mimeType,
        cover: s.mimeType?.startsWith('image/') ? s.fileUrl : undefined,
      }));

      setFiles(apiFiles);
    } catch (error) {
      console.error('加载文件失败', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([fetchCategories(), fetchTasks()]);
      await loadFiles();
    };
    initializeData();
  }, [fetchCategories, fetchTasks, loadFiles]);

  const filteredTasks = useMemo(() => {
    if (selectedCategory === 'all') return tasks;
    return tasks.filter(t => t.category === selectedCategory);
  }, [tasks, selectedCategory]);

  // 排序函数
  const sortFiles = useCallback((filesToSort: FileRecord[]) => {
    return [...filesToSort].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-CN');
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'task_name':
          comparison = a.task_name.localeCompare(b.task_name, 'zh-CN');
          break;
        case 'people':
          comparison = (a.people || '').localeCompare(b.people || '', 'zh-CN');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [sortField, sortOrder]);

  const filteredFiles = useMemo(() => {
    const filtered = files
      .filter(f => {
        if (selectedCategory === 'no-task') {
          return !tasks.some(t => t.key === f.task_key);
        }
        if (selectedTask !== 'all') {
          return f.task_key === selectedTask;
        }
        if (selectedCategory !== 'all' && selectedCategory !== 'default') {
          return filteredTasks.some(t => t.key === f.task_key);
        }
        return true;
      })
      .filter(f => {
        if (!searchWord) return true;
        const searchStr = JSON.stringify([f.name, f.task_name, f.people]).toLowerCase();
        return searchStr.includes(searchWord.toLowerCase());
      });

    return sortFiles(filtered);
  }, [files, selectedCategory, selectedTask, searchWord, tasks, filteredTasks, sortFiles]);

  const pageCount = Math.ceil(filteredFiles.length / pageSize);
  const paginatedFiles = useMemo(() => {
    const start = (pageCurrent - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, pageCurrent, pageSize]);

  const totalSize = useMemo(() => formatSize(files.reduce((acc, f) => acc + f.size, 0)), [files]);

  // 处理排序点击
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPageCurrent(1);
  };

  // 渲染排序图标
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-gray-900 dark:text-white" />
      : <ArrowDown className="w-3.5 h-3.5 text-gray-900 dark:text-white" />;
  };

  const handleSelectItem = (id: string | number, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedFiles.map(f => f.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBatchDelete = () => {
    if (selectedItems.length === 0) return;
    if (confirm(`确定删除选中的 ${selectedItems.length} 个文件吗？`)) {
      setFiles(prev => prev.filter(f => !selectedItems.includes(f.id)));
      setSelectedItems([]);
    }
  };

  const handleDeleteOne = (file: FileRecord) => {
    if (confirm('确定删除此文件吗？')) {
      setFiles(prev => prev.filter(f => f.id !== file.id));
    }
  };

  const handleRename = (file: FileRecord) => {
    setCurrentFile(file);
    setRenameValue(file.name.replace(getFileSuffix(file.name), ''));
    setActiveModal('rename');
  };

  const handleSaveRename = () => {
    if (!currentFile) return;
    const suffix = getFileSuffix(currentFile.name);
    const newName = `${renameValue}${suffix}`;
    setFiles(prev => prev.map(f => f.id === currentFile.id ? { ...f, name: newName } : f));
    setActiveModal(null);
  };

  const handleViewInfo = (file: FileRecord) => {
    setCurrentFile(file);
    setActiveModal('info');
  };

  const handleDownload = (file: FileRecord) => {
    setCurrentFile(file);
    setActiveModal('download');
  };

  const handleShare = (file: FileRecord) => {
    if (!file.fileId) {
      alert('此文件无法分享');
      return;
    }
    setCurrentFile(file);
    setShareFormData({ password: '', expireAt: '', downloadLimit: '' });
    setShareResult(null);
    setActiveModal('share');
  };

  const handleCreateShare = async () => {
    if (!currentFile?.fileId) return;

    try {
      const { createShare } = await import('@/lib/api/shares');
      const share = await createShare({
        fileId: currentFile.fileId,
        password: shareFormData.password || undefined,
        expireAt: shareFormData.expireAt || undefined,
        downloadLimit: shareFormData.downloadLimit ? parseInt(shareFormData.downloadLimit) : undefined,
      });

      const baseUrl = window.location.origin;
      setShareResult({
        shareCode: share.shareCode,
        url: `${baseUrl}/share/${share.shareCode}`,
      });
    } catch (error: any) {
      alert(error.message || '创建分享失败');
    }
  };

  // 获取任务标签样式
  const getTaskBadgeStyle = (taskKey: string) => {
    const color = taskColorMap.get(taskKey) || TASK_COLORS[0];
    return `${color.bg} ${color.text} ${color.border}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">文件管理</h1>
          <p className="page-description">管理和查看所有收集的文件</p>
        </div>
        <button
          onClick={loadFiles}
          disabled={isLoading}
          className="btn-secondary"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* Stats Cards - Vercel+Apple 风格 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5 hover-lift animate-slide-in-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center transition-transform hover:scale-110">
              <FileIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">总文件数</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">{files.length}</div>
            </div>
          </div>
        </div>
        <div className="card p-5 hover-lift animate-slide-in-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center transition-transform hover:scale-110">
              <HardDrive className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">总大小</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">{totalSize}</div>
            </div>
          </div>
        </div>
        <div className="card p-5 hover-lift animate-slide-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center transition-transform hover:scale-110">
              <FolderOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">筛选结果</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">{filteredFiles.length}</div>
            </div>
          </div>
        </div>
        <div className="card p-5 hover-lift animate-slide-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center transition-transform hover:scale-110">
              <Check className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">已选择</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">{selectedItems.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - 现代化设计 */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchWord}
              onChange={(e) => { setSearchWord(e.target.value); setPageCurrent(1); }}
              placeholder="搜索文件名、任务、提交人..."
              className="input pl-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setSelectedTask('all'); setPageCurrent(1); }}
            className="input w-full lg:w-40"
          >
            <option value="all">全部分类</option>
            {categories?.map(c => (
              <option key={c.k} value={c.k}>{c.name}</option>
            ))}
          </select>

          {/* Task Filter */}
          <select
            value={selectedTask}
            onChange={(e) => { setSelectedTask(e.target.value); setPageCurrent(1); }}
            className="input w-full lg:w-48"
          >
            <option value="all">全部任务</option>
            {filteredTasks?.map(t => (
              <option key={t.key} value={t.key}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Batch Actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              已选择 {selectedItems.length} 项
            </span>
            <button
              onClick={() => setSelectedItems([])}
              className="btn-ghost btn-sm"
            >
              取消选择
            </button>
            <button
              onClick={handleBatchDelete}
              className="btn-danger btn-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除
            </button>
          </div>
        )}
      </div>

      {/* File Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <SkeletonLoader variant="stats" count={4} />
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10"></th>
                    <th>文件名</th>
                    <th>任务</th>
                    <th>大小</th>
                    <th>提交人</th>
                    <th>提交时间</th>
                    <th className="w-28">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <SkeletonLoader variant="table-row" count={5} />
                </tbody>
              </table>
            </div>
          </div>
        ) : paginatedFiles.length === 0 ? (
          <div className="empty-state py-20">
            <FileIcon className="empty-state-icon" />
            <p className="empty-state-title">暂无文件</p>
            <p className="empty-state-description">收集的文件将显示在这里</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === paginatedFiles.length && paginatedFiles.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th>
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      文件名
                      {renderSortIcon('name')}
                    </button>
                  </th>
                  <th>
                    <button
                      onClick={() => handleSort('task_name')}
                      className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      任务
                      {renderSortIcon('task_name')}
                    </button>
                  </th>
                  <th>
                    <button
                      onClick={() => handleSort('size')}
                      className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      大小
                      {renderSortIcon('size')}
                    </button>
                  </th>
                  <th>
                    <button
                      onClick={() => handleSort('people')}
                      className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      提交人
                      {renderSortIcon('people')}
                    </button>
                  </th>
                  <th>
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      提交时间
                      {renderSortIcon('date')}
                    </button>
                  </th>
                  <th className="w-28">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFiles.map((file, index) => (
                  <tr key={file.id} className="group hover-glow" style={{ animationDelay: `${index * 30}ms` }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(file.id)}
                        onChange={(e) => handleSelectItem(file.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {file.cover ? (
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700">
                            <Image src={file.cover} alt="" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span className="truncate max-w-[200px] font-medium" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      {/* 飞书风格的圆角标签 */}
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border ${getTaskBadgeStyle(file.task_key)}`}>
                        {file.task_name}
                      </span>
                    </td>
                    <td className="text-gray-500 dark:text-gray-400">
                      {file.size === 0 ? '-' : formatSize(file.size)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-500" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">{file.people || '-'}</span>
                      </div>
                    </td>
                    <td className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(new Date(file.date))}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleViewInfo(file)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="查看信息"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShare(file)}
                          disabled={!file.fileId}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="分享"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRename(file)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="重命名"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="下载"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOne(file)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                共 {filteredFiles.length} 条
              </span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPageCurrent(1); }}
                className="input py-1 px-2 w-auto text-sm"
              >
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPageCurrent(p => Math.max(1, p - 1))}
                disabled={pageCurrent <= 1}
                className="btn-ghost btn-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm text-gray-600 dark:text-gray-400">
                {pageCurrent} / {pageCount}
              </span>
              <button
                onClick={() => setPageCurrent(p => Math.min(pageCount, p + 1))}
                disabled={pageCurrent >= pageCount}
                className="btn-ghost btn-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Modal */}
      {activeModal === 'info' && currentFile && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">文件信息</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="form-label">文件名</label>
                <p className="text-gray-900 dark:text-white">{currentFile.name}</p>
              </div>
              <div>
                <label className="form-label">任务</label>
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border ${getTaskBadgeStyle(currentFile.task_key)}`}>
                  {currentFile.task_name}
                </span>
              </div>
              <div>
                <label className="form-label">大小</label>
                <p className="text-gray-900 dark:text-white">{formatSize(currentFile.size)}</p>
              </div>
              <div>
                <label className="form-label">提交人</label>
                <p className="text-gray-900 dark:text-white">{currentFile.people || '-'}</p>
              </div>
              <div>
                <label className="form-label">提交时间</label>
                <p className="text-gray-900 dark:text-white">{formatDate(new Date(currentFile.date))}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setActiveModal(null)} className="btn-secondary">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {activeModal === 'rename' && currentFile && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">重命名文件</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">新文件名</label>
                <div className="flex">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="input rounded-r-none"
                    placeholder="输入新文件名"
                  />
                  <span className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-l-0 border-gray-200 dark:border-gray-700 rounded-r-lg text-sm text-gray-500">
                    {getFileSuffix(currentFile.name)}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setActiveModal(null)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleSaveRename} className="btn-primary">
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Modal */}
      {activeModal === 'download' && currentFile && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">下载文件</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                文件: {currentFile.name}
              </p>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400 break-all">
                https://example.com/download/{currentFile.id}
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => copyRes(`https://example.com/download/${currentFile.id}`)}
                className="btn-secondary"
              >
                <Copy className="w-4 h-4" />
                复制链接
              </button>
              <button
                onClick={() => window.open(`https://example.com/download/${currentFile.id}`, '_blank')}
                className="btn-primary"
              >
                <ExternalLink className="w-4 h-4" />
                打开下载
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {activeModal === 'share' && currentFile && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">创建分享</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="modal-body space-y-4">
              {!shareResult ? (
                <>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      文件: {currentFile.name}
                    </p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">分享密码（可选）</label>
                    <input
                      type="text"
                      value={shareFormData.password}
                      onChange={(e) => setShareFormData({ ...shareFormData, password: e.target.value })}
                      className="input"
                      placeholder="留空则无需密码"
                      maxLength={20}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">过期时间（可选）</label>
                    <input
                      type="datetime-local"
                      value={shareFormData.expireAt}
                      onChange={(e) => setShareFormData({ ...shareFormData, expireAt: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">下载次数限制（可选）</label>
                    <input
                      type="number"
                      value={shareFormData.downloadLimit}
                      onChange={(e) => setShareFormData({ ...shareFormData, downloadLimit: e.target.value })}
                      className="input"
                      placeholder="留空则不限制"
                      min="1"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">分享创建成功</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">分享链接</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareResult.url}
                        readOnly
                        className="input flex-1"
                      />
                      <button
                        onClick={() => {
                          copyRes(shareResult.url);
                          alert('链接已复制');
                        }}
                        className="btn-secondary"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">分享码</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareResult.shareCode}
                        readOnly
                        className="input flex-1"
                      />
                      <button
                        onClick={() => {
                          copyRes(shareResult.shareCode);
                          alert('分享码已复制');
                        }}
                        className="btn-secondary"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              {!shareResult ? (
                <>
                  <button onClick={() => setActiveModal(null)} className="btn-secondary">
                    取消
                  </button>
                  <button onClick={handleCreateShare} className="btn-primary">
                    <Share2 className="w-4 h-4" />
                    创建分享
                  </button>
                </>
              ) : (
                <button onClick={() => setActiveModal(null)} className="btn-primary w-full">
                  完成
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FilesPage() {
  return (
    <AuthGuard>
      <FilesPageContent />
    </AuthGuard>
  );
}
