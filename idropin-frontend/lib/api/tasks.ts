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
  // Back-end CreateTaskRequest has limitOnePerDevice; keep name aligned.
  limitOnePerDevice?: boolean;
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
  category?: string;
  deadline?: string;
  allowAnonymous: boolean;
  requireLogin: boolean;
  limitOnePerDevice?: boolean;
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

// Matches back-end com.idropin.domain.vo.FileSubmissionVO.
export interface FileSubmissionVO {
  id: string;
  taskId: string;
  taskTitle?: string;
  fileId: string;
  submitterId?: string;
  submitterName?: string;
  submitterEmail?: string;
  submittedAt: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileUrl?: string;
  storagePath?: string;
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
 * 获取回收站任务列表
 */
export async function getDeletedTasks(): Promise<CollectionTask[]> {
  const response = await apiClient.get('/tasks/trash');
  return response.data.data;
}

/**
 * 从回收站恢复任务
 */
export async function restoreTask(taskId: string): Promise<void> {
  await apiClient.post(`/tasks/${taskId}/restore`);
}

/**
 * 永久删除回收站中的任务
 */
export async function permanentlyDeleteTask(taskId: string): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}/permanent`);
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
 * 获取用户所有任务的提交记录
 */
export async function getAllUserTaskSubmissions(): Promise<FileSubmissionVO[]> {
  const response = await apiClient.get('/tasks/all-submissions');
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
  autoRename?: boolean;
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

export interface InfoSubmission {
  id: string;
  submitterName: string;
  submitterEmail?: string;
  submittedAt: string;
  infoData: string;
  fileName?: string;
  fileSize?: number;
  status: number;
  createdAt?: string;
  submitterIp?: string;
}

export interface TaskSubmissionsResult {
  submissions: InfoSubmission[];
  count: number;
  taskTitle: string;
  collectionType: 'INFO' | 'FILE';
}

/**
 * 获取任务的信息提交记录（管理员）
 */
export async function getTaskInfoSubmissions(taskId: string): Promise<TaskSubmissionsResult> {
  try {
    const response = await apiClient.get<ApiResponse<TaskSubmissionsResult>>(`/tasks/${taskId}/info-submissions`);
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
}

/**
 * 获取公开提交记录（用于收集页查询提交情况）
 */
export async function getPublicSubmissions(taskId: string, submitterName: string): Promise<TaskSubmissionsResult> {
  try {
    const response = await apiClient.get<ApiResponse<TaskSubmissionsResult>>(`/tasks/${taskId}/public-submissions`, {
      params: { submitterName },
    });
    return response.data.data;
  } catch (error) {
    throw extractApiError(error);
  }
}

/**
 * 撤回提交（公开接口，支持文件/信息收集）
 */
export async function withdrawSubmission(taskId: string, submissionId: string, submitterName: string): Promise<void> {
  try {
    await apiClient.post<ApiResponse<void>>(`/tasks/${taskId}/submissions/${submissionId}/withdraw`, null, {
      params: { submitterName },
    });
  } catch (error) {
    throw extractApiError(error);
  }
}

function getFilenameFromContentDisposition(headerValue: string | undefined): string | null {
  if (!headerValue) return null;

  // Example: attachment; filename="xxx.csv" OR attachment; filename*=UTF-8''%E4%B8%AD%E6%96%87.csv
  const filenameStarMatch = headerValue.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
  if (filenameStarMatch?.[1]) {
    const raw = filenameStarMatch[1].trim().replace(/^"|"$/g, '');
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  const filenameMatch = headerValue.match(/filename=([^;]+)/i);
  if (filenameMatch?.[1]) {
    return filenameMatch[1].trim().replace(/^"|"$/g, '');
  }

  return null;
}

/**
 * 导出信息收集提交记录（后端输出 CSV；format 参数预留）
 */
export async function exportInfoSubmissions(
  taskId: string,
  format: 'csv' | 'excel' = 'csv'
): Promise<void> {
  try {
    const response = await apiClient.get<Blob>(`/tasks/${taskId}/info-submissions/export`, {
      params: { format },
      responseType: 'blob',
    });

    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const filename =
      getFilenameFromContentDisposition((response.headers as any)?.['content-disposition']) ||
      `task_${taskId}_submissions.${format === 'excel' ? 'csv' : format}`;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw extractApiError(error);
  }
}
