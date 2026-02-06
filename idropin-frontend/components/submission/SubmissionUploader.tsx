'use client';

import { useCallback, useState } from 'react';
import { Upload, X, FileIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getFileMd5Hash, getFileSuffix, normalizeFileName, formatSize, FileFormatConfig } from '@/lib/utils/string';

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'ready' | 'calculating' | 'uploading' | 'success' | 'fail' | 'withdrawn';
  progress: number;
  md5?: string;
  error?: string;
  submissionId?: string;
  renamedName?: string;
}

interface SubmissionUploaderProps {
  files: UploadFile[];
  onFilesChange: (files: UploadFile[] | ((prev: UploadFile[]) => UploadFile[])) => void;
  formatConfig?: FileFormatConfig;
  disabled?: boolean;
  maxFiles?: number;
  isMobile?: boolean;
}

export default function SubmissionUploader({
  files,
  onFilesChange,
  formatConfig,
  disabled = false,
  maxFiles = 10,
  isMobile = false,
}: SubmissionUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [calculatingCount, setCalculatingCount] = useState(0);

  const validateFile = useCallback((file: File): string | null => {
    if (!formatConfig) return null;

    if (formatConfig.format.length > 0 && formatConfig.status) {
      const suffix = getFileSuffix(file.name).toLowerCase();
      const isValidFormat = formatConfig.format.some(fmt => 
        suffix.endsWith(fmt.toLowerCase())
      );
      if (!isValidFormat) {
        return `文件格式不符合要求，仅支持: ${formatConfig.format.join(', ')}`;
      }
    }

    if (formatConfig.size > 0) {
      const maxSize = formatConfig.size * (formatConfig.sizeUnit === 'MB' ? 1024 * 1024 : 1024);
      if (file.size > maxSize) {
        return `文件大小超出限制，最大 ${formatConfig.size}${formatConfig.sizeUnit}`;
      }
    }

    return null;
  }, [formatConfig]);

  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const currentCount = files.length;
    const limit = formatConfig?.limit || maxFiles;

    if (currentCount + fileArray.length > limit) {
      alert(`一次最多只能选择 ${limit} 个文件`);
      return;
    }

    const uploadFiles: UploadFile[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        alert(`${file.name}: ${error}`);
        continue;
      }

      const uploadFile: UploadFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: normalizeFileName(file.name),
        size: file.size,
        status: 'calculating',
        progress: 0,
      };

      uploadFiles.push(uploadFile);
    }

    if (uploadFiles.length === 0) return;

    onFilesChange([...files, ...uploadFiles]);

    for (const uploadFile of uploadFiles) {
      setCalculatingCount(prev => prev + 1);
      try {
        const md5 = await getFileMd5Hash(uploadFile.file);
        onFilesChange(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, md5, status: 'ready' as const }
              : f
          )
        );
      } catch {
        onFilesChange(prev => 
          prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'fail' as const, error: '计算文件指纹失败' }
              : f
          )
        );
      } finally {
        setCalculatingCount(prev => prev - 1);
      }
    }
  }, [files, onFilesChange, validateFile, formatConfig, maxFiles]);

  const removeFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    if (file.status === 'uploading' || file.status === 'success') {
      if (!confirm('确定要移除此文件吗？正在上传的将取消上传')) {
        return;
      }
    }

    onFilesChange(files.filter(f => f.id !== fileId));
  }, [files, onFilesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [disabled, addFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  }, [addFiles]);

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'calculating':
        return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'withdrawn':
        return <CheckCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <FileIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (file: UploadFile) => {
    switch (file.status) {
      case 'calculating':
        return '计算指纹中...';
      case 'uploading':
        return `上传中 ${file.progress}%`;
      case 'success':
        return '上传成功';
      case 'fail':
        return file.error || '上传失败';
      case 'withdrawn':
        return '已撤回';
      default:
        return '待上传';
    }
  };

  return (
    <div className="space-y-5">
      {isMobile ? (
        <label className="block">
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
          <span className="inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-b from-gray-800 to-gray-900 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 text-sm font-semibold rounded-xl cursor-pointer hover:from-gray-900 hover:to-black dark:hover:from-gray-100 dark:hover:to-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-gray-900/20 dark:shadow-gray-200/20 hover:scale-[1.02] active:scale-[0.98]">
            选择文件
          </span>
        </label>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300
            ${isDragging 
              ? 'border-gray-400 bg-gray-50/80 dark:bg-gray-800/30 scale-[1.01]' 
              : 'border-gray-200/80 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/20'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <label className="flex flex-col items-center cursor-pointer">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={disabled}
              className="hidden"
            />
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mb-4 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
              <Upload className={`w-7 h-7 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${isDragging ? '-translate-y-1' : ''}`} />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              将文件拖于此处 或 <span className="text-gray-900 dark:text-white font-semibold">直接选择文件</span>
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-2">支持多文件同时上传</span>
          </label>
        </div>
      )}

      {calculatingCount > 0 && (
        <div className="flex items-center gap-3 text-sm text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/20 backdrop-blur-sm border border-amber-200/40 dark:border-amber-900/20 px-4 py-3.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
          <span>还有 <strong>{calculatingCount}</strong> 个文件正在生成校验信息，请稍等</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="border border-gray-100 dark:border-gray-800/50 rounded-2xl overflow-hidden bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm">
          <div className="px-5 py-3 bg-gray-50/80 dark:bg-gray-900/50 text-xs font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800/50 uppercase tracking-wider">
            已选择 {files.length} 个文件
          </div>
          <div className="divide-y divide-gray-100/80 dark:divide-gray-800/50">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all duration-200"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    {getStatusIcon(file.status)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.renamedName || file.name}>
                      {file.renamedName || file.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                      <span>{formatSize(file.size)}</span>
                      <span>·</span>
                      <span>{getStatusText(file)}</span>
                      {file.renamedName && file.renamedName !== file.name && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-600 dark:text-emerald-400">已重命名</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {file.status !== 'uploading' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 hover:scale-110"
                    title="移除文件"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  </button>
                )}
                {file.status === 'uploading' && (
                  <div className="w-20">
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-white transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {formatConfig && (formatConfig.status || formatConfig.size > 0) && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
          {formatConfig.status && formatConfig.format.length > 0 && (
            <span className="px-3 py-1.5 bg-gray-100/80 dark:bg-gray-800/50 rounded-full">
              格式: {formatConfig.format.join(', ')}
            </span>
          )}
          {formatConfig.size > 0 && (
            <span className="px-3 py-1.5 bg-gray-100/80 dark:bg-gray-800/50 rounded-full">
              大小: ≤{formatConfig.size}{formatConfig.sizeUnit}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
