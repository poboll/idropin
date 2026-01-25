'use client';

import { useState, useEffect } from 'react';
import { getUserShares, cancelShare, getShareUrl, type FileShare } from '@/lib/api/shares';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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
      const data = await getUserShares();
      setShares(data);
    } catch (err: any) {
      setError(err.message || '加载分享列表失败');
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
    } catch (err: any) {
      alert(err.message || '取消分享失败');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无分享</h3>
        <p className="mt-1 text-sm text-gray-500">分享文件给其他人吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shares.map((share) => {
        const expired = isExpired(share.expireAt);
        const limitReached = isLimitReached(share);
        const inactive = expired || limitReached;

        return (
          <div
            key={share.id}
            className={`bg-white border rounded-lg p-6 ${
              inactive ? 'border-gray-200 opacity-60' : 'border-gray-200 hover:shadow-md'
            } transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <code className="px-3 py-1 bg-gray-100 text-gray-800 rounded font-mono text-sm">
                    {share.shareCode}
                  </code>
                  {inactive && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      {expired ? '已过期' : '已达上限'}
                    </span>
                  )}
                  {share.password && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      需要密码
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {share.expireAt && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>过期时间: {new Date(share.expireAt).toLocaleString('zh-CN')}</span>
                    </div>
                  )}
                  {share.downloadLimit && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      <span>
                        下载次数: {share.downloadCount} / {share.downloadLimit}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      创建于{' '}
                      {formatDistanceToNow(new Date(share.createdAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleCopyLink(share.shareCode)}
                  disabled={inactive}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copiedCode === share.shareCode ? '已复制' : '复制链接'}
                </button>
                <button
                  onClick={() => handleCancel(share.id)}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
