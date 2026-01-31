import React from 'react';
import { Task } from '@/lib/stores/task';
import { formatDate } from '@/lib/utils/string';
import { Edit3, Share2, Trash2, MoreHorizontal, FileText, Clock, ExternalLink, FolderOpen, FileCheck } from 'lucide-react';
import Link from 'next/link';

interface TaskInfoCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (key: string, isTrash: boolean) => void;
  onShare: (key: string) => void;
  onMore: (task: Task) => void;
}

export const TaskInfoCard: React.FC<TaskInfoCardProps> = ({
  task,
  onEdit,
  onDelete,
  onShare,
  onMore,
}) => {
  const isTrash = task.category === 'trash';

  return (
    <div className="card p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-medium text-gray-900 dark:text-white truncate" title={task.name}>
              {task.name}
            </h3>
            {/* Collection Type Badge */}
            {task.collectionType === 'FILE' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded border border-blue-200 dark:border-blue-800 flex-shrink-0">
                <FolderOpen className="w-3 h-3" />
                收集文件
              </span>
            )}
            {task.collectionType === 'INFO' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-medium rounded border border-green-200 dark:border-green-800 flex-shrink-0">
                <FileCheck className="w-3 h-3" />
                收集信息
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onMore(task)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="更多设置"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="编辑"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onShare(task.key)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            title="分享"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.key, isTrash)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[80px]">
        {task.recentLog && task.recentLog.length > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                最近 {task.recentLog.length} 条提交
              </span>
              <Link 
                href={`/dashboard/files?task=${task.key}`}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                查看全部
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <ul className="space-y-2">
              {task.recentLog.slice(0, 3).map((log: any, idx) => (
                <li key={idx} className="flex items-center text-sm">
                  <Clock className="w-3 h-3 mr-2 text-gray-400" />
                  <span className="text-gray-400 dark:text-gray-500 text-xs mr-3 font-mono">
                    {formatDate(log.date || new Date(), 'MM-dd hh:mm')}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                    {log.filename}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-6">
            <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
            <span className="text-sm text-gray-400 dark:text-gray-500">暂无提交记录</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          创建于 {formatDate(new Date(task.createdAt || Date.now()), 'yyyy-MM-dd')}
        </span>
        <Link
          href={`/task/${task.key}`}
          target="_blank"
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
        >
          收集链接
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
