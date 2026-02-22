import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { Task } from '@/lib/stores/task';
import { formatDate } from '@/lib/utils/string';
import { Edit3, Share2, Trash2, MoreHorizontal, FileText, Clock, ExternalLink, FolderOpen, FileCheck, ClipboardList, RotateCcw, ArrowUpRight } from 'lucide-react';
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

  const isFile = task.collectionType === 'FILE';

  return (
    <div className="group relative flex flex-col h-full bg-white dark:bg-gray-950 border border-gray-200/80 dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* Top accent line */}      <div className={`h-0.5 w-full ${isFile ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`} />

      <div className="flex flex-col flex-1 p-5 gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Type badge */}
            <div className="flex items-center gap-2 mb-1.5">
              {isFile ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[11px] font-medium rounded-full border border-blue-100 dark:border-blue-900 flex-shrink-0">
                  <FolderOpen className="w-3 h-3" />
                  文件
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium rounded-full border border-emerald-100 dark:border-emerald-900 flex-shrink-0">
                  <FileCheck className="w-3 h-3" />
                  信息
                </span>
              )}
            </div>
            <h3
              className="font-semibold text-[15px] text-gray-900 dark:text-white truncate leading-snug"
              title={task.name}
            >
              {task.name}
            </h3>
            {task.description && (
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>

          {/* Submission count */}
          {submissionCount !== undefined && (
            <div className="flex-shrink-0 text-right">
              <div className={`text-2xl font-bold tabular-nums leading-none ${submissionCount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-700'}`}>
                {submissionCount}
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                {peopleLimit && peopleLimit > 0 ? `/ ${peopleLimit} 份` : '份'}
              </div>
            </div>
          )}
        </div>

        {/* Progress bar (only when there's a limit) */}
        {submissionCount !== undefined && peopleLimit && peopleLimit > 0 && (
          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden -mt-2">
            <div
              className={`h-full rounded-full transition-all ${isFile ? 'bg-blue-400' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(100, (submissionCount / peopleLimit) * 100)}%` }}
            />
          </div>
        )}

        {/* Recent submissions */}
        <div className="flex-1 min-h-[80px]">
          {loading ? (
            <div className="animate-pulse space-y-2.5 pt-1">
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-1/2" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full w-2/3" />
            </div>
          ) : recentSubmissions.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  最近提交
                </span>
                <Link
                  href={`/dashboard/tasks/${task.key}/submissions`}
                  className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-0.5 transition-colors"
                >
                  全部
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <ul className="space-y-1.5">
                {recentSubmissions.map((submission, idx) => (
                  <li
                    key={submission.id || idx}
                    className={`flex items-center gap-2 pl-3 border-l-2 ${isFile ? 'border-blue-200 dark:border-blue-900/60' : 'border-emerald-200 dark:border-emerald-900/60'}`}
                  >
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono flex-shrink-0">
                      {formatDate(new Date(submission.submittedAt), 'MM-dd hh:mm')}
                    </span>
                    <span className="text-[12px] text-gray-600 dark:text-gray-400 truncate">
                      {isFile && submission.fileName ? submission.fileName : submission.submitterName || '匿名'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-4 gap-2">
              <div className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-violet-300 dark:text-violet-600" />
              </div>
              <span className="text-[12px] text-gray-400 dark:text-gray-500">暂无提交记录</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {formatDate(new Date(task.createdAt || Date.now()), 'yyyy-MM-dd')}
          </span>

          <div className="flex items-center gap-0.5">
            <Link
              href={`/dashboard/tasks/${task.key}/submissions`}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ClipboardList className="w-3 h-3" />
              提交
            </Link>
            <Link
              href={`/task/${task.key}`}
              target="_blank"
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              链接
              <ExternalLink className="w-3 h-3" />
            </Link>

            <div className="w-px h-3.5 bg-gray-200 dark:bg-gray-700 mx-0.5" />

            <button
              onClick={() => onMore(task)}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="更多设置"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="编辑"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onShare}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="分享"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            {isTrash && onRestore && (
              <button
                onClick={() => onRestore(task.key)}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                title="恢复"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onDelete(task.key, isTrash)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
