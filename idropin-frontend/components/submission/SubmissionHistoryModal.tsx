'use client';

import { X, Download, FileText, Clock, User, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { withdrawSubmission } from '@/lib/api/tasks';

interface SubmissionRecord {
  id: string;
  submitterName: string;
  submittedAt: string;
  infoData: string;
  fileName?: string;
  fileSize?: number;
  status: number;
}

interface SubmissionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: SubmissionRecord[];
  taskTitle: string;
  taskId: string;
  collectionType: 'INFO' | 'FILE';
  onWithdrawSuccess?: () => void;
}

export function SubmissionHistoryModal({
  isOpen,
  onClose,
  submissions,
  taskTitle,
  taskId,
  collectionType,
  onWithdrawSuccess
}: SubmissionHistoryModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
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

  const handleDownloadAll = () => {
    const exportData = {
      taskTitle,
      collectionType,
      exportedAt: new Date().toISOString(),
      submissions: submissions.map(sub => ({
        id: sub.id,
        submitterName: sub.submitterName,
        submittedAt: sub.submittedAt,
        formData: parseInfoData(sub.infoData),
        fileName: sub.fileName,
        fileSize: sub.fileSize,
        status: sub.status === 0 ? '已提交' : '已撤回',
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submissions-history-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingle = (submission: SubmissionRecord) => {
    const exportData = {
      taskTitle,
      submissionId: submission.id,
      submitterName: submission.submitterName,
      submittedAt: submission.submittedAt,
      formData: parseInfoData(submission.infoData),
      fileName: submission.fileName,
      status: submission.status === 0 ? '已提交' : '已撤回',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submission-${submission.id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPNG = (submission: SubmissionRecord) => {
    // 创建canvas生成PNG凭证
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // 背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 标题
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('文件提交凭证', canvas.width / 2, 60);

    // 任务名称
    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(taskTitle, canvas.width / 2, 100);

    // 分隔线
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 130);
    ctx.lineTo(550, 130);
    ctx.stroke();

    // 信息区域
    let yPos = 170;
    const lineHeight = 40;
    ctx.textAlign = 'left';
    ctx.font = '16px Arial, sans-serif';

    const infoData = parseInfoData(submission.infoData);
    const infoItems = [
      { label: '提交者', value: submission.submitterName || '匿名' },
      { label: '提交时间', value: formatDateTime(submission.submittedAt) },
      { label: '凭证编号', value: submission.id.slice(0, 8).toUpperCase() },
      { label: '状态', value: submission.status === 0 ? '已提交' : '已撤回' },
    ];

    if (submission.fileName) {
      infoItems.push({ label: '文件名', value: submission.fileName });
      infoItems.push({ label: '文件大小', value: formatFileSize(submission.fileSize) });
    }

    // 添加表单数据
    Object.entries(infoData).forEach(([key, value]) => {
      infoItems.push({ label: key, value: value });
    });

    infoItems.forEach(item => {
      ctx.fillStyle = '#6b7280';
      ctx.fillText(item.label + ':', 80, yPos);
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px Arial, sans-serif';
      
      // 处理长文本换行
      const maxWidth = 450;
      const words = item.value.split('');
      let line = '';
      let lineCount = 0;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, 250, yPos + (lineCount * 25));
          line = words[i];
          lineCount++;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 250, yPos + (lineCount * 25));
      
      yPos += lineHeight + (lineCount * 25);
      ctx.font = '16px Arial, sans-serif';
    });

    // 底部说明
    yPos += 30;
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('此凭证可用于查询提交记录', canvas.width / 2, yPos);
    ctx.fillText('请妥善保管', canvas.width / 2, yPos + 20);

    // 生成时间
    ctx.fillText(`生成时间: ${new Date().toLocaleString('zh-CN')}`, canvas.width / 2, yPos + 50);

    // 转换为PNG并下载
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `文件提交凭证-${submission.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  const handleWithdraw = async (submission: SubmissionRecord) => {
    if (!confirm('确定要撤回这条提交记录吗？')) {
      return;
    }

    setWithdrawingId(submission.id);
    try {
      await withdrawSubmission(taskId, submission.id, submission.submitterName);
      alert('撤回成功！');
      if (onWithdrawSuccess) {
        onWithdrawSuccess();
      }
    } catch (error: any) {
      alert(error.message || '撤回失败，请稍后重试');
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">提交历史</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{taskTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-140px)] p-4">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">暂无提交记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => {
                const infoData = parseInfoData(submission.infoData);
                const isExpanded = expandedId === submission.id;
                const isWithdrawn = submission.status === 1;

                return (
                  <div
                    key={submission.id}
                    className={`border rounded-xl overflow-hidden transition-all ${
                      isWithdrawn
                        ? 'border-gray-200 dark:border-gray-700 opacity-60'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Summary Row */}
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : submission.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            collectionType === 'INFO'
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-blue-100 dark:bg-blue-900/30'
                          }`}>
                            <FileText className={`w-5 h-5 ${
                              collectionType === 'INFO'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`} />
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
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(submission.submittedAt)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isWithdrawn && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWithdraw(submission);
                              }}
                              disabled={withdrawingId === submission.id}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="撤回此记录"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPNG(submission);
                            }}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="下载PNG凭证"
                          >
                            <FileText className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadSingle(submission);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="下载JSON数据"
                          >
                            <Download className="w-4 h-4 text-gray-400" />
                          </button>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-800">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mt-3">
                          {submission.fileName && (
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                              <span className="text-sm text-gray-500 dark:text-gray-400">文件</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                                {submission.fileName} ({formatFileSize(submission.fileSize)})
                              </span>
                            </div>
                          )}
                          {Object.keys(infoData).length > 0 ? (
                            <div className="space-y-2">
                              {Object.entries(infoData).map(([key, value]) => (
                                <div key={key} className="flex justify-between items-start gap-4">
                                  <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{key}</span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-white text-right break-all">
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
                              无表单数据
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {submissions.length > 0 && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4">
            <button
              onClick={handleDownloadAll}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100
                text-white dark:text-gray-900 text-sm font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              下载全部记录 ({submissions.length}条)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SubmissionHistoryModal;
