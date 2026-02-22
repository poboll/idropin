'use client';

import { useState, useEffect } from 'react';
import { getUserShares, cancelShare, getShareUrl, type FileShare } from '@/lib/api/shares';
import { extractApiError } from '@/lib/api/client';

import { Share2, Calendar, Download, Clock, Copy, Check, X, Lock, RefreshCw } from 'lucide-react';

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}个月前` : `${Math.floor(months / 12)}年前`;
}

export default function ShareList() {
  const [shares, setShares] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadShares();
  }, []);

  const loadShares = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserShares();
      setShares(data);
    } catch (err: unknown) {
      const apiError = extractApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (shareCode: string) => {
    const url = getShareUrl(shareCode);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(shareCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      alert('复制失败，请手动复制');
    }
  };

  const handleCancel = async (shareId: string) => {
    if (!confirm('确定要取消这个分享吗？')) {
      return;
    }

    try {
      await cancelShare(shareId);
      setShares(shares.filter(s => s.id !== shareId));
    } catch (err: unknown) {
      const apiError = extractApiError(err);
      alert(apiError.message);
    }
  };

  const isExpired = (expireAt?: string) => {
    if (!expireAt) return false;
    return new Date(expireAt) < new Date();
  };

  const isLimitReached = (share: FileShare) => {
    if (!share.downloadLimit) return false;
    return share.downloadCount >= share.downloadLimit;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('权限') || error.includes('认证') || error.includes('登录') || error.includes('401');
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white">加载失败</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isAuthError ? '登录状态已过期，请重新登录后查看分享列表' : error}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={loadShares} className="btn-primary flex-1">
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
          {isAuthError && (
            <button onClick={() => window.location.href = '/login'} className="btn-secondary flex-1">
              重新登录
            </button>
          )}
        </div>
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="empty-state">
        <Share2 className="empty-state-icon" />
        <h3 className="empty-state-title">暂无分享</h3>
        <p className="empty-state-description">分享文件给其他人吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shares.map((share) => {
        const expired = isExpired(share.expireAt);
        const limitReached = isLimitReached(share);
        const inactive = expired || limitReached;

        return (
          <div
            key={share.id}
            className={`card p-5 ${inactive ? 'opacity-60' : 'card-hover'}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <code className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md font-mono text-sm">
                    {share.shareCode}
                  </code>
                  {inactive && (
                    <span className="badge-error">
                      {expired ? '已过期' : '已达上限'}
                    </span>
                  )}
                  {share.password && (
                    <span className="badge-warning flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      需要密码
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                  {share.expireAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>过期时间: {new Date(share.expireAt).toLocaleString('zh-CN')}</span>
                    </div>
                  )}
                  {share.downloadLimit && (
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      <span>
                        下载次数: {share.downloadCount} / {share.downloadLimit}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      创建于 {relativeTime(share.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 sm:flex-shrink-0">
                <button
                  onClick={() => handleCopyLink(share.shareCode)}
                  disabled={inactive}
                  className="btn-secondary btn-sm"
                >
                  {copiedCode === share.shareCode ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      复制链接
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCancel(share.id)}
                  className="btn-ghost btn-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
