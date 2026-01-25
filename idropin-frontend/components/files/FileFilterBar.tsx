'use client';

import { Search, RefreshCw, Download } from 'lucide-react';

interface Category {
  k: string;
  name: string;
}

interface Task {
  key: string;
  name: string;
  category?: string;
}

interface FileFilterBarProps {
  categories: Category[];
  tasks: Task[];
  selectedCategory: string;
  selectedTask: string;
  searchWord: string;
  onCategoryChange: (category: string) => void;
  onTaskChange: (task: string) => void;
  onSearchChange: (search: string) => void;
  onDownloadTask: () => void;
  onRefresh: () => void;
  isDownloading?: boolean;
}

export default function FileFilterBar({
  categories,
  tasks,
  selectedCategory,
  selectedTask,
  searchWord,
  onCategoryChange,
  onTaskChange,
  onSearchChange,
  onDownloadTask,
  onRefresh,
  isDownloading = false,
}: FileFilterBarProps) {
  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === selectedCategory);

  return (
    <div className="glass-panel p-4 mb-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">分类</span>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500
              bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-700 dark:text-slate-200"
          >
            <option value="all">全部</option>
            <option value="default">默认</option>
            {categories.map((cat) => (
              <option key={cat.k} value={cat.k}>{cat.name}</option>
            ))}
            <option value="no-task">无关联任务</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">任务</span>
          <select
            value={selectedTask}
            onChange={(e) => onTaskChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500
              bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-700 dark:text-slate-200 min-w-[150px]"
          >
            <option value="all">全部</option>
            {filteredTasks.map((task) => (
              <option key={task.key} value={task.key}>{task.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={onDownloadTask}
          disabled={selectedTask === 'all' || isDownloading}
          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm rounded-lg shadow-md hover:shadow-lg
            hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <Download className="w-4 h-4" />
          下载任务中的文件
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchWord}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="请输入要检索的内容"
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500
                bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-700 dark:text-slate-200 placeholder-slate-400"
            />
          </div>
          <button
            onClick={onRefresh}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
