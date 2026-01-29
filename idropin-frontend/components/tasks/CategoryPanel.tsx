import React, { useState } from 'react';
import { useCategoryStore } from '@/lib/stores/category';
import { useTaskStore } from '@/lib/stores/task';
import { Plus, Trash2, Folder, Inbox, X } from 'lucide-react';

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
    return count > 0 ? count : 0;
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
  }) => {
    const count = taskCount(id);
    const isActive = selectedCategory === id;
    
    return (
      <button
        onClick={() => onSelect(id)}
        className={`group w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
          isActive
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span>{name}</span>
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              isActive 
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}>
              {count}
            </span>
          )}
          {isDeletable && (
            <button
              onClick={(e) => handleDelete(e, id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="card p-4">
      <div className="mb-4">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">分类</h2>
      </div>

      <div className="space-y-1">
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
          <div className="px-1 py-1">
            <input
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onBlur={handleAddCategory}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="分类名称"
              className="input text-sm"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新建分类</span>
          </button>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
        <CategoryItem id="trash" name="回收站" icon={Trash2} />
      </div>
    </div>
  );
};
