'use client';

import { useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import SearchBar from '@/components/search/SearchBar';
import { formatFileSize } from '@/lib/api/statistics';

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
      <div className="space-y-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">文件搜索</h1>
            <p className="mt-2 text-gray-600">快速查找你的文件</p>
          </div>

          <SearchBar onSearch={handleSearch} />

          {searchResults && (
            <div className="mt-8">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      搜索结果 ({searchResults.total})
                    </h2>
                    <span className="text-sm text-gray-500">
                      耗时 {searchResults.duration}ms
                    </span>
                  </div>
                </div>

                {searchResults.files.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">未找到文件</h3>
                    <p className="mt-1 text-sm text-gray-500">请尝试其他搜索条件</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {searchResults.files.map((file: any) => (
                      <div
                        key={file.id}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <svg
                                className="w-10 h-10 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {file.originalName}
                                </p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                  <span>{formatFileSize(file.fileSize)}</span>
                                  {file.categoryName && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                      {file.categoryName}
                                    </span>
                                  )}
                                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownload(file.id, file.originalName)}
                            className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            下载
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </AuthGuard>
  );
}
