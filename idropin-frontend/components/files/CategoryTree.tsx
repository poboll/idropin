'use client';

import { useState } from 'react';
import { CategoryTreeNode, deleteCategory } from '@/lib/api/categories';

interface CategoryTreeProps {
  categories: CategoryTreeNode[];
  selectedId?: string;
  onSelect?: (category: CategoryTreeNode | null) => void;
  onEdit?: (category: CategoryTreeNode) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

interface TreeNodeProps {
  node: CategoryTreeNode;
  level: number;
  selectedId?: string;
  onSelect?: (category: CategoryTreeNode | null) => void;
  onEdit?: (category: CategoryTreeNode) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

function TreeNode({ node, level, selectedId, onSelect, onEdit, onDelete, showActions }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`确定要删除分类 "${node.name}" 吗？`)) return;
    setDeleting(true);
    try {
      await deleteCategory(node.id);
      onDelete?.(node.id);
    } catch (error) {
      console.error('删除失败', error);
      alert('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors group ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : 'hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => onSelect?.(isSelected ? null : node)}
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
            >
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: node.color || '#94a3b8' }}
          />
          <span className="text-sm truncate">{node.name}</span>
        </div>
        {showActions && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(node); }}
              className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
              title="编辑"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
              title="删除"
              disabled={deleting}
            >
              {deleting ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              showActions={showActions}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree({
  categories,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  showActions = true,
}: CategoryTreeProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-400">暂无分类</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* 全部文件选项 */}
      <div
        className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
          !selectedId
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : 'hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
        onClick={() => onSelect?.(null)}
      >
        <svg className="w-5 h-5 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="text-sm">全部文件</span>
      </div>
      {/* 分类树 */}
      {categories.map((category) => (
        <TreeNode
          key={category.id}
          node={category}
          level={0}
          selectedId={selectedId}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
