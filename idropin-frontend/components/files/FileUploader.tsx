'use client';

import { useState, useCallback, useRef } from 'react';
import { uploadFile, FileItem } from '@/lib/api/files';

interface FileUploaderProps {
  onUploadSuccess?: (file: FileItem) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // MB
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function FileUploader({
  onUploadSuccess,
  onUploadError,
  accept,
  maxSize = 100,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `文件大小不能超过 ${maxSize}MB`;
    }
    return null;
  };

  const handleUpload = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      onUploadError?.(error);
      return;
    }

    const uploadingFile: UploadingFile = { file, progress: 0, status: 'uploading' };
    setUploadingFiles((prev) => [...prev, uploadingFile]);

    try {
      const result = await uploadFile(file, (progress) => {
        setUploadingFiles((prev) =>
          prev.map((f) => (f.file === file ? { ...f, progress } : f))
        );
      });

      setUploadingFiles((prev) =>
        prev.map((f) => (f.file === file ? { ...f, status: 'success', progress: 100 } : f))
      );

      onUploadSuccess?.(result);

      // 3秒后移除成功的文件
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
      }, 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '上传失败';
      setUploadingFiles((prev) =>
        prev.map((f) => (f.file === file ? { ...f, status: 'error', error: errorMsg } : f))
      );
      onUploadError?.(errorMsg);
    }
  }, [maxSize, onUploadSuccess, onUploadError]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(handleUpload);
  }, [handleUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => fileInputRef.current?.click();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-4">
      {/* 拖拽上传区域 */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500'
        }`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          accept={accept}
          multiple
        />
        <div className="space-y-3">
          <div className="w-12 h-12 mx-auto bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            点击或拖拽文件到此处上传
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            支持图片、视频、文档等格式，最大 {maxSize}MB
          </p>
        </div>
      </div>

      {/* 上传进度列表 */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((item, index) => (
            <div key={index} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  item.status === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                  item.status === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                  'bg-blue-100 dark:bg-blue-900/30'
                }`}>
                  {item.status === 'success' ? (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : item.status === 'error' ? (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(item.file.size)}
                    {item.error && <span className="text-red-500 ml-2">{item.error}</span>}
                  </p>
                </div>
                {item.status === 'uploading' && (
                  <span className="text-xs font-medium text-blue-500">{item.progress}%</span>
                )}
              </div>
              {item.status === 'uploading' && (
                <div className="mt-2 w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
