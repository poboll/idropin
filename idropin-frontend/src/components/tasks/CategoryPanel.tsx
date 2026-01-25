'use client';

import React from 'react';

interface CategoryPanelProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

function CategoryPanel({ selectedCategory, onSelect }: CategoryPanelProps) {
  return (
    <div className="h-full bg-background/50 rounded-lg border border-border/50 p-4">
      <h3 className="text-lg font-semibold mb-4">分类</h3>
      <div className="space-y-2">
        <button
          onClick={() => onSelect('default')}
          className={`w-full text-left px-3 py-2 rounded-md transition-colors ${selectedCategory === 'default'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent'
            }`}
        >
          默认分类
        </button>
      </div>
    </div>
  );
}

export default CategoryPanel;
