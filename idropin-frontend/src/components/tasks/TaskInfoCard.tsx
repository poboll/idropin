'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BarChart2 } from 'lucide-react';

interface TaskInfoCardProps {
  task: any;
  onEdit: (task: any) => void;
  onDelete: (key: string, isTrash: boolean) => void;
  onShare: () => void;
  onMore: () => void;
}

function TaskInfoCard({ task, onEdit, onDelete, onShare, onMore }: TaskInfoCardProps) {
  const router = useRouter();

  return (
    <div className="bg-background/50 rounded-lg border border-border/50 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold">{task.name || task.title}</h4>
        {task.collectionType && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
            {task.collectionType === 'INFO' ? '信息' : '文件'}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {task.description || '暂无描述'}
      </p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onEdit(task)}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          编辑
        </button>
        <button
          onClick={() => router.push(`/dashboard/tasks/${task.key}/submissions`)}
          className="px-3 py-1 text-sm rounded-md hover:opacity-90 border border-border text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          查看提交
        </button>
        <button
          onClick={onShare}
          className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
        >
          分享
        </button>
        <button
          onClick={onMore}
          className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:opacity-90"
        >
          更多
        </button>
      </div>
    </div>
  );
}

export default TaskInfoCard;
