'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useCategoryStore } from '@/lib/stores/category';
import { useTaskStore, Task } from '@/lib/stores/task';
import { CategoryPanel } from '@/components/tasks/CategoryPanel';
import { TaskInfoCard } from '@/components/tasks/TaskInfoCard';
import CreateTaskForm from '@/components/tasks/CreateTaskForm';
import { ShareDialog } from '@/components/tasks/ShareDialog';
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog';
import { MoreSettingsDialog } from '@/components/tasks/MoreSettingsDialog';
import { Inbox, Plus } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import LoadingScreen from '@/components/LoadingScreen';

export default function TasksPage() {
  const { categoryList, getCategory } = useCategoryStore();
  const { taskList, getTask, deleteTask } = useTaskStore();

  const [selectedCategory, setSelectedCategory] = useState('default');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [shareTask, setShareTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [moreSettingsTask, setMoreSettingsTask] = useState<Task | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([getCategory(), getTask()]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredTasks = useMemo(() => {
    return taskList.filter((t) => {
      const taskCat = t.category || 'default';
      return taskCat === selectedCategory;
    });
  }, [taskList, selectedCategory]);

  const handleDeleteTask = async (key: string, isTrash: boolean) => {
    if (confirm(isTrash ? '确认彻底删除此任务吗？无法恢复！' : '确认将此任务移入回收站吗？')) {
      await deleteTask(key);
    }
  };

  if (loading) {
    return <LoadingScreen message="加载任务列表" />;
  }

  return (
    <AuthGuard>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
        <div className="lg:col-span-1">
          <CategoryPanel
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        <div className="lg:col-span-3 flex flex-col glass-panel">
          {/* 桌面端创建表单 */}
          <div className="hidden md:block">
            <CreateTaskForm 
              activeCategory={selectedCategory}
              onSuccess={() => {
                getTask();
              }}
            />
          </div>

          <div className="mt-6">
            {filteredTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20 md:pb-4">
                {filteredTasks.map((task) => (
                  <TaskInfoCard
                    key={task.key}
                    task={task}
                    onEdit={setEditTask}
                    onDelete={handleDeleteTask}
                    onShare={() => setShareTask(task)}
                    onMore={setMoreSettingsTask}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground opacity-60 py-20">
                <Inbox className="w-16 h-16 mb-4 stroke-1" />
                <p className="text-lg font-medium">暂无任务</p>
                <p className="text-sm">在此分类下还没有创建任务</p>
              </div>
            )}
          </div>
        </div>

        {/* 移动端浮动创建按钮 */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all z-50 flex items-center justify-center"
          aria-label="创建任务"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* 移动端创建表单模态框 */}
        {showCreateForm && (
          <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    创建收集任务
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <CreateTaskForm
                  activeCategory={selectedCategory}
                  onSuccess={() => {
                    setShowCreateForm(false);
                    getTask();
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            </div>
          </div>
        )}

        <ShareDialog
          task={shareTask}
          open={!!shareTask}
          onClose={() => setShareTask(null)}
        />

        <EditTaskDialog
          task={editTask}
          open={!!editTask}
          onClose={() => setEditTask(null)}
        />

        <MoreSettingsDialog
          task={moreSettingsTask}
          open={!!moreSettingsTask}
          onClose={() => setMoreSettingsTask(null)}
        />
      </div>
    </AuthGuard>
  );
}
