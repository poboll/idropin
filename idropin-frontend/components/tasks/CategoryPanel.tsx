import React, { useState } from 'react';
import { useCategoryStore } from '@/lib/stores/category';
import { useTaskStore } from '@/lib/stores/task';
import { Plus, Trash2, Folder, Inbox, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CategoryPanelProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

export const CategoryPanel: React.FC<CategoryPanelProps> = ({
  selectedCategory,
  onSelect,
}) => {
  const { categoryList, createCategory, deleteCategory } = useCategoryStore();
  const { taskList } = useTaskStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const taskCount = (c: string) => {
    const count = taskList.filter((t) => t.category === c).length;
    return count > 0 ? `(${count})` : '';
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setIsCreating(false);
      return;
    }
    await createCategory(newCategoryName);
    setNewCategoryName('');
    setIsCreating(false);
  };

  const handleDelete = async (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    if (confirm('是否删除该分类？')) {
       await deleteCategory(key);
       if (selectedCategory === key) {
         onSelect('default');
       }
    }
  };

  const CategoryItem = ({
    id,
    name,
    icon: Icon,
    isDeletable = false,
  }: {
    id: string;
    name: string;
    icon: React.ElementType;
    isDeletable?: boolean;
  }) => (
    <div
      onClick={() => onSelect(id)}
      className={cn(
        'group flex items-center justify-between px-4 py-3 cursor-pointer transition-all duration-200 rounded-lg mb-1',
        selectedCategory === id
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">
          {name} {taskCount(id)}
        </span>
      </div>
      {isDeletable && (
        <button
          onClick={(e) => handleDelete(e, id)}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/20 hover:text-destructive",
            selectedCategory === id ? "text-primary-foreground/80 hover:bg-white/20 hover:text-white" : ""
          )}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col max-h-[600px] lg:h-full lg:min-h-[500px]">
      <div className="mb-6">
        <h2 className="text-lg font-bold tracking-tight mb-1">分类列表</h2>
        <p className="text-xs text-muted-foreground">点击分类可筛选任务</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        <CategoryItem id="default" name="默认" icon={Inbox} />
        
        {categoryList.map((cat) => (
          <CategoryItem
            key={cat.k}
            id={cat.k}
            name={cat.name}
            icon={Folder}
            isDeletable
          />
        ))}

        {isCreating ? (
          <div className="px-2 py-1">
            <input
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onBlur={handleAddCategory}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="分类名称"
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors border border-dashed border-border rounded-lg hover:border-primary hover:bg-accent/50 mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>New 分类</span>
          </button>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
         <CategoryItem id="trash" name="回收站" icon={Trash2} />
      </div>
    </div>
  );
};
