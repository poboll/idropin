'use client';

import { useState, useEffect } from 'react';
import { createTask, type CreateTaskRequest } from '@/lib/api/tasks';
import { CheckCircle, XCircle } from 'lucide-react';

interface CreateTaskFormProps {
  activeCategory?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateTaskForm({ activeCategory, onSuccess, onCancel }: CreateTaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    category: activeCategory || 'default',
    allowAnonymous: false,
    requireLogin: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (activeCategory) {
      setFormData(prev => ({ ...prev, category: activeCategory }));
    }
  }, [activeCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.title.trim()) {
      setError('请输入任务标题');
      return;
    }

    try {
      setLoading(true);
      await createTask(formData);
      
      // 显示成功提示
      setSuccess(true);
      
      // 清空表单
      setFormData({
        title: '',
        description: '',
        category: activeCategory || 'default',
        allowAnonymous: false,
        requireLogin: true,
      });
      
      // 2秒后隐藏成功提示并调用回调
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err: any) {
      console.error('创建任务失败:', err);
      setError(err.message || '创建任务失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 成功提示 */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-200 font-medium">任务创建成功！</p>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          任务标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="例如：作业提交"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          任务描述
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="请详细描述任务要求..."
        />
      </div>

      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          截止时间 <span className="text-gray-400 text-xs">(不填写表示永久有效)</span>
        </label>
        <input
          type="datetime-local"
          id="deadline"
          value={formData.deadline || ''}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value || null })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="不填写表示永久有效"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          留空表示任务永久有效，无截止时间限制
        </p>
      </div>

      <div>
        <label htmlFor="maxFileSize" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          最大文件大小 (MB)
        </label>
        <input
          type="number"
          id="maxFileSize"
          value={formData.maxFileSize ? formData.maxFileSize / (1024 * 1024) : ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              maxFileSize: e.target.value ? parseInt(e.target.value) * 1024 * 1024 : undefined,
            })
          }
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="例如：10"
          min="1"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="allowAnonymous"
            checked={formData.allowAnonymous}
            onChange={(e) => setFormData({ ...formData, allowAnonymous: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
          />
          <label htmlFor="allowAnonymous" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            允许匿名提交
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="requireLogin"
            checked={formData.requireLogin}
            onChange={(e) => setFormData({ ...formData, requireLogin: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
          />
          <label htmlFor="requireLogin" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            需要登录才能提交
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '创建中...' : '创建任务'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition-colors"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
}
