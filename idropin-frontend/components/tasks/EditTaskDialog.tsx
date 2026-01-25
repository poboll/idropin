import React, { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { Task, useTaskStore } from '@/lib/stores/task';
import { useCategoryStore } from '@/lib/stores/category';

interface EditTaskDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export const EditTaskDialog: React.FC<EditTaskDialogProps> = ({ task, open, onClose }) => {
  const { updateTask } = useTaskStore();
  const { categoryList } = useCategoryStore();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task && open) {
      setName(task.name);
      setCategory(task.category);
    }
  }, [task, open]);

  const handleSubmit = async () => {
    if (!task || !name.trim()) return;

    setLoading(true);
    try {
      await updateTask(task.key, name, category);
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
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            任务名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            任务分类
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
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

        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
