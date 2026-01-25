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
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'withdrawn':
        return <CheckCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <FileIcon className="w-4 h-4 text-gray-500" />;
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
        return '已撤回 ✅';
      default:
        return '待上传';
    }
  };

  return (
    <div className="space-y-4">
      {isMobile ? (
        <label className="block">
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
          <span className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            选择文件
          </span>
        </label>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
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
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <span className="text-gray-600 dark:text-gray-400">
              将文件拖于此处 或 <span className="text-blue-600">直接选择文件</span>
            </span>
          </label>
        </div>
      )}

      {calculatingCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded">
          <Loader2 className="w-4 h-4 animate-spin" />
          还有 {calculatingCount} 个文件正在生成校验信息，请稍等 (1G通常需要20s)
        </div>
      )}

      {files.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500">
            此处展示选择文件列表
          </div>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getStatusIcon(file.status)}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                    {file.status === 'withdrawn' && ' - (已撤回 ✅)'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatSize(file.size)} · {getStatusText(file)}
                  </div>
                </div>
              </div>
              {file.status !== 'uploading' && (
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  title="移除文件"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
              {file.status === 'uploading' && (
                <div className="w-16">
                  <div className="h-1 bg-gray-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formatConfig && (
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {formatConfig.status && formatConfig.format.length > 0 && (
            <p>
              限制格式为: <span className="text-red-500">{formatConfig.format.join(', ')}</span>
            </p>
          )}
          {formatConfig.size > 0 && (
            <p>
              限制文件大小不超过: <span className="text-red-500">{formatConfig.size}{formatConfig.sizeUnit}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
