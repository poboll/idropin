'use client';

import React from 'react';

interface CreateTaskFormProps {
  activeCategory?: string;
}

function CreateTaskForm({ activeCategory }: CreateTaskFormProps) {
  return (
    <div className="mb-6 p-4 bg-background/50 rounded-lg border border-border/50">
      <h3 className="text-lg font-semibold mb-4">创建任务</h3>
      <p className="text-sm text-muted-foreground">
        创建任务功能正在开发中...
      </p>
    </div>
  );
}

export default CreateTaskForm;
