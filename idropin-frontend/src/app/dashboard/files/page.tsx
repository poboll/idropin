'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  Download,
  Trash2,
  FileIcon,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileSpreadsheet,
  FileCode,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Copy,
  Edit3,
  Eye,
  Share2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  FolderOpen,
  Brain,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';

const AiRadarChart = dynamic(() => import('@/components/ai/AiRadarChart'), { ssr: false });
import { AuthGuard } from '@/components/auth';
import { apiClient } from '@/lib/api/client';
import { normalizeBackendUrl } from '@/lib/api/baseUrl';
import { useCategoryStore } from '@/lib/stores/category';
import { useTaskStore } from '@/lib/stores/task';
import { formatDate, formatSize, getFileSuffix } from '@/lib/utils/string';
import { copyRes } from '@/lib/utils/string';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import DownloadHistoryPanel, { DownloadAction, DownloadStatus, ActionType } from '@/components/files/DownloadHistoryPanel';
import FileModals from '@/components/files/FileModals';

interface FileRecord {
  id: string | number;
  date: string;
  task_key: string;
  task_name: string;
  name: string;
  origin_name?: string;
  size: number;
  people?: string;
  submitterIp?: string;
  info: string;
  cover?: string;
  downloadCount?: number;
  fileId?: string;
  mimeType?: string;
  restriction_list?: string[];
  aiStatus?: number;
  aiScore?: number;
  isPlagiarized?: boolean;
}

function getFileTypeIcon(mimeType?: string, className = 'w-4 h-4') {
  if (!mimeType) return <FileIcon className={`${className} text-gray-400`} />;
  if (mimeType.startsWith('image/')) return <FileImage className={`${className} text-pink-500`} />;
  if (mimeType.startsWith('video/')) return <FileVideo className={`${className} text-purple-500`} />;
  if (mimeType.startsWith('audio/')) return <FileAudio className={`${className} text-green-500`} />;
  if (mimeType.includes('pdf')) return <FileText className={`${className} text-red-500`} />;
  if (mimeType.includes('word') || mimeType.includes('document') || mimeType.includes('msword') || mimeType.includes('wordprocessingml'))
    return <FileText className={`${className} text-blue-600`} />;
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('ms-excel'))
    return <FileSpreadsheet className={`${className} text-emerald-600`} />;
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation') || mimeType.includes('ms-powerpoint'))
    return <FileText className={`${className} text-orange-500`} />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z') || mimeType.includes('tar') || mimeType.includes('gzip'))
    return <FileArchive className={`${className} text-amber-500`} />;
  if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml'))
    return <FileCode className={`${className} text-cyan-500`} />;
  return <FileIcon className={`${className} text-gray-400`} />;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

