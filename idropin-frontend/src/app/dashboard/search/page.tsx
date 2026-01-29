'use client';

import { useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import SearchBar from '@/components/search/SearchBar';
import { formatFileSize } from '@/lib/api/statistics';
import { Search, FileText, Download, Clock } from 'lucide-react';

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState<any>(null);

  const handleSearch = (results: any) => {
    setSearchResults(results);
  };

  const handleDownload = (fileId: string, fileName: string) => {
    window.open(`/api/files/${fileId}/download`, '_blank');
  };

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">文件搜索</h1>
          <p className="page-description">快速查找你的文件</p>
        </div>

        <SearchBar onSearch={handleSearch} />

        {searchResults && (
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-gray-900 dark:text-white">
                  搜索结果 ({searchResults.total})
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {searchResults.duration}ms
                </span>
              </div>
            </div>

            {searchResults.files.length === 0 ? (
              <div className="empty-state py-16">
                <Search className="empty-state-icon" />
                <h3 className="empty-state-title">未找到文件</h3>
                <p className="empty-state-description">请尝试其他搜索条件</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {searchResults.files.map((file: any) => (
                  <div
                    key={file.id}
                    className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.originalName}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.fileSize)}
                            </span>
                            {file.categoryName && (
                              <span className="badge-default">
                                {file.categoryName}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(file.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(file.id, file.originalName)}
                        className="btn-secondary btn-sm flex-shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        下载
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
