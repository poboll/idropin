'use client';

import { useState } from 'react';
import { searchFiles, type SearchRequest } from '@/lib/api/search';

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
        page: 0,
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
    <div className="bg-white rounded-lg shadow p-4">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索文件名、标签..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '搜索中...' : '搜索'}
          </button>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showAdvanced ? '收起' : '高级'}
          </button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文件类型
              </label>
              <select
                value={filters.mimeType || ''}
                onChange={(e) => setFilters({ ...filters, mimeType: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">全部类型</option>
                <option value="image/">图片</option>
                <option value="video/">视频</option>
                <option value="audio/">音频</option>
                <option value="application/pdf">PDF</option>
                <option value="text/">文本</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                排序方式
              </label>
              <select
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
