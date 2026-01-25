'use client';

import React from 'react';

interface ShareDialogProps {
  task: any;
  open: boolean;
  onClose: () => void;
}

function ShareDialog({ task, open, onClose }: ShareDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">分享任务</h3>
        <p className="text-sm text-muted-foreground mb-4">
          分享功能正在开发中...
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          关闭
        </button>
      </div>
    </div>
  );
}

export default ShareDialog;
