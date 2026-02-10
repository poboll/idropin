'use client';

import { useState } from 'react';
import { searchFiles, type SearchRequest } from '@/lib/api/search';
import { Search, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch?: (results: any) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SearchRequest>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() && !filters.categoryId && !filters.mimeType) return;

    setLoading(true);
    try {
      const request: SearchRequest = {
        keyword: keyword.trim(),
        ...filters,
        page: 1,
        size: 20,
      };
      const results = await searchFiles(request);
      onSearch?.(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索文件名、标签..."
              className="input pl-10"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                搜索中
              </>
            ) : (
              '搜索'
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn-secondary"
          >
            {showAdvanced ? (
              <>
                收起
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                高级
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="form-group">
              <label className="form-label">文件类型</label>
              <select
                value={filters.mimeType || ''}
                onChange={(e) => setFilters({ ...filters, mimeType: e.target.value || undefined })}
                className="input"
              >
                <option value="">全部类型</option>
                <option value="image/">图片</option>
                <option value="video/">视频</option>
                <option value="audio/">音频</option>
                <option value="application/pdf">PDF</option>
                <option value="text/">文本</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">排序方式</label>
              <select
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="input"
              >
                <option value="createdAt">创建时间</option>
                <option value="fileSize">文件大小</option>
                <option value="name">文件名</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
