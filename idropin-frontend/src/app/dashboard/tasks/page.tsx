'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useCategoryStore } from '@/lib/stores/category';
import { useTaskStore, Task } from '@/lib/stores/task';
import { CategoryPanel } from '@/components/tasks/CategoryPanel';
import { TaskInfoCard } from '@/components/tasks/TaskInfoCard';
import CreateTaskForm from '@/components/tasks/CreateTaskForm';
import { ShareDialog } from '@/components/tasks/ShareDialog';
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog';
import MoreSettingsDialog from '../../../components/tasks/MoreSettingsDialog';
import { Inbox, Plus, X, Loader2 } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

export default function TasksPage() {
  const { categoryList, getCategory } = useCategoryStore();
  const { taskList, getTask, deleteTask } = useTaskStore();

  const [selectedCategory, setSelectedCategory] = useState('default');
  const [collectionTypeFilter, setCollectionTypeFilter] = useState<'all' | 'FILE' | 'INFO'>('all');
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
      const matchesCategory = taskCat === selectedCategory;
      const matchesType = collectionTypeFilter === 'all' || t.collectionType === collectionTypeFilter;
      return matchesCategory && matchesType;
    });
  }, [taskList, selectedCategory, collectionTypeFilter]);

  // 统计各类型任务数量
  const taskCounts = useMemo(() => {
    const categoryTasks = taskList.filter((t) => {
      const taskCat = t.category || 'default';
      return taskCat === selectedCategory;
    });
    
    return {
      all: categoryTasks.length,
      FILE: categoryTasks.filter(t => t.collectionType === 'FILE').length,
      INFO: categoryTasks.filter(t => t.collectionType === 'INFO').length,
    };
  }, [taskList, selectedCategory]);

  const handleDeleteTask = async (key: string, isTrash: boolean) => {
    if (confirm(isTrash ? '确认彻底删除此任务吗？无法恢复！' : '确认将此任务移入回收站吗？')) {
      await deleteTask(key);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">任务管理</h1>
            <p className="page-description">创建和管理文件收集任务</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary hidden md:flex"
          >
            <Plus className="w-4 h-4" />
            创建任务
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <CategoryPanel
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />
          </div>

          {/* Task List */}
          <div className="lg:col-span-3">
            {/* Collection Type Filter */}
            <div className="card mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                  筛选：
                </span>
                <button
                  onClick={() => setCollectionTypeFilter('all')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    collectionTypeFilter === 'all'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  全部 ({taskCounts.all})
                </button>
                <button
                  onClick={() => setCollectionTypeFilter('FILE')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1.5 ${
                    collectionTypeFilter === 'FILE'
                      ? 'bg-blue-500 text-white font-medium'
                      : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  }`}
                >
                  <span>📁</span>
                  <span>文件收集 ({taskCounts.FILE})</span>
                </button>
                <button
                  onClick={() => setCollectionTypeFilter('INFO')}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1.5 ${
                    collectionTypeFilter === 'INFO'
                      ? 'bg-green-500 text-white font-medium'
                      : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                  }`}
                >
                  <span>📝</span>
                  <span>信息收集 ({taskCounts.INFO})</span>
                </button>
              </div>
            </div>

            {filteredTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="card">
                <div className="empty-state py-20">
                  <Inbox className="empty-state-icon" />
                  <p className="empty-state-title">暂无任务</p>
                  <p className="empty-state-description">在此分类下还没有创建任务</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn-primary mt-4"
                  >
                    <Plus className="w-4 h-4" />
                    创建任务
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile FAB */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 transition-all z-50 flex items-center justify-center"
          aria-label="创建任务"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Create Task Modal */}
        {showCreateForm && (
          <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
            <div 
              className="modal max-w-2xl w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  创建收集任务
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="modal-body">
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
