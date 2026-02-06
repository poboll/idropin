import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Task } from '@/lib/stores/task';
import { formatDate } from '@/lib/utils/string';
import { Edit3, Share2, Trash2, MoreHorizontal, FileText, Clock, ExternalLink, FolderOpen, FileCheck, ClipboardList, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { getTaskStatistics, getTaskInfoSubmissions } from '@/lib/api/tasks';

interface TaskInfoCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (key: string, isTrash: boolean) => void;
  onShare: () => void;
  onMore: (task: Task) => void;
  onRestore?: (key: string) => void;
}

export const TaskInfoCard: FC<TaskInfoCardProps> = ({
  task,
  onEdit,
  onDelete,
  onShare,
  onMore,
  onRestore,
}) => {
  const isTrash = task.category === 'trash';
  const [submissionCount, setSubmissionCount] = useState<number | undefined>(task.submissionCount);
  const [peopleLimit, setPeopleLimit] = useState<number | undefined>(task.peopleLimit);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载统计数据和最近提交记录
    const loadStats = async () => {
      try {
        setLoading(true);
        if (task.collectionType === 'INFO') {
          // 信息收集任务：获取提交记录
          const result = await getTaskInfoSubmissions(task.key);
          setSubmissionCount(result.count || result.submissions?.length || 0);
          // 获取最近3条提交记录，按时间倒序排列
          const recent = (result.submissions || [])
            .sort((a: any, b: any) => {
              // 按提交时间倒序排列（最新的在前）
              return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
            })
            .slice(0, 3)
            .map((sub: any) => ({
              id: sub.id,
              submitterName: sub.submitterName || '匿名',
              submittedAt: sub.submittedAt,
            }));
          setRecentSubmissions(recent);
        } else {
          // 文件收集任务：获取统计数据
          const stats = await getTaskStatistics(task.key);
          setSubmissionCount(stats.totalSubmissions || 0);
          // 获取最近提交记录，按时间倒序排列
          const recent = (stats.recentSubmissions || [])
            .sort((a: any, b: any) => {
              // 按提交时间倒序排列（最新的在前）
              return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
            })
            .slice(0, 3)
            .map((sub: any) => ({
              id: sub.submissionId,
              fileName: sub.fileName,
              submitterName: sub.submitterName || '匿名',
              submittedAt: sub.submittedAt,
            }));
          setRecentSubmissions(recent);
        }
      } catch (error) {
        console.error('Failed to load task stats:', error);
        setSubmissionCount(0);
        setRecentSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [task.key, task.collectionType]);

  return (
    <div className="card p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors group flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-medium text-gray-900 dark:text-white truncate" title={task.name}>
              {task.name}
            </h3>
            {/* Collection Type Badge */}
            {task.collectionType === 'FILE' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50/60 dark:bg-blue-900/10 text-blue-600/80 dark:text-blue-300/80 text-xs font-medium rounded border border-blue-100/50 dark:border-blue-800/30 flex-shrink-0">
                <FolderOpen className="w-3 h-3" />
                收集文件
              </span>
            )}
            {task.collectionType === 'INFO' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50/60 dark:bg-emerald-900/10 text-emerald-600/80 dark:text-emerald-300/80 text-xs font-medium rounded border border-emerald-100/50 dark:border-emerald-800/30 flex-shrink-0">
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
        
        {/* Right Side: Stats + Actions */}
        <div className="flex flex-col items-end gap-2">
          {/* Collection Progress */}
          {submissionCount !== undefined && (
            <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                已收集 <span className="font-semibold text-gray-900 dark:text-white">{submissionCount}</span>
                {peopleLimit && peopleLimit > 0 && (
                  <span>
                    <span className="mx-0.5">/</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{peopleLimit}</span>
                  </span>
                )}
              </div>
            </div>
          )}
          
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
              onClick={onShare}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="分享"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {isTrash && onRestore && (
              <button
                onClick={() => onRestore(task.key)}
                className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                title="恢复"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(task.key, isTrash)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[96px] flex-1">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center py-6">
            <div className="animate-pulse space-y-2 w-full">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
            </div>
          </div>
        ) : recentSubmissions.length > 0 ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                最近 {recentSubmissions.length} 条提交
              </span>
              <Link 
                href={`/dashboard/tasks/${task.key}/submissions`}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                查看全部
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <ul className="space-y-2">
              {recentSubmissions.map((submission, idx) => (
                <li key={submission.id || idx} className="flex items-center text-sm">
                  <Clock className="w-3 h-3 mr-2 text-gray-400" />
                  <span className="text-gray-400 dark:text-gray-500 text-xs mr-3 font-mono">
                    {formatDate(new Date(submission.submittedAt), 'MM-dd hh:mm')}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 truncate flex-1">
                    {task.collectionType === 'FILE' && submission.fileName 
                      ? submission.fileName 
                      : submission.submitterName || '匿名'}
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
      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
          创建于 {formatDate(new Date(task.createdAt || Date.now()), 'yyyy-MM-dd')}
        </span>
        <div className="flex items-center gap-3">
          {/* 所有任务都显示查看提交记录按钮 */}
          <Link
            href={`/dashboard/tasks/${task.key}/submissions`}
            className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 flex items-center gap-1 transition-colors"
          >
            <ClipboardList className="w-3 h-3" />
            查看提交
          </Link>
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
    </div>
  );
};
