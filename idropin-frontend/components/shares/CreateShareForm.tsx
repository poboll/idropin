'use client';

import { useState } from 'react';
import { createShare, getShareUrl, type CreateShareRequest } from '@/lib/api/shares';

interface CreateShareFormProps {
  fileId: string;
  fileName: string;
  onSuccess?: (shareCode: string) => void;
  onCancel?: () => void;
}

export default function CreateShareForm({
  fileId,
  fileName,
  onSuccess,
  onCancel,
}: CreateShareFormProps) {
  const [formData, setFormData] = useState<CreateShareRequest>({
    fileId,
    password: '',
    expireAt: '',
    downloadLimit: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const share = await createShare({
        ...formData,
        password: formData.password || undefined,
        expireAt: formData.expireAt || undefined,
      });
      setShareCode(share.shareCode);
      onSuccess?.(share.shareCode);
    } catch (err: any) {
      setError(err.message || '创建分享失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareCode) return;
    const url = getShareUrl(shareCode);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('复制失败，请手动复制');
    }
  };

  if (shareCode) {
    const shareUrl = getShareUrl(shareCode);
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-sm font-medium text-green-800">分享创建成功！</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">分享链接</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">分享码</label>
          <code className="block px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-mono text-lg">
            {shareCode}
          </code>
        </div>

        {formData.password && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">访问密码</label>
            <code className="block px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-mono">
              {formData.password}
            </code>
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          关闭
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-medium">文件:</span> {fileName}
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          访问密码（可选）
        </label>
        <input
          type="text"
          id="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="留空表示无需密码"
        />
        <p className="mt-1 text-xs text-gray-500">设置密码后，访问者需要输入密码才能下载</p>
      </div>

      <div>
        <label htmlFor="expireAt" className="block text-sm font-medium text-gray-700 mb-2">
          过期时间（可选）
        </label>
        <input
          type="datetime-local"
          id="expireAt"
          value={formData.expireAt}
          onChange={(e) => setFormData({ ...formData, expireAt: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">留空表示永久有效</p>
      </div>

      <div>
        <label htmlFor="downloadLimit" className="block text-sm font-medium text-gray-700 mb-2">
          下载次数限制（可选）
        </label>
        <input
          type="number"
          id="downloadLimit"
          value={formData.downloadLimit || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              downloadLimit: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="例如：10"
          min="1"
        />
        <p className="mt-1 text-xs text-gray-500">留空表示不限制下载次数</p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '创建中...' : '创建分享'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
}
