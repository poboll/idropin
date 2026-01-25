'use client';

import React from 'react';

interface TaskInfoCardProps {
  task: any;
  onEdit: (task: any) => void;
  onDelete: (key: string, isTrash: boolean) => void;
  onShare: () => void;
  onMore: () => void;
}

function TaskInfoCard({ task, onEdit, onDelete, onShare, onMore }: TaskInfoCardProps) {
  return (
    <div className="bg-background/50 rounded-lg border border-border/50 p-4 hover:shadow-md transition-shadow">
      <h4 className="font-semibold mb-2">{task.name || task.title}</h4>
      <p className="text-sm text-muted-foreground mb-4">
        {task.description || '暂无描述'}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(task)}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          编辑
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
