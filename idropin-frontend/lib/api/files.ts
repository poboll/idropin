import apiClient, { extractApiError } from './client';
import type { ApiResponse } from './auth';

// 文件类型
export interface FileItem {
  id: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  categoryId?: string;
  tags?: string[];
  uploaderId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  url?: string;
}

// 文件上传结果
export interface FileUploadResult {
  fileId: string;
  fileName: string;
  fileUrl: string;
  success: boolean;
  errorMessage?: string;
}

// 分页响应
export interface PageResponse<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 文件查询参数
export interface FileQueryParams {
  page?: number;
  size?: number;
  categoryId?: string;
  keyword?: string;
  mimeType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 文件更新请求
export interface FileUpdateRequest {
  originalName?: string;
  categoryId?: string;
  tags?: string[];
}

/**
 * 上传单个文件
 */
export const uploadFile = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<FileItem> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post<ApiResponse<FileItem>>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(percent);
        }
      },
    });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 批量上传文件
 */
export const uploadFiles = async (
  files: File[],
  onProgress?: (percent: number) => void
): Promise<FileUploadResult[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  try {
    const response = await apiClient.post<ApiResponse<FileUploadResult[]>>(
      '/files/upload/batch',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            onProgress(percent);
          }
        },
      }
    );
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 获取文件列表
 */
export const getFiles = async (params: FileQueryParams = {}): Promise<PageResponse<FileItem>> => {
  try {
    const response = await apiClient.get<ApiResponse<PageResponse<FileItem>>>('/files', { params });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 获取文件详情
 */
export const getFile = async (id: string): Promise<FileItem> => {
  try {
    const response = await apiClient.get<ApiResponse<FileItem>>(`/files/${id}`);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 更新文件信息
 */
export const updateFile = async (id: string, data: FileUpdateRequest): Promise<FileItem> => {
  try {
    const response = await apiClient.put<ApiResponse<FileItem>>(`/files/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 删除文件
 */
export const deleteFile = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/files/${id}`);
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 批量删除文件
 */
export const deleteFiles = async (ids: string[]): Promise<void> => {
  try {
    await apiClient.delete('/files/batch', { data: ids });
  } catch (error) {
    throw extractApiError(error);
  }
};

/**
 * 获取文件下载URL
 */
export const getDownloadUrl = (id: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  return `${baseUrl}/files/${id}/download`;
};

/**
 * 获取文件预览URL
 */
export const getPreviewUrl = (id: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  return `${baseUrl}/files/${id}/preview`;
};

export interface AddFileOptions {
  name: string;
  hash: string;
  size: number;
  key: string;
  qiniuHash?: string;
  qiniuKey?: string;
  info?: any;
  peopleName?: string;
}

export interface WithdrawOptions {
  key: string;
  id: number;
  filename: string;
}

export const getUploadToken = async (): Promise<string> => {
  try {
    const response = await apiClient.get<ApiResponse<string>>('/files/upload/token');
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

export const addFile = async (options: AddFileOptions): Promise<{ submissionId: number; fileName: string }> => {
  try {
    const response = await apiClient.post<ApiResponse<{ submissionId: number; fileName: string }>>('/files/add', options);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

export const getTemplateUrl = (template: string, key: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  return `${baseUrl}/files/template?template=${template}&key=${key}`;
};

export const batchDownload = async (ids: number[], zipName?: string): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>('/files/batch-download', { ids, zipName });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

export const checkCompressStatus = async (id: string): Promise<any> => {
  try {
    const response = await apiClient.get<ApiResponse<any>>(`/files/compress-status/${id}`);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

export const withdrawFile = async (options: WithdrawOptions): Promise<void> => {
  try {
    await apiClient.post<ApiResponse<void>>('/files/withdraw', options);
  } catch (error) {
    throw extractApiError(error);
  }
};

export const checkSubmitStatus = async (taskKey: string, info: any, name?: string): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>('/files/check-submit', {
      taskKey,
      info,
      name
    });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

export const checkImageFilePreviewUrl = async (ids: number[]): Promise<any> => {
  try {
    const response = await apiClient.post<ApiResponse<any>>('/files/image-previews', { ids });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
};

export const fileDownloadCount = async (ids: number[]): Promise<void> => {
  try {
    await apiClient.post<ApiResponse<void>>('/files/download-count', { ids });
  } catch (error) {
    throw extractApiError(error);
  }
};

export const updateFilename = async (id: number, newName: string): Promise<void> => {
  try {
    await apiClient.put<ApiResponse<void>>(`/files/${id}/filename`, { newName });
  } catch (error) {
    throw extractApiError(error);
  }
};

