'use client';

import { useState, useEffect } from 'react';
import { createTask, type CreateTaskRequest } from '@/lib/api/tasks';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

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
      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        category: activeCategory || 'default',
        allowAnonymous: false,
        requireLogin: true,
      });
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    } catch (err: any) {
      console.error('创建任务失败:', err);
      setError(err.message || '创建任务失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 成功提示 */}
      {success && (
        <div className="alert alert-success">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">任务创建成功！</span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="alert alert-error">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* 任务标题 */}
      <div className="form-group">
        <label htmlFor="title" className="form-label">
          任务标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="input"
          placeholder="例如：作业提交"
          required
        />
      </div>

      {/* 任务描述 */}
      <div className="form-group">
        <label htmlFor="description" className="form-label">
          任务描述
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="input resize-none"
          placeholder="请详细描述任务要求..."
        />
      </div>

      {/* 截止时间 */}
      <div className="form-group">
        <label htmlFor="deadline" className="form-label">
          截止时间
        </label>
        <input
          type="datetime-local"
          id="deadline"
          value={formData.deadline || ''}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value || null })}
          className="input"
        />
        <p className="form-hint">留空表示任务永久有效</p>
      </div>

      {/* 最大文件大小 */}
      <div className="form-group">
        <label htmlFor="maxFileSize" className="form-label">
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
          className="input"
          placeholder="例如：10"
          min="1"
        />
      </div>

      {/* 选项 */}
      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.allowAnonymous}
              onChange={(e) => setFormData({ ...formData, allowAnonymous: e.target.checked })}
              className="peer sr-only"
            />
            <div className="w-5 h-5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 peer-checked:bg-gray-900 dark:peer-checked:bg-white peer-checked:border-gray-900 dark:peer-checked:border-white transition-colors">
              <svg className="w-5 h-5 text-white dark:text-gray-900 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            允许匿名提交
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.requireLogin}
              onChange={(e) => setFormData({ ...formData, requireLogin: e.target.checked })}
              className="peer sr-only"
            />
            <div className="w-5 h-5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 peer-checked:bg-gray-900 dark:peer-checked:bg-white peer-checked:border-gray-900 dark:peer-checked:border-white transition-colors">
              <svg className="w-5 h-5 text-white dark:text-gray-900 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            需要登录才能提交
          </span>
        </label>
      </div>

      {/* 按钮 */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              创建中...
            </>
          ) : (
            '创建任务'
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
}
