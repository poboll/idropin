import React from 'react';
import { Task } from '@/lib/stores/task';
import { formatDate } from '@/lib/utils/string';
import { Edit, Share2, Trash2, MoreHorizontal, FileText, Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    <div className="group glass-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-foreground line-clamp-1 flex-1 pr-4" title={task.name}>
          {task.name}
        </h3>
        
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 absolute top-4 right-4 bg-card/80 backdrop-blur-sm sm:bg-transparent pl-2">
          <button
            onClick={() => onMore(task)}
            className="p-2 rounded-full text-amber-500 hover:bg-amber-500/10 transition-colors"
            title="更多设置"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-2 rounded-full text-emerald-500 hover:bg-emerald-500/10 transition-colors"
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onShare(task.key)}
            className="p-2 rounded-full text-blue-500 hover:bg-blue-500/10 transition-colors"
            title="分享"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.key, isTrash)}
            className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="min-h-[80px]">
        {task.recentLog && task.recentLog.length > 0 ? (
          <div className="space-y-3">
             <div className="flex justify-between items-center text-xs text-muted-foreground font-medium uppercase tracking-wider">
               <span>近 {task.recentLog.length} 条提交记录</span>
               <Link 
                 href={`/dashboard/files?task=${task.key}`}
                 className="text-primary hover:underline hover:text-primary/80 transition-colors"
               >
                 查看详情
               </Link>
             </div>
             <ul className="space-y-2">
               {task.recentLog.slice(0, 3).map((log: any, idx) => (
                 <li key={idx} className="flex items-center text-xs text-muted-foreground">
                   <Clock className="w-3 h-3 mr-2 opacity-70" />
                   <span className="mr-3 font-mono opacity-70">{formatDate(log.date || new Date(), 'MM-dd hh:mm')}</span>
                   <span className="truncate flex-1">{log.filename}</span>
                 </li>
               ))}
             </ul>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 py-4">
            <FileText className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">暂时没有提交记录...</span>
          </div>
        )}
      </div>
    </div>
  );
};
