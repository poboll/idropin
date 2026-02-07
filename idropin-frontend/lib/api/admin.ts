import { apiClient } from './client';

export interface OverviewStats {
  userCount: number;
  activeUserCount: number;
  userCountYesterday: number;
  recordCount: number;
  recordCountYesterday: number;
  ossStorageBytes: number;
  logCount: number;
  logCountYesterday: number;
  pvCount: number;
  uvCount: number;
  historyPvCount: number;
  historyUvCount: number;
  archivedFileCount: number;
  archivedFileSize: number;
  invalidFileCount: number;
  invalidFileSize: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  status: string;
  role: string;
  storageUsed: number;
  storageLimit: number;
  taskCount: number;
  taskLimit: number;
  createdAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
}

export interface AdminUserPage {
  records: AdminUser[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface OperationLog {
  id: string;
  operatorId: string;
  operatorName: string;
  operationType: string;
  targetType: string | null;
  targetId: string | null;
  description: string;
  ipAddress: string;
  createdAt: string;
}

export interface OperationLogPage {
  records: OperationLog[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/**
 * 获取平台概况统计
 */
export async function getOverviewStats(): Promise<OverviewStats> {
  const response = await apiClient.get('/admin/overview');
  return response.data.data;
}

/**
 * 获取用户列表
 */
export async function getUsers(params: {
  keyword?: string;
  status?: string;
  page?: number;
  size?: number;
}): Promise<AdminUserPage> {
  const response = await apiClient.get('/admin/users', { params });
  return response.data.data;
}

/**
 * 修改用户状态
 */
export async function updateUserStatus(userId: string, status: string): Promise<void> {
  await apiClient.put(`/admin/users/${userId}/status`, { status });
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(userId: string): Promise<string> {
  const response = await apiClient.post(`/admin/users/${userId}/reset-password`);
  return response.data.data;
}

/**
 * 绑定用户手机号
 */
export async function bindUserPhone(userId: string, phone: string): Promise<void> {
  await apiClient.put(`/admin/users/${userId}/phone`, { phone });
}

/**
 * 发送消息给用户
 */
export async function sendMessageToUser(userId: string, title: string, content: string): Promise<void> {
  await apiClient.post(`/admin/users/${userId}/message`, { title, content });
}

/**
 * 修改用户配额
 */
export async function updateUserQuota(userId: string, storageLimit?: number, taskLimit?: number): Promise<void> {
  await apiClient.put(`/admin/users/${userId}/quota`, { storageLimit, taskLimit });
}

/**
 * 强制用户下线
 */
export async function forceUserLogout(userId: string): Promise<void> {
  await apiClient.post(`/admin/users/${userId}/force-logout`);
}

/**
 * 推送全局消息
 */
export async function broadcastMessage(title: string, content: string): Promise<void> {
  await apiClient.post('/admin/broadcast-message', { title, content });
}

/**
 * 更新用户角色
 */
export async function updateUserRole(userId: string, role: string): Promise<void> {
  await apiClient.put(`/admin/users/${userId}/role`, { role });
}

/**
 * 获取操作日志
 */
export async function getOperationLogs(params: {
  page?: number;
  size?: number;
}): Promise<OperationLogPage> {
  const response = await apiClient.get('/admin/operation-logs', { params });
  return response.data.data;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
