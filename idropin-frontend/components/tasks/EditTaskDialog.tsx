import React, { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { Task, useTaskStore } from '@/lib/stores/task';
import { useCategoryStore } from '@/lib/stores/category';
import { Loader2 } from 'lucide-react';

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export const EditTaskDialog: React.FC<EditTaskDialogProps> = ({ task, open, onClose }) => {
  const { updateTask } = useTaskStore();
  const { categoryList } = useCategoryStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [collectionType, setCollectionType] = useState<'FILE' | 'INFO'>('FILE');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task && open) {
      setName(task.name);
      setDescription(task.description || '');
      setCategory(task.category);
      setCollectionType(task.collectionType || 'FILE');
    }
  }, [task, open]);

  const handleSubmit = async () => {
    if (!task || !name.trim()) return;

    setLoading(true);
    try {
      await updateTask(task.key, name, category, description, collectionType);
      onClose();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || error.response?.data?.message || '更新失败';
      alert(`更新失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="编辑任务信息"
      size="md"
    >
      <div className="space-y-5">
        <div className="form-group">
          <label className="form-label">任务名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="输入任务名称"
          />
        </div>

        <div className="form-group">
          <label className="form-label">任务描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="input resize-none"
            placeholder="请详细描述任务要求..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">任务分类</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            <option value="default">默认</option>
            {categoryList.map((cat) => (
              <option key={cat.k} value={cat.k}>
                {cat.name}
              </option>
            ))}
            <option value="trash">回收站</option>
          </select>
        </div>

        {/* 收集类型 */}
        <div className="form-group">
          <label className="form-label">
            收集类型 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <label 
              className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                collectionType === 'FILE'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="collectionType"
                value="FILE"
                checked={collectionType === 'FILE'}
                onChange={() => setCollectionType('FILE')}
                className="sr-only"
              />
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  collectionType === 'FILE'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {collectionType === 'FILE' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                  )}
                </div>
                <span className={`font-medium ${
                  collectionType === 'FILE'
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  收集文件
                </span>
              </div>
              <p className={`text-xs ${
                collectionType === 'FILE'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                需要提交者上传文件（如作业、文档等）
              </p>
            </label>

            <label 
              className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                collectionType === 'INFO'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="collectionType"
                value="INFO"
                checked={collectionType === 'INFO'}
                onChange={() => setCollectionType('INFO')}
                className="sr-only"
              />
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  collectionType === 'INFO'
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {collectionType === 'INFO' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                  )}
                </div>
                <span className={`font-medium ${
                  collectionType === 'INFO'
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  仅收集信息
                </span>
              </div>
              <p className={`text-xs ${
                collectionType === 'INFO'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                仅收集表单信息，不需要上传文件
              </p>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="btn-primary"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存修改'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
