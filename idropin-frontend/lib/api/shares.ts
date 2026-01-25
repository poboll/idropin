import { apiClient } from './client';

/**
 * 文件分享相关API
 */

export interface CreateShareRequest {
  fileId: string;
  password?: string;
  expireAt?: string;
  downloadLimit?: number;
}

export interface FileShare {
  id: string;
  fileId: string;
  shareCode: string;
  password?: string;
  expireAt?: string;
  downloadLimit?: number;
  downloadCount: number;
  createdBy: string;
  createdAt: string;
}

export interface SharedFile {
  id: string;
  name: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  createdAt: string;
}

/**
 * 创建文件分享
 */
export async function createShare(data: CreateShareRequest): Promise<FileShare> {
  const response = await apiClient.post('/shares', data);
  return response.data.data;
}

/**
 * 获取用户的分享列表
 */
export async function getUserShares(): Promise<FileShare[]> {
  const response = await apiClient.get('/shares');
  return response.data.data;
}

/**
 * 获取分享详情
 */
export async function getShare(shareId: string): Promise<FileShare> {
  const response = await apiClient.get(`/shares/${shareId}`);
  return response.data.data;
}

/**
 * 更新分享设置
 */
export async function updateShare(shareId: string, data: CreateShareRequest): Promise<FileShare> {
  const response = await apiClient.put(`/shares/${shareId}`, data);
  return response.data.data;
}

/**
 * 取消分享
 */
export async function cancelShare(shareId: string): Promise<void> {
  await apiClient.delete(`/shares/${shareId}`);
}

/**
 * 访问分享链接（公开接口，不需要认证）
 */
export async function accessShare(shareCode: string, password?: string): Promise<SharedFile> {
  const params = password ? { password } : {};
  const response = await apiClient.get(`/shares/access/${shareCode}`, { params });
  return response.data.data;
}

/**
 * 生成分享链接
 */
export function getShareUrl(shareCode: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}/share/${shareCode}`;
}
