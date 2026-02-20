'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText, Clock, User, MapPin, Loader2, AlertCircle, ExternalLink, Trash2, Edit3, X, Check, Search, Filter, FolderOpen, Archive, Brain } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const AiRadarChart = dynamic(() => import('@/components/ai/AiRadarChart'), {
  loading: () => <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">加载图表...</div>,
  ssr: false,
});
import { getTaskInfoSubmissions, exportInfoSubmissions, getTaskAiPrompt, saveTaskAiPrompt, regradeSubmission, batchRegradeSubmissions } from '@/lib/api/tasks';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth';
import { getToken } from '@/lib/api/client';

interface AiEvaluation {
  score: number;
  dimensions: Record<string, number>;
  feedback: string;
  summary: string;
  evaluatedAt: string;
}

interface InfoSubmission {
  id: string;
  submitterName: string;
  submitterEmail?: string;
  submittedAt: string;
  infoData: string;
  fileName?: string;
  fileSize?: number;
  fileId?: string;
  status: number;
  createdAt?: string;
  submitterIp?: string;
  aiStatus?: number;
  aiEvaluation?: AiEvaluation | null;
  isPlagiarized?: boolean;
  similarToId?: string | null;
}

export default function TaskSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  const { isAuthenticated, fetchCurrentUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<InfoSubmission[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [collectionType, setCollectionType] = useState<'INFO' | 'FILE'>('FILE');
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'withdrawn'>('all');
  const [archiving, setArchiving] = useState(false);
  const [aiDrawerSubmission, setAiDrawerSubmission] = useState<InfoSubmission | null>(null);
  const [overrideScore, setOverrideScore] = useState('');
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPromptSaving, setAiPromptSaving] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchRegrading, setBatchRegrading] = useState(false);
  
  // 防止重复请求的标志
  const isLoadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowExportMenu(false);
    };
    if (showExportMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showExportMenu]);

  // 使用useCallback防止函数重新创建导致的无限循环
  const loadSubmissions = useCallback(async () => {
    // 防止重复请求
    if (isLoadingRef.current || hasLoadedRef.current) {
      console.log('Skipping duplicate request');
      return;
    }

    isLoadingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Loading submissions for task:', taskId);
      
      const result = await getTaskInfoSubmissions(taskId);
      setSubmissions(result.submissions);
      setTaskTitle(result.taskTitle);
      setCollectionType(result.collectionType);
      if (result.collectionType === 'FILE') {
        getTaskAiPrompt(taskId).then(setAiPrompt).catch(() => {});
      }
      hasLoadedRef.current = true;
      console.log('Submissions loaded successfully');
    } catch (error: any) {
      console.error('Failed to load submissions:', error);
      const errorMessage = error?.message || error?.response?.data?.message || '加载提交记录失败';
      setError(errorMessage);
      
      // 如果是401错误，跳转到登录页
      if (error?.response?.status === 401 || error?.code === 401) {
        console.log('Unauthorized, redirecting to login');
        router.push('/login');
      }
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [taskId, router]);

  // 检查认证状态 - 只在组件挂载时执行一次
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      console.log('Checking authentication...');
      const token = getToken();
      
      if (!token) {
        console.log('No token found, redirecting to login');
        if (isMounted) {
          router.push('/login');
        }
        return;
      }
      
      // 确保用户信息已加载
      if (!isAuthenticated) {
        try {
          console.log('Fetching current user...');
          await fetchCurrentUser();
        } catch (err) {
          console.error('Failed to fetch user:', err);
          if (isMounted) {
            router.push('/login');
          }
          return;
        }
      }
      
      // 认证成功后加载提交记录
      if (isMounted) {
        console.log('Authentication successful, loading submissions...');
        loadSubmissions();
      }
    };
    
    checkAuth();
    
    // 清理函数
    return () => {
      isMounted = false;
    };
  }, [fetchCurrentUser, isAuthenticated, loadSubmissions, router]);


  const handleExport = async (format: 'csv' | 'json' | 'txt' | 'excel') => {
    try {
      setExporting(true);
      
      // 生成统一的日期格式：YYYY-MM-DD
      const dateStr = new Date().toISOString().split('T')[0];
      
      if (format === 'csv' || format === 'excel') {
        await exportInfoSubmissions(taskId, format);
      } else if (format === 'json') {
        // JSON格式导出
        const exportData = {
          taskTitle,
          taskId,
          collectionType,
          exportedAt: new Date().toISOString(),
          totalSubmissions: submissions.length,
          submissions: submissions.map(sub => ({
            id: sub.id,
            submitterName: sub.submitterName,
            submitterEmail: sub.submitterEmail,
            submitterIp: sub.submitterIp,
            submittedAt: sub.submittedAt,
            status: sub.status === 0 ? '已提交' : '已撤回',
            infoData: parseInfoData(sub.infoData),
            fileName: sub.fileName,
            fileSize: sub.fileSize,
          }))
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${taskTitle}_提交记录_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'txt') {
        // TXT格式导出
        let txtContent = `任务名称: ${taskTitle}\n`;
        txtContent += `任务ID: ${taskId}\n`;
        txtContent += `收集类型: ${collectionType === 'INFO' ? '信息收集' : '文件收集'}\n`;
        txtContent += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
        txtContent += `总提交数: ${submissions.length}\n`;
        txtContent += `\n${'='.repeat(80)}\n\n`;
        
          submissions.forEach((sub, index) => {
            txtContent += `【提交 ${index + 1}】\n`;
            txtContent += `提交者: ${sub.submitterName || '匿名用户'}\n`;
            if (sub.submitterEmail) txtContent += `邮箱: ${sub.submitterEmail}\n`;
            txtContent += `IP地址: ${sub.submitterIp || '-'}\n`;
            txtContent += `提交时间: ${formatDateTime(sub.submittedAt)}\n`;
            txtContent += `状态: ${sub.status === 0 ? '已提交' : '已撤回'}\n`;
            txtContent += `凭证编号: ${sub.id.slice(0, 8).toUpperCase()}\n`;
          
          const infoData = parseInfoData(sub.infoData);
          if (Object.keys(infoData).length > 0) {
            txtContent += `\n提交的信息:\n`;
            Object.entries(infoData).forEach(([key, value]) => {
              txtContent += `  ${key}: ${value}\n`;
            });
          }
          
          if (sub.fileName) {
            txtContent += `\n文件信息:\n`;
            txtContent += `  文件名: ${sub.fileName}\n`;
            txtContent += `  文件大小: ${formatFileSize(sub.fileSize)}\n`;
          }
          
          txtContent += `\n${'-'.repeat(80)}\n\n`;
        });
        
        const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${taskTitle}_提交记录_${dateStr}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export:', error);
      alert('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    setDeletingId(submissionId);
    try {
      await apiClient.delete(`/tasks/${taskId}/submissions/${submissionId}/admin`);
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
    } catch (error: any) {
      alert(error?.response?.data?.message || '删除失败');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSubmission = async (submissionId: string) => {
    setEditSaving(true);
    try {
      await apiClient.put(`/tasks/${taskId}/submissions/${submissionId}/admin`, { infoData: JSON.stringify(editData) });
      setSubmissions(prev => prev.map(s =>
        s.id === submissionId ? { ...s, infoData: JSON.stringify(editData) } : s
      ));
      setEditingId(null);
    } catch (error: any) {
      alert(error?.response?.data?.message || '保存失败');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDownloadFile = async (submission: InfoSubmission) => {
    if (!submission.fileId) return;
    try {
      const response = await apiClient.get(`/files/${submission.fileId}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = submission.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('下载失败');
    }
  };

  const handleArchiveAll = async () => {
    const fileSubmissions = submissions.filter(s => s.fileId && s.fileName);
    
    if (fileSubmissions.length === 0) {
      alert('没有可归档的文件');
      return;
    }

    if (!confirm(`确定要下载归档所有 ${fileSubmissions.length} 个文件吗？`)) {
      return;
    }

    setArchiving(true);
    try {
      const [{ default: JSZip }, { saveAs }] = await Promise.all([
        import('jszip'),
        import('file-saver'),
      ]);
      const zip = new JSZip();
      let successCount = 0;
      let failCount = 0;

      for (const submission of fileSubmissions) {
        try {
          const response = await apiClient.get(`/files/${submission.fileId}/download`, { 
            responseType: 'arraybuffer' 
          });
          
          const fileName = submission.fileName || `${submission.submitterName || '匿名用户'}_${submission.id}`;
          zip.file(fileName, response.data);
          successCount++;
        } catch (error) {
          console.error(`Failed to download file ${submission.fileName}:`, error);
          failCount++;
        }
      }

      if (successCount === 0) {
        alert('所有文件下载失败，无法生成归档');
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const zipFileName = `${taskTitle || 'task'}_${timestamp}.zip`;
      saveAs(content, zipFileName);

      if (failCount > 0) {
        alert(`归档完成！成功: ${successCount} 个，失败: ${failCount} 个`);
      } else {
        alert(`归档成功！已打包 ${successCount} 个文件`);
      }
    } catch (error) {
      console.error('Archive failed:', error);
      alert('归档失败，请重试');
    } finally {
      setArchiving(false);
    }
  };

  const handleSaveAiPrompt = async () => {
    setAiPromptSaving(true);
    try {
      await saveTaskAiPrompt(taskId, aiPrompt);
      setShowPromptEditor(false);
    } catch {
      alert('保存失败');
    } finally {
      setAiPromptSaving(false);
    }
  };

  const handleBatchRegrade = async () => {
    if (selectedIds.length === 0) return;
    setBatchRegrading(true);
    try {
      await batchRegradeSubmissions(taskId, selectedIds, aiPrompt || undefined);
      alert(`已触发 ${selectedIds.length} 条重新评分`);
      setSelectedIds([]);
    } catch {
      alert('触发失败');
    } finally {
      setBatchRegrading(false);
    }
  };

  const handleOverrideScore = async () => {
    if (!aiDrawerSubmission) return;
    const score = parseInt(overrideScore, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      alert('请输入 0-100 之间的整数');
      return;
    }
    setOverrideSaving(true);
    try {
      await apiClient.put(`/tasks/${taskId}/submissions/${aiDrawerSubmission.id}/ai-score`, { score });
      setSubmissions(prev => prev.map(s =>
        s.id === aiDrawerSubmission.id
          ? { ...s, aiEvaluation: s.aiEvaluation ? { ...s.aiEvaluation, score } : s.aiEvaluation }
          : s
      ));
      setAiDrawerSubmission(prev =>
        prev ? { ...prev, aiEvaluation: prev.aiEvaluation ? { ...prev.aiEvaluation, score } : prev.aiEvaluation } : null
      );
      setOverrideScore('');
      alert('评分已更新');
    } catch (error: any) {
      alert(error?.response?.data?.message || '更新失败');
    } finally {
      setOverrideSaving(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const parseInfoData = (infoDataStr: string): Record<string, string> => {
    try {
      return JSON.parse(infoDataStr) || {};
    } catch {
      return {};
    }
  };

  const [sortMode, setSortMode] = useState<'time' | 'score'>('time');

  const filteredSubmissions = submissions.filter(s => {
    if (statusFilter === 'submitted' && s.status !== 0) return false;
    if (statusFilter === 'withdrawn' && s.status !== 1) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = s.submitterName?.toLowerCase().includes(term);
      const ipMatch = s.submitterIp?.toLowerCase().includes(term);
      const fileMatch = s.fileName?.toLowerCase().includes(term);
      if (!nameMatch && !ipMatch && !fileMatch) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortMode !== 'score') return 0;
    const sa = a.aiEvaluation?.score ?? -1;
    const sb = b.aiEvaluation?.score ?? -1;
    return sb - sa;
  });

  const gradedSubs = submissions.filter(s => s.aiStatus === 2 && s.aiEvaluation?.score != null);
  const scores = gradedSubs.map(s => s.aiEvaluation!.score!);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const maxScore = scores.length ? Math.max(...scores) : null;
  const gradeBands = [
    { label: 'S', min: 90, max: 100, color: 'bg-purple-500' },
    { label: 'A', min: 80, max: 89, color: 'bg-blue-500' },
    { label: 'B', min: 70, max: 79, color: 'bg-green-500' },
    { label: 'C', min: 60, max: 69, color: 'bg-yellow-500' },
    { label: 'D', min: 0,  max: 59, color: 'bg-red-500' },
  ];
  const bandCounts = gradeBands.map(b => ({
    ...b,
    count: scores.filter(s => s >= b.min && s <= b.max).length,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">加载失败</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              返回
            </button>
            <button
              onClick={() => loadSubmissions()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  提交记录管理
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {taskTitle} · {collectionType === 'INFO' ? '信息收集' : '文件收集'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/files?task=${taskId}`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                查看任务文件
              </Link>
              <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowExportMenu(!showExportMenu);
                }}
                disabled={exporting || submissions.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                导出数据
              </button>
              
              {showExportMenu && !exporting && submissions.length > 0 && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1 z-10">
                  <button
                    onClick={() => {
                      handleExport('csv');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    导出 CSV
                  </button>
                  <button
                    onClick={() => {
                      handleExport('json');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    导出 JSON
                  </button>
                  <button
                    onClick={() => {
                      handleExport('txt');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    导出 TXT
                  </button>
                  <button
                    onClick={() => {
                      handleExport('excel');
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    导出 Excel
                  </button>
                </div>
              )}
            </div>

            {/* 归档下载按钮 */}
            {collectionType === 'FILE' && submissions.filter(s => s.fileId).length > 0 && (
              <button
                onClick={handleArchiveAll}
                disabled={archiving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {archiving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
                {archiving ? '打包中...' : '归档下载'}
              </button>
            )}
            {collectionType === 'FILE' && (
              <>
                <button
                  onClick={() => setShowPromptEditor(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Brain className="w-4 h-4" />
                  AI提示词
                </button>
                {(() => {
                  const selectableIds = submissions.filter(s => s.fileId && s.status === 0).map(s => s.id);
                  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedIds.includes(id));
                  return (
                    <button
                      onClick={() => setSelectedIds(allSelected ? [] : selectableIds)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={allSelected}
                        className="w-3.5 h-3.5 pointer-events-none"
                      />
                      全选 ({selectableIds.length})
                    </button>
                  );
                })()}
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleBatchRegrade}
                    disabled={batchRegrading}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {batchRegrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                    重新评分 ({selectedIds.length})
                  </button>
                )}
              </>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showPromptEditor && collectionType === 'FILE' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">自定义AI评估提示词</h4>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              rows={4}
              placeholder="留空则使用默认提示词..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setShowPromptEditor(false)} className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">取消</button>
              <button onClick={handleSaveAiPrompt} disabled={aiPromptSaving} className="px-3 py-1.5 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors">
                {aiPromptSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">总提交数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{submissions.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">已提交</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {submissions.filter(s => s.status === 0).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">已撤回</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {submissions.filter(s => s.status === 1).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {collectionType === 'FILE' && gradedSubs.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <Brain className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">AI 批改统计</h3>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{gradedSubs.length} / {submissions.length} 已评</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">平均分</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgScore ?? '-'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">最高分</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{maxScore ?? '-'}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">待评估</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {submissions.filter(s => !s.aiStatus || s.aiStatus === 0).length}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {bandCounts.map(band => (
                <div key={band.label} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">{band.label}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 w-14">{band.min}-{band.max}分</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${band.color}`}
                      style={{ width: scores.length ? `${(band.count / scores.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="w-6 text-xs text-gray-600 dark:text-gray-400 text-right">{band.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索提交人、IP地址、文件名..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {[
                { key: 'all' as const, label: '全部' },
                { key: 'submitted' as const, label: '已提交' },
                { key: 'withdrawn' as const, label: '已撤回' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setStatusFilter(opt.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    statusFilter === opt.key
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {collectionType === 'FILE' && gradedSubs.length > 0 && (
              <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                {[
                  { key: 'time' as const, label: '按时间' },
                  { key: 'score' as const, label: '按评分' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setSortMode(opt.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      sortMode === opt.key
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {(searchTerm || statusFilter !== 'all') && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              找到 {filteredSubmissions.length} 条记录
              {(searchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="ml-2 text-gray-600 dark:text-gray-300 hover:underline"
                >
                  清除筛选
                </button>
              )}
            </div>
          )}
        </div>

        {/* Submissions List */}
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">暂无提交记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => {
              const infoData = parseInfoData(submission.infoData);
              const isWithdrawn = submission.status === 1;

              return (
                <div
                  key={submission.id}
                  className={`bg-white dark:bg-gray-900 rounded-xl border ${
                    isWithdrawn
                      ? 'border-red-200 dark:border-red-900/30 opacity-60'
                      : 'border-gray-200 dark:border-gray-800'
                  } overflow-hidden`}
                >
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {collectionType === 'FILE' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(submission.id)}
                            onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, submission.id] : prev.filter(id => id !== submission.id))}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 mt-1"
                          />
                        )}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                          collectionType === 'INFO'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                              {submission.submitterName?.[0]?.toUpperCase() || '匿'}
                            </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {submission.submitterName || '匿名用户'}
                            </span>
                            {isWithdrawn && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                                已撤回
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(submission.submittedAt)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <User className="w-3 h-3" />
                              {submission.submitterName || '匿名用户'}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
                              <MapPin className="w-3 h-3" />
                              {submission.submitterIp || '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400">
                          #{submission.id.slice(0, 8).toUpperCase()}
                        </span>
                        {collectionType === 'FILE' && (
                          <>
                            {submission.isPlagiarized && (
                              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                                涉嫌抄袭
                              </span>
                            )}
                            {(!submission.aiStatus || submission.aiStatus === 0) && (
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-xs">待评估</span>
                            )}
                            {submission.aiStatus === 1 && (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs animate-pulse">评估中</span>
                            )}
                            {submission.aiStatus === 2 && (
                              <button
                                onClick={() => setAiDrawerSubmission(submission)}
                                className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                              >
                                {submission.aiEvaluation?.score ?? '-'}分
                              </button>
                            )}
                            {submission.aiStatus === -1 && (
                              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs">评估失败</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {submission.fileName && (
                      <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">文件</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {submission.fileName} ({formatFileSize(submission.fileSize)})
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDownloadFile(submission)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="下载文件"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <Link
                              href="/dashboard/files"
                              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              title="文件管理"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                    {Object.keys(infoData).length > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">提交的信息</p>
                          {collectionType === 'INFO' && !isWithdrawn && (
                            <div className="flex items-center gap-1">
                              {editingId === submission.id ? (
                                <>
                                  <button
                                    onClick={() => handleEditSubmission(submission.id)}
                                    disabled={editSaving}
                                    className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                    title="保存"
                                  >
                                    {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                    title="取消"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => { setEditingId(submission.id); setEditData(infoData); }}
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                    title="编辑"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => { if (confirm('确认删除此提交记录？删除后不可恢复。')) handleDeleteSubmission(submission.id); }}
                                    disabled={deletingId === submission.id}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="删除"
                                  >
                                    {deletingId === submission.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {editingId === submission.id ? (
                            Object.entries(editData).map(([key, value]) => (
                              <div key={key} className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{key}</span>
                                <input
                                  type="text"
                                  value={value}
                                  onChange={e => setEditData(prev => ({ ...prev, [key]: e.target.value }))}
                                  className="text-sm px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
                                />
                              </div>
                            ))
                          ) : (
                            Object.entries(infoData).map(([key, value]) => (
                              <div key={key} className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{key}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white break-all">
                                  {value}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {aiDrawerSubmission && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setAiDrawerSubmission(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg z-50 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI 评估详情</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{aiDrawerSubmission.submitterName || '匿名用户'}</p>
                </div>
              </div>
              <button
                onClick={() => setAiDrawerSubmission(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {aiDrawerSubmission.aiEvaluation ? (
              <div className="p-6 space-y-6">
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-gray-900 dark:text-white">
                    {aiDrawerSubmission.aiEvaluation.score}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">综合评分</p>
                  {aiDrawerSubmission.isPlagiarized && (
                    <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                      <AlertCircle className="w-3 h-3" />
                      涉嫌与其他提交高度相似
                    </span>
                  )}
                </div>

                {Object.keys(aiDrawerSubmission.aiEvaluation.dimensions).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">维度分析</h4>
                    <AiRadarChart dimensions={aiDrawerSubmission.aiEvaluation.dimensions} />
                  </div>
                )}

                {aiDrawerSubmission.aiEvaluation.summary && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">评价摘要</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {aiDrawerSubmission.aiEvaluation.summary}
                    </p>
                  </div>
                )}

                {aiDrawerSubmission.aiEvaluation.feedback && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">详细反馈</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      {aiDrawerSubmission.aiEvaluation.feedback}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                  评估时间：{new Date(aiDrawerSubmission.aiEvaluation.evaluatedAt).toLocaleString('zh-CN')}
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">人工微调得分</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={overrideScore}
                      onChange={e => setOverrideScore(e.target.value)}
                      placeholder={String(aiDrawerSubmission.aiEvaluation.score)}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleOverrideScore}
                      disabled={overrideSaving || !overrideScore}
                      className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {overrideSaving ? '保存中...' : '采纳'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">输入 0-100 分覆盖 AI 评分</p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">重新评分</h4>
                  <button
                    onClick={async () => {
                      try {
                        await regradeSubmission(taskId, aiDrawerSubmission.id, aiPrompt || undefined);
                        alert('已触发重新评分，请稍后刷新查看结果');
                      } catch {
                        alert('触发失败');
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    重新评分
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <AlertCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">暂无评估数据</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
