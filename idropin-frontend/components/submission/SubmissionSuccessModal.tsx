'use client';

import { X, CheckCircle2, Download, Copy, Check, Image, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';

interface SubmissionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionData: {
    id: string;
    submitterName: string;
    infoData: Record<string, string>;
    submittedAt: string;
    taskTitle: string;
    collectionType: 'INFO' | 'FILE';
    fileName?: string;
  };
}

export function SubmissionSuccessModal({ isOpen, onClose, submissionData }: SubmissionSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

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

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;

    try {
      setGenerating(true);

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 3, // 提高分辨率
        useCORS: true,
        logging: false,
        width: 600, // 固定宽度
        windowWidth: 600,
      });

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `提交凭证-${submissionData.submitterName || '匿名'}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to generate PNG:', err);
      alert('生成图片失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadJSON = () => {
    const exportData = {
      taskTitle: submissionData.taskTitle,
      submissionId: submissionData.id,
      submitterName: submissionData.submitterName,
      submittedAt: submissionData.submittedAt,
      formData: submissionData.infoData,
      fileName: submissionData.fileName,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `submission-${submissionData.id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyInfo = async () => {
    const textContent = Object.entries(submissionData.infoData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const fullText = `任务: ${submissionData.taskTitle}\n提交时间: ${formatDateTime(submissionData.submittedAt)}\n\n${textContent}`;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-[640px] w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Capture Area for PNG - 固定宽度布局 */}
        <div ref={cardRef} className="bg-white" style={{ width: '600px', padding: 0 }}>
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(to right, #10b981, #059669)',
            padding: '24px 32px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle2 style={{ width: '32px', height: '32px' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>提交成功</h2>
                <p style={{ fontSize: '14px', color: '#d1fae5' }}>您的信息已成功提交</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '32px' }}>
            {/* Task Info */}
            <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>任务名称</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{submissionData.taskTitle}</p>
            </div>

            {/* Submission Summary */}
            <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>提交者</p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    {submissionData.submitterName || '匿名'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>凭证编号</p>
                  <p style={{ fontSize: '16px', fontFamily: 'monospace', fontWeight: 'bold', color: '#10b981' }}>
                    #{submissionData.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>提交时间</p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  {formatDateTime(submissionData.submittedAt)}
                </p>
              </div>
              {submissionData.fileName && (
                <div style={{ marginTop: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>文件名</p>
                   <p style={{ fontSize: '16px', fontWeight: '600', color: '#111827', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                     {submissionData.fileName}
                   </p>
                 </div>
               )}
            </div>

            {/* Form Data Preview */}
            {Object.keys(submissionData.infoData).length > 0 && (
              <div style={{ 
                background: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px'
              }}>
                <p style={{ 
                  fontSize: '12px',
                  color: '#4b5563',
                  marginBottom: '16px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>提交的信息</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(submissionData.infoData).map(([key, value]) => (
                    <div key={key} style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '16px',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>{key}</p>
                       <p style={{ 
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#111827',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.5'
                      }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ 
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>© 2024 在虎 · 请妥善保存此凭证</p>
            </div>
          </div>
        </div>

        {/* Action Buttons - 更紧凑的按钮组 */}
        <div className="px-6 pb-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex gap-2">
            <button
              onClick={handleCopyInfo}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600
                text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg 
                border border-gray-200 dark:border-gray-600 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '已复制' : '复制'}
            </button>
            <button
              onClick={handleDownloadPNG}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                bg-green-500 hover:bg-green-600 disabled:bg-green-300
                text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
              {generating ? '生成中' : '图片'}
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100
                text-white dark:text-gray-900 text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>
          </div>
        </div>

        {/* Close Button - 更紧凑 */}
        <div className="px-6 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubmissionSuccessModal;
