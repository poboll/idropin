'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { 
  Loader2, 
  Download, 
  Trash2, 
  FileIcon, 
  Image as ImageIcon,
  MoreHorizontal,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Copy,
  ExternalLink,
  Edit3,
  Eye,
  Share2
} from 'lucide-react';
import { AuthGuard } from '@/components/auth';
import { useCategoryStore } from '@/lib/stores/category';
import { useTaskStore } from '@/lib/stores/task';
import { formatDate, formatSize, parseInfo, InfoItem, getFileSuffix } from '@/lib/utils/string';
import { copyRes } from '@/lib/utils/string';

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

function FilesPageContent() {
  const { categoryList: categories, getCategory: fetchCategories } = useCategoryStore();
  const { taskList: tasks, getTask: fetchTasks } = useTaskStore();

  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTask, setSelectedTask] = useState('all');
  const [searchWord, setSearchWord] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

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

  useEffect(() => {
    fetchCategories();
    fetchTasks();
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      // 加载通用文件（file表）
      const { getFiles } = await import('@/lib/api/files');
      const response = await getFiles({ page: 1, size: 1000 });
      
      const apiFiles: FileRecord[] = [];
      
      // 添加通用文件
      if (response && response.records) {
        response.records.forEach((f: any, index: number) => {
          apiFiles.push({
            id: `file-${index}`,
            date: f.createdAt || new Date().toISOString(),
            task_key: f.categoryId || 'default',
            task_name: f.categoryId ? `任务 ${f.categoryId}` : '默认任务',
            name: f.originalName || '未命名文件',
            origin_name: f.originalName,
            size: f.fileSize || 0,
            people: f.uploaderId || '-',
            info: '[]',
            cover: f.mimeType?.startsWith('image/') ? f.url : undefined,
            downloadCount: 0,
            fileId: f.id,
            mimeType: f.mimeType,
          });
        });
      }
      
      // 加载任务提交文件（遍历所有任务）
      if (tasks && tasks.length > 0) {
        const token = localStorage.getItem('token');
        for (const task of tasks) {
          try {
            const submissionResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'}/collection-tasks/${task.key}/submissions`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              }
            );
            
            if (submissionResponse.ok) {
              const submissionData = await submissionResponse.json();
              if (submissionData.data && Array.isArray(submissionData.data)) {
                submissionData.data.forEach((s: any) => {
                  apiFiles.push({
                    id: `submission-${s.id}`,
                    date: s.submittedAt || new Date().toISOString(),
                    task_key: task.key,
                    task_name: task.name,
                    name: s.submitterName ? `${task.name}_${s.submitterName}` : task.name,
                    origin_name: s.submitterName,
                    size: 0,
                    people: s.submitterName || '-',
                    info: '[]',
                    downloadCount: 0,
                    fileId: s.fileId,
                  });
                });
              }
            }
          } catch (error) {
            console.warn(`加载任务 ${task.key} 的提交记录失败:`, error);
          }
        }
      }
      
      setFiles(apiFiles);
    } catch (error) {
      console.error('加载文件失败', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    if (selectedCategory === 'all') return tasks;
    return tasks.filter(t => t.category === selectedCategory);
  }, [tasks, selectedCategory]);

  const filteredFiles = useMemo(() => {
    return files
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
  }, [files, selectedCategory, selectedTask, searchWord, tasks, filteredTasks]);

  const pageCount = Math.ceil(filteredFiles.length / pageSize);
  const paginatedFiles = useMemo(() => {
    const start = (pageCurrent - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, pageCurrent, pageSize]);

  const totalSize = useMemo(() => formatSize(files.reduce((acc, f) => acc + f.size, 0)), [files]);

  const handleSelectItem = (id: number, checked: boolean) => {
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-label">总文件数</div>
          <div className="stat-value">{files.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">总大小</div>
          <div className="stat-value">{totalSize}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">筛选结果</div>
          <div className="stat-value">{filteredFiles.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已选择</div>
          <div className="stat-value">{selectedItems.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder="搜索文件名、任务、提交人..."
              className="input pl-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setSelectedTask('all'); setPageCurrent(1); }}
            className="input w-full sm:w-40"
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
            className="input w-full sm:w-40"
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
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
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
                  <th>文件名</th>
                  <th>任务</th>
                  <th>大小</th>
                  <th>提交人</th>
                  <th>提交时间</th>
                  <th className="w-20">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFiles.map((file) => (
                  <tr key={file.id}>
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
                          <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                            <Image src={file.cover} alt="" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                            <FileIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <span className="truncate max-w-[200px]" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-default">{file.task_name}</span>
                    </td>
                    <td className="text-gray-500 dark:text-gray-400">
                      {file.size === 0 ? '-' : formatSize(file.size)}
                    </td>
                    <td className="text-gray-500 dark:text-gray-400">
                      {file.people || '-'}
                    </td>
                    <td className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(new Date(file.date))}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewInfo(file)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          title="查看信息"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShare(file)}
                          disabled={!file.fileId}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          title="分享"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRename(file)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          title="重命名"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          title="下载"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOne(file)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
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
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
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
                <p className="text-gray-900 dark:text-white">{currentFile.task_name}</p>
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
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
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
              <button onClick={() => setActiveModal(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
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