// 飞书风格的任务颜色配置
const TASK_COLORS = [
  { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-800' },
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

function ToggleSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600 dark:text-gray-400">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`} />
      </button>
      <span className={`text-xs font-medium ${checked ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
        {checked ? '是' : '否'}
      </span>
    </label>
  );
}

function AiDrawerContent({ file }: { file: FileRecord }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const submissionId = String(file.id).replace('submission-', '');
    apiClient.get(`/tasks/${file.task_key}/info-submissions`)
      .then(res => {
        const submissions = res.data?.data?.submissions || [];
        const found = submissions.find((s: any) => s.id === submissionId);
        setData(found || null);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [file]);

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  const evaluation = data?.aiEvaluation;
  if (!evaluation) return (
    <div className="p-12 text-center">
      <AlertCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p className="text-gray-500 dark:text-gray-400">暂无评估数据</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="text-center py-4">
        <div className="text-5xl font-bold text-gray-900 dark:text-white">{evaluation.score}</div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">综合评分</p>
        {data?.isPlagiarized && (
          <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />涉嫌与其他提交高度相似
          </span>
        )}
      </div>
      {evaluation.dimensions && Object.keys(evaluation.dimensions).length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">维度分析</h4>
          <AiRadarChart dimensions={evaluation.dimensions} />
        </div>
      )}
      {evaluation.summary && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">评价摘要</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{evaluation.summary}</p>
        </div>
      )}
      {evaluation.feedback && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">详细反馈</h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            {evaluation.feedback}
          </div>
        </div>
      )}
      <div className="text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
        评估时间：{new Date(evaluation.evaluatedAt).toLocaleString('zh-CN')}
      </div>
    </div>
  );
}

function FilesPageContent() {
  const searchParams = useSearchParams();
  const taskParam = searchParams?.get('task');
  
  const { categoryList: categories, getCategory: fetchCategories } = useCategoryStore();
  const { taskList: tasks, getTask: fetchTasks } = useTaskStore();

  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTask, setSelectedTask] = useState('all');
  const [searchWord, setSearchWord] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [selectedItems, setSelectedItems] = useState<(string | number)[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const SEARCH_HISTORY_KEY = 'idropin-file-search-history';

  const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);

  // 排序状态
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [pageSize, setPageSize] = useState(10);
  const [pageCurrent, setPageCurrent] = useState(1);
  const [gotoPage, setGotoPage] = useState('');

  // 显示开关
  const [showImages, setShowImages] = useState(true);
  const [showOriginalName, setShowOriginalName] = useState(false);
  const [showSubmitterName, setShowSubmitterName] = useState(false);
  const [showSubmitterIp, setShowSubmitterIp] = useState(false);
  const [showRestrictionList, setShowRestrictionList] = useState(true);
  const [showDownloadHistory, setShowDownloadHistory] = useState(false);

  const [activeModal, setActiveModal] = useState<'info' | 'rename' | 'download' | 'share' | null>(null);
  const [currentFile, setCurrentFile] = useState<FileRecord | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [shareFormData, setShareFormData] = useState({
    password: '',
    expireAt: '',
    downloadLimit: '',
  });
  const [shareResult, setShareResult] = useState<{ shareCode: string; url: string } | null>(null);

  const [downloadHistory, setDownloadHistory] = useState<DownloadAction[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [aiDrawerFile, setAiDrawerFile] = useState<FileRecord | null>(null);
  const [batchRegrading, setBatchRegrading] = useState(false);
  const [showTogglesPanel, setShowTogglesPanel] = useState(false);
  const HISTORY_PAGE_SIZE = 10;
  const HISTORY_STORAGE_KEY = 'idropin-download-history';

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) setDownloadHistory(JSON.parse(stored));
    } catch { /* ignore */ }
    try {
      const h = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (h) setSearchHistory(JSON.parse(h));
    } catch { /* ignore */ }
  }, []);

  const addDownloadAction = useCallback((action: DownloadAction) => {
    setDownloadHistory(prev => {
      const next = [action, ...prev].slice(0, 200);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const saveSearchHistory = useCallback((word: string) => {
    if (!word.trim()) return;
    setSearchHistory(prev => {
      const next = [word, ...prev.filter(h => h !== word)].slice(0, 10);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

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

      const apiFiles: FileRecord[] = submissions
        .filter((s: any) => s.fileId)
        .map((s: any, index: number) => ({
         id: `submission-${s.id || index}`,
         date: s.submittedAt || new Date().toISOString(),
         task_key: s.taskId,
         task_name: s.taskTitle || '未知任务',
         name: s.fileName || (s.submitterName ? `提交_${s.submitterName}` : '未命名'),
         origin_name: s.originalFileName || s.fileName,
         size: s.fileSize || 0,
         people: s.submitterName || '-',
         submitterIp: s.submitterIp || '-',
         info: '[]',
         downloadCount: 0,
         fileId: s.fileId,
         mimeType: s.mimeType,
         cover: s.mimeType?.startsWith('image/') && s.fileUrl ? normalizeBackendUrl(s.fileUrl) : undefined,
         restriction_list: s.appliedRestrictionList || [],
         aiStatus: s.aiStatus,
         aiScore: s.aiEvaluation?.score,
         isPlagiarized: s.isPlagiarized,
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
        if (ipFilter && !f.submitterIp?.includes(ipFilter)) return false;
        if (!searchWord) return true;
        const searchStr = [f.name, f.origin_name, f.task_name, f.people, f.submitterIp]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchStr.includes(searchWord.toLowerCase());
      });

    return sortFiles(filtered);
  }, [files, selectedCategory, selectedTask, searchWord, ipFilter, tasks, filteredTasks, sortFiles]);

  const pageCount = Math.ceil(filteredFiles.length / pageSize);
  const paginatedFiles = useMemo(() => {
    const start = (pageCurrent - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, pageCurrent, pageSize]);

  const selectedOnPageCount = useMemo(() => {
    if (paginatedFiles.length === 0 || selectedItems.length === 0) return 0;
    const selectedSet = new Set(selectedItems);
    return paginatedFiles.reduce((acc, f) => acc + (selectedSet.has(f.id) ? 1 : 0), 0);
  }, [paginatedFiles, selectedItems]);

  const isAllSelectedOnPage = paginatedFiles.length > 0 && selectedOnPageCount === paginatedFiles.length;
  const isSomeSelectedOnPage = selectedOnPageCount > 0 && !isAllSelectedOnPage;

  useEffect(() => {
    if (!selectAllCheckboxRef.current) return;
    selectAllCheckboxRef.current.indeterminate = isSomeSelectedOnPage;
  }, [isSomeSelectedOnPage]);

  const totalSize = useMemo(() => formatSize(files.reduce((acc, f) => acc + f.size, 0)), [files]);

  const currentTaskSize = useMemo(() => {
    if (selectedTask === 'all') return totalSize;
    return formatSize(files.filter(f => f.task_key === selectedTask).reduce((acc, f) => acc + f.size, 0));
  }, [files, selectedTask, totalSize]);

  const aiAvgScore = useMemo(() => {
    const graded = files.filter(f => f.aiStatus === 2 && f.aiScore != null);
    if (graded.length === 0) return null;
    return Math.round(graded.reduce((s, f) => s + (f.aiScore ?? 0), 0) / graded.length);
  }, [files]);

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
    const pageIds = paginatedFiles.map(f => f.id);
    if (pageIds.length === 0) return;

    if (checked) {
      setSelectedItems(prev => Array.from(new Set([...prev, ...pageIds])));
      return;
    }

    setSelectedItems(prev => prev.filter(id => !pageIds.includes(id)));
  };

  const handleBatchDelete = () => {
    if (selectedItems.length === 0) return;
    if (confirm(`确定删除选中的 ${selectedItems.length} 个文件吗？`)) {
      setFiles(prev => prev.filter(f => !selectedItems.includes(f.id)));
      setSelectedItems([]);
    }
  };

  const handleBatchDownload = async () => {
    if (isBatchDownloading) return;
    const selected = files.filter(f => selectedItems.includes(f.id) && f.fileId);
    if (selected.length === 0) {
      alert('没有可下载的文件');
      return;
    }

    setIsBatchDownloading(true);

    const actionId = `archive-${Date.now()}`;
    const archiveFileName = `批量下载_${new Date().toISOString().slice(0, 10)}.zip`;
    
    addDownloadAction({
      id: actionId,
      date: new Date().toISOString(),
      tip: `${archiveFileName} (${selected.length}个文件)`,
      type: ActionType.Compress,
      status: DownloadStatus.ARCHIVE,
    });

    try {
      const JSZip = (await import('jszip')).default;
      const fileSaver = await import('file-saver');
      const saveAs = fileSaver.default || fileSaver.saveAs;
      const zip = new JSZip();
      let successCount = 0;
      let failCount = 0;

      for (const file of selected) {
        try {
          const response = await apiClient.get(`/files/${file.fileId}/download`, { responseType: 'arraybuffer' });
          const fileName = file.origin_name || file.name;
          zip.file(fileName, response.data);
          successCount++;
        } catch (err) {
          console.error(`下载 ${file.name} 失败`, err);
          failCount++;
        }
      }

      if (successCount === 0) {
        addDownloadAction({
          id: actionId,
          date: new Date().toISOString(),
          tip: archiveFileName,
          type: ActionType.Compress,
          status: DownloadStatus.FAIL,
          error: '所有文件下载失败',
        });
        alert('所有文件下载失败');
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      saveAs(content, archiveFileName);

      addDownloadAction({
        id: actionId,
        date: new Date().toISOString(),
        tip: `${archiveFileName} (成功: ${successCount}, 失败: ${failCount})`,
        type: ActionType.Compress,
        status: DownloadStatus.SUCCESS,
        size: content.size,
        url,
      });

      if (failCount > 0) {
        alert(`归档完成！成功: ${successCount} 个，失败: ${failCount} 个`);
      }
    } catch (err) {
      console.error('归档失败', err);
      addDownloadAction({
        id: actionId,
        date: new Date().toISOString(),
        tip: archiveFileName,
        type: ActionType.Compress,
        status: DownloadStatus.FAIL,
        error: '归档失败',
      });
      alert('归档失败，请重试');
    } finally {
      setIsBatchDownloading(false);
    }
  };

  const handleBatchRegrade = async () => {
    const selected = files.filter(f => selectedItems.includes(f.id) && f.fileId);
    if (selected.length === 0) return;
    setBatchRegrading(true);
    try {
      const { batchRegradeSubmissions } = await import('@/lib/api/tasks');
      const submissionIds = selected.map(f => String(f.id).replace('submission-', ''));
      const taskId = selected[0].task_key;
      await batchRegradeSubmissions(taskId, submissionIds);
      alert(`已触发 ${selected.length} 条重新评分，请稍后刷新查看结果`);
    } catch {
      alert('触发重新评分失败');
    } finally {
      setBatchRegrading(false);
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

  const handleDownload = async (file: FileRecord) => {
    if (!file.fileId) {
      setCurrentFile(file);
      setActiveModal('download');
      return;
    }
    const actionId = `dl-${Date.now()}-${file.id}`;
    try {
      const response = await apiClient.get(`/files/${file.fileId}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.origin_name || file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      addDownloadAction({
        id: actionId,
        date: new Date().toISOString(),
        tip: file.origin_name || file.name,
        type: ActionType.Download,
        status: DownloadStatus.SUCCESS,
        size: file.size,
        url,
      });
    } catch (err) {
      console.error('下载失败', err);
      addDownloadAction({
        id: actionId,
        date: new Date().toISOString(),
        tip: file.origin_name || file.name,
        type: ActionType.Download,
        status: DownloadStatus.FAIL,
        error: '下载失败',
      });
      alert('下载失败，请重试');
    }
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

  const handleExportCSV = () => {
    if (selectedItems.length === 0) {
      alert('请先选择要导出的文件');
      return;
    }
    const selectedFiles = filteredFiles.filter(f => selectedItems.includes(f.id));
    const headers = ['文件名', '原始文件名', '任务', '大小', '提交人', 'IP地址', '提交时间'];
    const rows = selectedFiles.map(f => [
      f.name,
      f.origin_name || f.name,
      f.task_name,
      f.size === 0 ? '-' : formatSize(f.size),
      f.people || '-',
      f.submitterIp || '-',
      formatDate(new Date(f.date)),
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `文件记录_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="page-title">文件管理</h1>
        <p className="page-description">管理和查看所有收集的文件</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5 hover-lift animate-slide-in-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <FileIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">总提交数</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{files.length}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{totalSize}</div>
            </div>
          </div>
        </div>
        <div className="card p-5 hover-lift animate-slide-in-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">提交人数</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {new Set(files.map(f => f.people).filter(Boolean)).size}
              </div>
            </div>
          </div>
        </div>
        <div className="card p-5 hover-lift animate-slide-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">筛选结果</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{filteredFiles.length}</div>
            </div>
          </div>
        </div>
        <div className="card p-5 hover-lift animate-slide-in-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">AI均分</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {aiAvgScore != null ? `${aiAvgScore}` : '—'}
              </div>
              {aiAvgScore != null && <div className="text-xs text-gray-400 dark:text-gray-500">满分100</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Filters + Toolbar */}
      <div className="card p-4 space-y-3">
        {/* Row 1: Filters */}
        <div className="flex flex-col lg:flex-row gap-3">
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
          <input
            type="text"
            value={ipFilter}
            onChange={(e) => { setIpFilter(e.target.value); setPageCurrent(1); }}
            placeholder="筛选IP地址..."
            className="input w-full lg:w-48"
          />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchWord}
              onChange={(e) => { setSearchWord(e.target.value); setPageCurrent(1); }}
              onFocus={() => setShowSearchHistory(true)}
              onBlur={() => setTimeout(() => setShowSearchHistory(false), 150)}
              onKeyDown={(e) => { if (e.key === 'Enter' && searchWord.trim()) saveSearchHistory(searchWord.trim()); }}
              placeholder="搜索文件名、任务、提交人..."
              className="input pl-10 pr-8"
            />
            {searchWord && (
              <button
                onClick={() => { setSearchWord(''); setPageCurrent(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {showSearchHistory && searchHistory.length > 0 && !searchWord && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="px-3 py-1.5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">搜索历史</span>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); setSearchHistory([]); localStorage.removeItem(SEARCH_HISTORY_KEY); }}
                    className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >清除</button>
                </div>
                {searchHistory.map((h, i) => (
                  <button
                    key={i}
                    onMouseDown={(e) => { e.preventDefault(); setSearchWord(h); setPageCurrent(1); setShowSearchHistory(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                  >
                    <Search className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{h}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Toolbar — actions + toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <button onClick={loadFiles} disabled={isLoading} className="btn-secondary">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              刷新
            </button>
            <button onClick={handleExportCSV} disabled={selectedItems.length === 0} className="btn-secondary">
              <Download className="w-4 h-4" />
              导出CSV
            </button>
            {selectedItems.length > 0 && (
              <div className="flex items-center gap-2 animate-slide-in-up">
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  已选 {selectedItems.length} 项
                </span>
                <button onClick={() => setSelectedItems([])} className="btn-ghost btn-sm">
                  取消选择
                </button>
                <button onClick={handleBatchDownload} disabled={isBatchDownloading} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                  <Download className="w-4 h-4" />
                  {isBatchDownloading ? '下载中...' : '批量下载'}
                </button>
                <button onClick={handleBatchRegrade} disabled={batchRegrading} className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed">
                  <Brain className="w-4 h-4" />
                  {batchRegrading ? '提交中...' : '重新评分'}
                </button>
                <button onClick={handleBatchDelete} className="btn-danger">
                  <Trash2 className="w-4 h-4" />
                  批量删除
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-x-5 gap-y-1">
            <div className="relative sm:hidden">
              <button
                onClick={() => setShowTogglesPanel(v => !v)}
                className={`btn-secondary gap-1.5 ${showTogglesPanel ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                列设置
              </button>
              {showTogglesPanel && (
                <div className="absolute right-0 top-full mt-1.5 z-30 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3 flex flex-col gap-2.5 min-w-[130px]">
                  <ToggleSwitch label="显示图片" checked={showImages} onChange={setShowImages} />
                  <ToggleSwitch label="原文件名" checked={showOriginalName} onChange={setShowOriginalName} />
                  <ToggleSwitch label="提交人" checked={showSubmitterName} onChange={setShowSubmitterName} />
                  <ToggleSwitch label="IP地址" checked={showSubmitterIp} onChange={setShowSubmitterIp} />
                  <ToggleSwitch label="限制名单" checked={showRestrictionList} onChange={setShowRestrictionList} />
                  <ToggleSwitch label="下载历史" checked={showDownloadHistory} onChange={setShowDownloadHistory} />
                </div>
              )}
            </div>
            <div className="hidden sm:flex flex-wrap items-center gap-x-5 gap-y-1">
              <ToggleSwitch label="显示图片" checked={showImages} onChange={setShowImages} />
              <ToggleSwitch label="原文件名" checked={showOriginalName} onChange={setShowOriginalName} />
              <ToggleSwitch label="提交人" checked={showSubmitterName} onChange={setShowSubmitterName} />
              <ToggleSwitch label="IP地址" checked={showSubmitterIp} onChange={setShowSubmitterIp} />
              <ToggleSwitch label="限制名单" checked={showRestrictionList} onChange={setShowRestrictionList} />
              <ToggleSwitch label="下载历史" checked={showDownloadHistory} onChange={setShowDownloadHistory} />
            </div>
          </div>
        </div>
      </div>

      {/* Download History Panel — above file table */}
      {showDownloadHistory && (
        <DownloadHistoryPanel
          actions={downloadHistory.slice(
            (historyPage - 1) * HISTORY_PAGE_SIZE,
            historyPage * HISTORY_PAGE_SIZE
          )}
          compressTasks={downloadHistory.filter(a => a.status === DownloadStatus.ARCHIVE)}
          pageSize={HISTORY_PAGE_SIZE}
          pageCount={Math.ceil(downloadHistory.length / HISTORY_PAGE_SIZE)}
          pageCurrent={historyPage}
          pageTotal={downloadHistory.length}
          onPageChange={setHistoryPage}
          onDownload={(url) => {
            const a = document.createElement('a');
            a.href = url;
            a.download = '';
            document.body.appendChild(a);
            a.click();
            a.remove();
          }}
          onCopyLink={(url) => { copyRes(url); alert('链接已复制'); }}
          onShowQrCode={() => {}}
        />
      )}

      {/* Stats Summary */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-1">
        共 <span className="font-medium text-gray-700 dark:text-gray-300">{files.length}</span> 个文件，
        全部大小：<span className="font-medium text-gray-700 dark:text-gray-300">{totalSize}</span>，
        当前筛选大小：<span className="font-medium text-gray-700 dark:text-gray-300">{currentTaskSize}</span>
        {selectedItems.length > 0 && (
          <span>，已选择 <span className="font-medium text-blue-600 dark:text-blue-400">{selectedItems.length}</span> 项</span>
        )}
      </div>

      {/* File Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10"></th>
                    <th>提交时间</th>
                    <th>任务</th>
                    <th>文件名</th>
                    <th>大小</th>
                    <th>缩略图</th>
                    <th>提交人</th>
                    <th>AI</th>
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
                <tr className="bg-gray-50/80 dark:bg-gray-800/50">
                  <th className="w-10">
                    <div className="flex items-center justify-center">
                      <input
                        ref={selectAllCheckboxRef}
                        type="checkbox"
                        checked={isAllSelectedOnPage}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </th>
                  <th className="hidden sm:table-cell">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      提交时间
                      {renderSortIcon('date')}
                    </button>
                  </th>
                  <th className="hidden sm:table-cell">
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
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      文件名
                      {renderSortIcon('name')}
                    </button>
                  </th>
                  {showOriginalName && <th>原文件名</th>}
                  {showRestrictionList && <th>限制名单</th>}
                  <th className="hidden sm:table-cell">
                    <button
                      onClick={() => handleSort('size')}
                      className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      大小
                      {renderSortIcon('size')}
                    </button>
                  </th>
                  {showImages && <th className="hidden sm:table-cell">缩略图</th>}
                  {showSubmitterName && (
                    <th>
                      <button
                        onClick={() => handleSort('people')}
                        className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        提交人
                        {renderSortIcon('people')}
                      </button>
                    </th>
                  )}
                  {showSubmitterIp && <th>IP地址</th>}
                  <th className="hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5" />
                      AI
                    </div>
                  </th>
                  <th className="w-28">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFiles.map((file, index) => (
                  <tr
                    key={file.id}
                    className={`group transition-colors ${selectedItems.includes(file.id) ? 'bg-blue-50/60 dark:bg-blue-900/10' : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/40'}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(file.id)}
                          onChange={(e) => handleSelectItem(file.id, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    </td>
                    <td className="hidden sm:table-cell text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      <span title={new Date(file.date).toLocaleString('zh-CN')}>
                        {formatRelativeTime(file.date)}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border ${getTaskBadgeStyle(file.task_key)}`}>
                        {file.task_name}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                          {getFileTypeIcon(file.mimeType, 'w-3.5 h-3.5')}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="truncate max-w-[220px] font-medium text-gray-900 dark:text-white inline-flex items-center gap-1.5" title={file.name}>
                            {file.name}
                            {file.aiStatus === 2 && (
                              <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                                (file.aiScore ?? 0) >= 80 ? 'bg-emerald-500' :
                                (file.aiScore ?? 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`} title={`AI评分: ${file.aiScore}分`} />
                            )}
                            {file.aiStatus === 1 && (
                              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" title="AI评估中" />
                            )}
                          </span>
                          {showOriginalName && file.origin_name && file.origin_name !== file.name && (
                            <span className="truncate max-w-[220px] text-xs text-gray-400 dark:text-gray-500 lg:hidden" title={file.origin_name}>
                              {file.origin_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {showOriginalName && (
                      <td className="text-gray-500 dark:text-gray-400">
                        {file.origin_name ? (
                          <span className="truncate max-w-[150px] block" title={file.origin_name}>
                            {file.origin_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                    )}
                    {showRestrictionList && (
                      <td className="text-gray-500 dark:text-gray-400">
                        {file.restriction_list && file.restriction_list.length > 0 ? (
                          <span className="truncate max-w-[120px] block" title={file.restriction_list.join(', ')}>
                            {file.restriction_list.join(', ')}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    )}
                    <td className="hidden sm:table-cell text-gray-500 dark:text-gray-400">
                      {file.size === 0 ? '-' : formatSize(file.size)}
                    </td>
                    {showImages && (
                    <td className="hidden sm:table-cell">
                        {file.cover ? (
                          <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-700">
                            <Image src={file.cover} alt="" fill className="object-cover" loading="lazy" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileIcon className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </td>
                    )}
                    {showSubmitterName && (
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                            {file.people && file.people !== '-' ? file.people[0].toUpperCase() : '匿'}
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {file.people && file.people !== '-' ? file.people : '匿名用户'}
                          </span>
                        </div>
                      </td>
                    )}
                    {showSubmitterIp && (
                      <td className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                        {file.submitterIp || '-'}
                      </td>
                    )}
                     <td className="hidden sm:table-cell">
                     <div className="flex items-center gap-1.5">
                         {file.aiStatus === 2 ? (
                           <button
                             onClick={() => setAiDrawerFile(file)}
                             className="flex items-center gap-1.5 group/ai"
                             title={`AI评分: ${file.aiScore}分，点击查看详情`}
                           >
                             <span className={`text-xs font-semibold tabular-nums ${
                               (file.aiScore ?? 0) >= 80 ? 'text-emerald-700 dark:text-emerald-400' :
                               (file.aiScore ?? 0) >= 60 ? 'text-amber-700 dark:text-amber-400' :
                               'text-red-700 dark:text-red-400'
                             }`}>
                               {file.aiScore ?? '-'}
                             </span>
                             <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                               <div
                                 className={`h-full rounded-full transition-all ${
                                   (file.aiScore ?? 0) >= 80 ? 'bg-emerald-500' :
                                   (file.aiScore ?? 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                 }`}
                                 style={{ width: `${Math.min(file.aiScore ?? 0, 100)}%` }}
                               />
                             </div>
                           </button>
                        ) : file.aiStatus === 1 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 animate-pulse">评估中</span>
                        ) : file.aiStatus === -1 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">失败</span>
                        ) : (
                          <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                        )}
                        {file.isPlagiarized && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">抄</span>
                        )}
                       </div>
                    </td>
                     <td>
                       <div className="flex items-center gap-0.5">
                         <button
                           onClick={() => handleViewInfo(file)}
                           className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-150"
                           title="查看信息"
                         >
                           <Eye className="w-3.5 h-3.5" />
                         </button>
                         <button
                           onClick={() => handleShare(file)}
                           disabled={!file.fileId}
                           className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                           title="分享"
                         >
                           <Share2 className="w-3.5 h-3.5" />
                         </button>
                         <button
                           onClick={() => handleRename(file)}
                           className="p-1.5 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all duration-150"
                           title="重命名"
                         >
                           <Edit3 className="w-3.5 h-3.5" />
                         </button>
                         <button
                           onClick={() => handleDownload(file)}
                           className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-150"
                           title="下载"
                         >
                           <Download className="w-3.5 h-3.5" />
                         </button>
                         <button
                           onClick={() => handleDeleteOne(file)}
                           className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-150"
                           title="删除"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
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
        {pageCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                共 {filteredFiles.length} 条
              </span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPageCurrent(1); }}
                className="input py-1 px-2 w-auto text-sm"
              >
                <option value={6}>6条/页</option>
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPageCurrent(p => Math.max(1, p - 1))}
                disabled={pageCurrent <= 1}
                className="w-8 h-8 flex items-center justify-center rounded text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {(() => {
                const pages: (number | 'ellipsis')[] = [];
                if (pageCount <= 7) {
                  for (let i = 1; i <= pageCount; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (pageCurrent > 4) pages.push('ellipsis');
                  const start = Math.max(2, pageCurrent - 2);
                  const end = Math.min(pageCount - 1, pageCurrent + 2);
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (pageCurrent < pageCount - 3) pages.push('ellipsis');
                  pages.push(pageCount);
                }
                return pages.map((p, idx) =>
                  p === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="w-8 h-8 flex items-center justify-center text-sm text-gray-400">···</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPageCurrent(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
                        p === pageCurrent
                          ? 'bg-blue-500 text-white font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
              <button
                onClick={() => setPageCurrent(p => Math.min(pageCount, p + 1))}
                disabled={pageCurrent >= pageCount}
                className="w-8 h-8 flex items-center justify-center rounded text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>前往</span>
              <input
                type="text"
                value={gotoPage}
                onChange={(e) => setGotoPage(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = parseInt(gotoPage);
                    if (target >= 1 && target <= pageCount) {
                      setPageCurrent(target);
                      setGotoPage('');
                    }
                  }
                }}
                className="input w-14 py-1 px-2 text-center text-sm"
                placeholder="1"
              />
              <span>页</span>
            </div>
          </div>
        )}
      </div>

      <FileModals
        activeModal={activeModal}
        setActiveModal={setActiveModal}
        currentFile={currentFile}
        renameValue={renameValue}
        setRenameValue={setRenameValue}
        handleSaveRename={handleSaveRename}
        shareFormData={shareFormData}
        setShareFormData={setShareFormData}
        shareResult={shareResult}
        handleCreateShare={handleCreateShare}
        getTaskBadgeStyle={getTaskBadgeStyle}
      />

      {aiDrawerFile && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setAiDrawerFile(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg z-50 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI 评估详情</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{aiDrawerFile.people || '匿名用户'} · {aiDrawerFile.name}</p>
                </div>
              </div>
              <button onClick={() => setAiDrawerFile(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <AiDrawerContent file={aiDrawerFile} />
          </div>
        </>
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
