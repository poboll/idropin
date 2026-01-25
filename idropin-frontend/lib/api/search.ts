import { apiClient } from './client';

/**
 * 搜索相关API
 */

export interface SearchRequest {
  keyword?: string;
  mimeType?: string;
  categoryId?: string;
  tags?: string[];
  minFileSize?: number;
  maxFileSize?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'fileSize' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export interface FileSearchItem {
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

export interface SearchResult {
  total: number;
  files: FileSearchItem[];
  duration: number;
  suggestions: string[];
}

/**
 * 搜索文件
 */
export async function searchFiles(request: SearchRequest): Promise<SearchResult> {
  const response = await apiClient.post('/search', request);
  return response.data;
}

/**
 * 获取搜索建议
 */
export async function getSearchSuggestions(keyword: string): Promise<string[]> {
  const response = await apiClient.get('/search/suggestions', {
    params: { keyword },
  });
  return response.data.suggestions;
}
