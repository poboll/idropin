'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Download, Lock, AlertCircle, CheckCircle, FileText, Calendar, Hash, Upload } from 'lucide-react';

interface ShareInfo {
  shareCode: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  hasPassword: boolean;
  expireAt?: string;
  downloadLimit?: number;
  downloadCount: number;
  createdBy?: string;
  creatorUsername?: string;
}

export default function SharePage() {
  const params = useParams();
  const shareCode = params.code as string;
  
  const [loading, setLoading] = useState(true);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 强制使用白底黑按钮风格，不受系统主题影响
  useEffect(() => {
    // 移除 dark 类，强制使用浅色主题
    document.documentElement.classList.remove('dark');
    
    return () => {
      // 组件卸载时恢复主题
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);

  useEffect(() => {
    loadShareInfo();
  }, [shareCode]);

  const loadShareInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shares/${shareCode}/info`);
      
      if (!response.ok) {
        throw new Error('分享不存在或已过期');
      }

      const data = await response.json();
      if (data.code !== 200) {
        throw new Error(data.message || '获取分享信息失败');
      }

      setShareInfo(data.data);
      console.log('分享信息加载成功:', data.data);
      console.log('创建者用户名:', data.data.creatorUsername);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (shareInfo?.hasPassword && !password) {
      setError('请输入提取码');
      return;
    }

    try {
      setDownloading(true);
      setError('');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shares/${shareCode}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '下载失败');
      }

      const data = await response.json();
      if (data.code !== 200) {
        throw new Error(data.message || '下载失败');
      }

      // 下载文件
      const downloadUrl = data.data.downloadUrl;
      window.location.href = downloadUrl;
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || '下载失败');
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (error && !shareInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-black mb-2">
              分享不存在
            </h2>
            <p className="text-gray-600 text-sm mb-8">
              {error}
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              返回首页
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-50 border border-gray-200 rounded-xl mb-4">
            <Upload className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-semibold text-black mb-2">
            文件分享
          </h1>
          <p className="text-gray-600 text-sm">
            来自 {shareInfo?.creatorUsername ? `@${shareInfo.creatorUsername}` : ''} 的文件分享
          </p>
        </div>

        {/* Share Card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* File Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium text-black mb-1 truncate">
                  {shareInfo?.fileName}
                </h3>
                <p className="text-sm text-gray-600">
                  {shareInfo && formatFileSize(shareInfo.fileSize)}
                </p>
              </div>
            </div>

            {/* Meta Info */}
            {(shareInfo?.expireAt || shareInfo?.downloadLimit) && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                {shareInfo?.expireAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>过期时间：{formatDate(shareInfo.expireAt)}</span>
                  </div>
                )}
                {shareInfo?.downloadLimit && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Hash className="w-4 h-4" />
                    <span>
                      下载次数：{shareInfo.downloadCount} / {shareInfo.downloadLimit}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Password Input */}
          {shareInfo?.hasPassword && (
            <div className="p-6 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1.5" />
                提取码
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入提取码"
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-600">下载开始...</p>
              </div>
            </div>
          )}

          {/* Download Button */}
          <div className="p-6">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  下载中...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  下载文件
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 mb-2">
            © 2024 在虎 安全分享文件
          </p>
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-black transition-colors"
          >
            了解更多
          </a>
        </div>
      </div>
    </div>
  );
}
