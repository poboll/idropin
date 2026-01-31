import { apiClient, extractApiError } from './client';
import { ApiResponse } from './auth';

/**
 * 收集任务相关API
 */

export interface CreateTaskRequest {
  title: string;
  description?: string;
  category?: string;
  deadline?: string | null;
  allowAnonymous?: boolean;
  requireLogin?: boolean;
  maxFileSize?: number;
  allowedTypes?: string[];
  maxFileCount?: number; // 最大同时提交文件数量（1-16，默认10）
  taskType?: 'FILE_COLLECTION' | 'INFO_COLLECTION';
  collectionType?: 'INFO' | 'FILE'; // INFO=仅收集信息, FILE=收集文件
}

export interface CollectionTask {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  allowAnonymous: boolean;
  requireLogin: boolean;
  maxFileSize?: number;
  allowedTypes?: string[];
  maxFileCount?: number; // 最大同时提交文件数量（1-16，默认10）
  createdBy: string;
  status: string;
  taskType?: 'FILE_COLLECTION' | 'INFO_COLLECTION';
  collectionType?: 'INFO' | 'FILE'; // INFO=仅收集信息, FILE=收集文件
  createdAt: string;
  updatedAt: string;
}

export interface FileSubmission {
  id: string;
  taskId: string;
  fileId: string;
  submitterId?: string;
  submitterName?: string;
  submitterEmail?: string;
  submittedAt: string;
}

export interface TaskStatistics {
  taskId: string;
  taskTitle: string;
  totalSubmissions: number;
  uniqueSubmitters: number;
  fileTypeDistribution: Record<string, number>;
  recentSubmissions: Array<{
    submissionId: string;
    fileName: string;
    submitterName: string;
    submittedAt: string;
  }>;
}

/**
 * 创建收集任务
 */
export async function createTask(data: CreateTaskRequest): Promise<CollectionTask> {
  const response = await apiClient.post('/tasks', data);
  return response.data.data;
}

/**
 * 获取用户的任务列表
 */
export async function getUserTasks(): Promise<CollectionTask[]> {
  const response = await apiClient.get('/tasks');
  return response.data.data;
}

/**
 * 获取任务详情
 */
export async function getTask(taskId: string): Promise<CollectionTask> {
  const response = await apiClient.get(`/tasks/${taskId}`);
  return response.data.data;
}

/**
 * 更新任务
 */
export async function updateTask(taskId: string, data: CreateTaskRequest): Promise<CollectionTask> {
  const response = await apiClient.put(`/tasks/${taskId}`, data);
  return response.data.data;
}

/**
 * 删除任务
 */
export async function deleteTask(taskId: string): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}`);
}

/**
 * 提交文件到任务
 */
export async function submitFileToTask(
  taskId: string,
  file: File,
  submitterName?: string,
  submitterEmail?: string
): Promise<FileSubmission> {
  const formData = new FormData();
  formData.append('file', file);
  if (submitterName) {
    formData.append('submitterName', submitterName);
  }
  if (submitterEmail) {
    formData.append('submitterEmail', submitterEmail);
  }

  const response = await apiClient.post(`/tasks/${taskId}/submit`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
}

/**
 * 获取任务的提交记录
 */
export async function getTaskSubmissions(taskId: string): Promise<FileSubmission[]> {
  const response = await apiClient.get(`/tasks/${taskId}/submissions`);
  return response.data.data;
}

/**
 * 获取任务统计
 */
export async function getTaskStatistics(taskId: string): Promise<TaskStatistics> {
  const response = await apiClient.get(`/tasks/${taskId}/statistics`);
  return response.data.data;
}

export interface TaskInfo {
  ddl?: string | null;
  tip?: string;
  info?: string;
  people?: boolean;
  format?: string;
  template?: string;
  bindField?: string;
  rewrite?: boolean;
}

export async function getTaskInfo(key: string): Promise<CollectionTask> {
  try {
    const response = await apiClient.get<ApiResponse<CollectionTask>>(`/tasks/${key}/info`);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
}

/**
 * 获取任务基本信息（公开接口，用于收集链接，不需要登录）
 */
export async function getTaskInfoPublic(key: string): Promise<{
  id: string;
  title: string;
  description?: string;
  status: string;
  deadline?: string;
  createdBy: string;
  creatorName?: string;
  creatorAvatarUrl?: string;
  collectionType?: 'INFO' | 'FILE';
}> {
  try {
    const response = await apiClient.get<ApiResponse<any>>(`/tasks/${key}/public-info`);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
}

export async function getTaskMoreInfo(key: string): Promise<TaskInfo> {
  try {
    const response = await apiClient.get<ApiResponse<TaskInfo>>(`/tasks/${key}/more-info`);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
}

/**
 * 获取任务更多信息（公开接口，用于收集链接，不需要登录）
 */
export async function getTaskMoreInfoPublic(key: string): Promise<TaskInfo> {
  try {
    const response = await apiClient.get<ApiResponse<TaskInfo>>(`/tasks/${key}/public-more-info`);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
}

export async function updateTaskMoreInfo(key: string, options: TaskInfo): Promise<void> {
  try {
    await apiClient.post<ApiResponse<void>>(`/tasks/${key}/more-info`, options);
  } catch (error) {
    throw extractApiError(error);
  }
}

export async function getUsefulTemplate(key: string): Promise<any> {
  try {
    const response = await apiClient.get<ApiResponse<any>>(`/tasks/${key}/template`);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
}

export async function delTipImage(key: string, uid: number, name: string): Promise<void> {
  try {
    await apiClient.delete<ApiResponse<void>>(`/tasks/${key}/tip-image`, {
      data: { uid, name }
    });
  } catch (error) {
    throw extractApiError(error);
  }
}
