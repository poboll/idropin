import { apiClient } from './client';

/**
 * 统计相关API
 */

export interface FileTypeDistribution {
  type: string;
  typeName: string;
  count: number;
  percentage: number;
}

export interface UploadTrend {
  date: string;
  count: number;
  size: number;
}

export interface CategoryStatistics {
  categoryId: string;
  categoryName: string;
  fileCount: number;
  storageSize: number;
}

export interface StorageUsage {
  used: number;
  total: number;
  percentage: number;
  remaining: number;
}

export interface FileStatistics {
  totalFiles: number;
  totalStorageSize: number;
  todayUploads: number;
  weekUploads: number;
  monthUploads: number;
  fileTypeDistribution: FileTypeDistribution[];
  uploadTrend: UploadTrend[];
  categoryStatistics: CategoryStatistics[];
  storageUsage: StorageUsage;
}

/**
 * 获取文件统计数据
 */
export async function getFileStatistics(): Promise<FileStatistics> {
  const response = await apiClient.get('/statistics/files');
  return response.data;
}

/**
 * 获取系统统计数据（管理员）
 */
export async function getSystemStatistics(): Promise<FileStatistics> {
  const response = await apiClient.get('/statistics/system');
  return response.data;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
