'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Calendar, FileText, Tag } from 'lucide-react';

interface FileSearchItem {
  id: string;
  name: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  categoryId?: string;
  categoryName?: string;
  tags?: string[];
  storagePath: string;
  url: string;
  createdAt: string;
}

interface SearchResult {
  total: number;
  files: FileSearchItem[];
  duration: number;
  suggestions: string[];
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    mimeType: '',
    categoryId: '',
    tags: [] as string[],
    minFileSize: null as number | null,
    maxFileSize: null as number | null,
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 0,
    size: 20,
  });

  // 获取搜索建议
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (keyword.length > 0) {
        try {
          const response = await fetch(`/api/search/suggestions?keyword=${encodeURIComponent(keyword)}`);
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        } catch (error) {
          console.error('获取搜索建议失败:', error);
        }
      } else {
        setSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 执行搜索
  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          ...filters,
        }),
      });
      const data = await response.json();
      setSearchResult(data);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  // 获取文件类型图标
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel')) return '📊';
    if (mimeType.includes('powerpoint')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📁';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 搜索头部 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            文件搜索
          </h1>

          {/* 搜索框 */}
          <div className="relative mb-4">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入关键字搜索文件..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>

          {/* 搜索建议 */}
          {suggestions.length > 0 && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">搜索建议:</div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setKeyword(suggestion)}
                    className="px-3 py-1 bg-white dark:bg-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 筛选按钮 */}
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              搜索
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              筛选
            </button>
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    文件类型
                  </label>
                  <select
                    value={filters.mimeType}
                    onChange={(e) => setFilters({ ...filters, mimeType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  >
                    <option value="">全部类型</option>
                    <option value="image/*">图片</option>
                    <option value="video/*">视频</option>
                    <option value="audio/*">音频</option>
                    <option value="application/pdf">PDF</option>
                    <option value="application/zip">压缩包</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    分类
                  </label>
                  <select
                    value={filters.categoryId}
                    onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  >
                    <option value="">全部分类</option>
                    {/* TODO: 从API加载分类列表 */}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    排序方式
                  </label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      setFilters({ ...filters, sortBy, sortOrder });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  >
                    <option value="createdAt-desc">创建时间 (最新)</option>
                    <option value="createdAt-asc">创建时间 (最早)</option>
                    <option value="fileSize-desc">文件大小 (大到小)</option>
                    <option value="fileSize-asc">文件大小 (小到大)</option>
                    <option value="name-asc">文件名 (A-Z)</option>
                    <option value="name-desc">文件名 (Z-A)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    开始日期
                  </label>
                  <input
                    type="datetime-local"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    结束日期
                  </label>
                  <input
                    type="datetime-local"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                  />
                </div>

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      最小大小 (MB)
                    </label>
                    <input
                      type="number"
                      value={filters.minFileSize || ''}
                      onChange={(e) => setFilters({ ...filters, minFileSize: e.target.value ? Number(e.target.value) * 1024 * 1024 : null })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      最大大小 (MB)
                    </label>
                    <input
                      type="number"
                      value={filters.maxFileSize || ''}
                      onChange={(e) => setFilters({ ...filters, maxFileSize: e.target.value ? Number(e.target.value) * 1024 * 1024 : null })}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 搜索结果 */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">搜索中...</p>
          </div>
        )}

        {searchResult && !loading && (
          <div>
            {/* 搜索统计 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-gray-700 dark:text-gray-300">
                  找到 <span className="font-bold text-blue-600">{searchResult.total}</span> 个结果
                  {searchResult.duration > 0 && (
                    <span className="ml-4 text-sm text-gray-500">
                      耗时 {searchResult.duration}ms
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 文件列表 */}
            {searchResult.files.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResult.files.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4"
                  >
                    {/* 文件图标和名称 */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-4xl">{getFileIcon(file.mimeType)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {file.originalName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {file.name}
                        </p>
                      </div>
                    </div>

                    {/* 文件信息 */}
                    <div className="space-y-2 mb-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{formatFileSize(file.fileSize)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(file.createdAt)}</span>
                      </div>
                      {file.categoryName && (
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          <span>{file.categoryName}</span>
                        </div>
                      )}
                      {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {file.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-sm"
                      >
                        <Download className="h-4 w-4" />
                        下载
                      </a>
                      <button
                        onClick={() => window.open(file.url, '_blank')}
                        className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1 text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        预览
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  没有找到匹配的文件
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  尝试使用不同的关键字或调整筛选条件
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
