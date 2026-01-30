'use client';

import React, { useState } from 'react';
import { createTask, CreateTaskRequest } from '@/lib/api/tasks';
import { extractApiError } from '@/lib/api/client';
import { Loader2, FileText, MessageSquare } from 'lucide-react';

interface CreateTaskFormProps {
  activeCategory?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function CreateTaskForm({ activeCategory, onSuccess, onCancel }: CreateTaskFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    category: activeCategory || 'default',
    taskType: 'FILE_COLLECTION',
    deadline: null,
    allowAnonymous: false,
    requireLogin: false,
    maxFileSize: 104857600,
    allowedTypes: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('请输入任务标题');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createTask(formData);
      onSuccess?.();
    } catch (err) {
      const apiError = extractApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateTaskRequest, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            任务类型 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleChange('taskType', 'FILE_COLLECTION')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                formData.taskType === 'FILE_COLLECTION'
                  ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <FileText className={`w-5 h-5 ${
                formData.taskType === 'FILE_COLLECTION' 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-400'
              }`} />
              <div className="text-left">
                <div className={`font-medium ${
                  formData.taskType === 'FILE_COLLECTION'
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>文件收集</div>
                <div className="text-xs text-gray-500">收集文件附件</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleChange('taskType', 'INFO_COLLECTION')}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                formData.taskType === 'INFO_COLLECTION'
                  ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <MessageSquare className={`w-5 h-5 ${
                formData.taskType === 'INFO_COLLECTION' 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-400'
              }`} />
              <div className="text-left">
                <div className={`font-medium ${
                  formData.taskType === 'INFO_COLLECTION'
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>信息收集</div>
                <div className="text-xs text-gray-500">仅收集文本信息</div>
              </div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            任务标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="例如：第一周作业提交"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            任务描述
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="详细描述任务要求..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            截止时间
          </label>
          <input
            type="datetime-local"
            value={formData.deadline || ''}
            onChange={(e) => handleChange('deadline', e.target.value || null)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.allowAnonymous}
              onChange={(e) => handleChange('allowAnonymous', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">允许匿名提交</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.requireLogin}
              onChange={(e) => handleChange('requireLogin', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">需要登录</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
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
      </div>
    </form>
  );
}

export default CreateTaskForm;
