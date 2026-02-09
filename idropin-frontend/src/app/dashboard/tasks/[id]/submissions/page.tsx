'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText, Clock, User, MapPin, Loader2, AlertCircle, ExternalLink, Trash2, Edit3, X, Check, Search, Filter, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { getTaskInfoSubmissions, exportInfoSubmissions } from '@/lib/api/tasks';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth';
import { getToken } from '@/lib/api/client';

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
  }, []); // 空依赖数组，只在挂载时执行一次


  const handleExport = async (format: 'csv' | 'json' | 'txt' | 'excel') => {
    try {
      setExporting(true);
      
      // 生成统一的日期格式：YYYY-MM-DD
      const dateStr = new Date().toISOString().split('T')[0];
      
      if (format === 'csv' || format === 'excel') {
        // CSV和Excel使用后端导出
        await exportInfoSubmissions(taskId);
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
          txtContent += `提交者: ${sub.submitterName || '匿名'}\n`;
          if (sub.submitterEmail) txtContent += `邮箱: ${sub.submitterEmail}\n`;
          if (sub.submitterIp) txtContent += `IP地址: ${sub.submitterIp}\n`;
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
  });

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
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                          collectionType === 'INFO'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {submission.submitterName?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {submission.submitterName || '匿名'}
                            </span>
                            {isWithdrawn && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">
                                已撤回
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(submission.submittedAt)}
                            </div>
                            {submission.submitterIp && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <MapPin className="w-3 h-3" />
                                {submission.submitterIp}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-gray-400">
                        #{submission.id.slice(0, 8).toUpperCase()}
                      </span>
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
    </div>
  );
}
