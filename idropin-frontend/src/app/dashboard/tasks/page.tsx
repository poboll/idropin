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
import { Inbox, Plus, X, Loader2, Search } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { SkeletonLoader } from '@/components/SkeletonLoader';

const showSuccessToast = (message: string) => {
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5 z-[100] animate-slide-in';
  toast.innerHTML = `
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
    <span class="font-medium">${message}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
};

export default function TasksPage() {
  const { categoryList, getCategory } = useCategoryStore();
  const { taskList, getTask, deleteTask, restoreTask } = useTaskStore();

  const [selectedCategory, setSelectedCategory] = useState('default');
  const [collectionTypeFilter, setCollectionTypeFilter] = useState<'all' | 'FILE' | 'INFO'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [shareTask, setShareTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [moreSettingsTask, setMoreSettingsTask] = useState<Task | null>(null);

  const handleSelectCategory = async (categoryKey: string) => {
    setSelectedCategory(categoryKey);
    // Trash is backed by a separate API on the server.
    setLoading(true);
    try {
      await getTask({ trash: categoryKey === 'trash' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([getCategory(), getTask({ trash: false })]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [getCategory, getTask]);

  const filteredTasks = useMemo(() => {
    return taskList.filter((t) => {
      const taskCat = t.category || 'default';
      const matchesCategory = taskCat === selectedCategory;
      const matchesType = collectionTypeFilter === 'all' || t.collectionType === collectionTypeFilter;
      const matchesSearch = !searchQuery || [t.name, t.description].filter(Boolean).join(' ').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesType && matchesSearch;
    });
  }, [taskList, selectedCategory, collectionTypeFilter, searchQuery]);

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

  const handleRestoreTask = async (key: string) => {
    if (confirm('确认从回收站恢复此任务吗？')) {
      await restoreTask(key);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between animate-pulse">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-32" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-48" />
            </div>
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-28" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="card p-4 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded" />
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonLoader variant="card" count={4} />
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="space-y-6 page-enter">
        {/* Page Header */}
        <div className="page-header animate-slide-in-down flex items-center justify-between">
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
              onSelect={handleSelectCategory}
            />
          </div>

          {/* Task List */}
          <div className="lg:col-span-3">
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索任务名称或描述..."
                  className="w-full pl-10 pr-9 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-colors shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800/80 rounded-xl p-1 gap-0.5">
                <button
                  onClick={() => setCollectionTypeFilter('all')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    collectionTypeFilter === 'all'
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  全部
                  <span className={`text-xs tabular-nums px-1.5 py-0.5 rounded-md ${
                    collectionTypeFilter === 'all'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      : 'bg-gray-200/70 dark:bg-gray-700/70 text-gray-500 dark:text-gray-400'
                  }`}>
                    {taskCounts.all}
                  </span>
                </button>
                <button
                  onClick={() => setCollectionTypeFilter('FILE')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    collectionTypeFilter === 'FILE'
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="text-blue-400 dark:text-blue-500 text-xs">●</span>
                  文件
                  <span className={`text-xs tabular-nums px-1.5 py-0.5 rounded-md ${
                    collectionTypeFilter === 'FILE'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      : 'bg-gray-200/70 dark:bg-gray-700/70 text-gray-500 dark:text-gray-400'
                  }`}>
                    {taskCounts.FILE}
                  </span>
                </button>
                <button
                  onClick={() => setCollectionTypeFilter('INFO')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    collectionTypeFilter === 'INFO'
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <span className="text-emerald-400 dark:text-emerald-500 text-xs">●</span>
                  信息
                  <span className={`text-xs tabular-nums px-1.5 py-0.5 rounded-md ${
                    collectionTypeFilter === 'INFO'
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      : 'bg-gray-200/70 dark:bg-gray-700/70 text-gray-500 dark:text-gray-400'
                  }`}>
                    {taskCounts.INFO}
                  </span>
                </button>
              </div>
            </div>

            {filteredTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTasks.map((task, index) => (
                  <div
                    key={task.key}
                    className="animate-slide-in-up"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <TaskInfoCard
                      task={task}
                      onEdit={setEditTask}
                      onDelete={handleDeleteTask}
                      onRestore={handleRestoreTask}
                      onShare={() => setShareTask(task)}
                      onMore={setMoreSettingsTask}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 px-8 rounded-xl border border-dashed border-violet-200 dark:border-violet-800/40 bg-violet-50/30 dark:bg-violet-900/10">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800/40 shadow-sm flex items-center justify-center mb-4">
                  <Inbox className="w-7 h-7 text-violet-400 dark:text-violet-500" />
                </div>
                <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1">暂无任务</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">在此分类下还没有创建任务</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  创建任务
                </button>
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
                    showSuccessToast('任务创建成功');
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
