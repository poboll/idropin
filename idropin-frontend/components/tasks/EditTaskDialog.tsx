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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task && open) {
      setName(task.name);
      setDescription(task.description || '');
      setCategory(task.category);
    }
  }, [task, open]);

  const handleSubmit = async () => {
    if (!task || !name.trim()) return;

    setLoading(true);
    try {
      await updateTask(task.key, name, category, description);
      onClose();
    } catch (e) {
      console.error(e);
      alert('更新失败');
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
