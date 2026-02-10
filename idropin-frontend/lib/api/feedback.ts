import { apiClient } from './client';

export interface Feedback {
  id: string;
  userId: string;
  username: string;
  title: string;
  content: string;
  contact: string | null;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackReply {
  id: string;
  feedbackId: string;
  userId: string;
  username: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface FeedbackDetail extends Feedback {
  replies: FeedbackReply[];
}

export interface FeedbackPage {
  records: Feedback[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/**
 * 用户提交反馈
 */
export async function submitFeedback(data: {
  title: string;
  content: string;
  contact?: string;
}): Promise<Feedback> {
  const response = await apiClient.post('/feedback', data);
  return response.data.data;
}

/**
 * 获取用户自己的反馈列表
 */
export async function getMyFeedback(params: {
  page?: number;
  size?: number;
}): Promise<FeedbackPage> {
  const response = await apiClient.get('/feedback/my', { params });
  return response.data.data;
}

/**
 * 获取反馈详情（包含回复）
 */
export async function getFeedbackDetail(id: string): Promise<FeedbackDetail> {
  const response = await apiClient.get(`/feedback/${id}`);
  return response.data.data;
}

/**
 * 管理员获取所有反馈
 */
export async function getAllFeedback(params: {
  status?: string;
  keyword?: string;
  page?: number;
  size?: number;
}): Promise<FeedbackPage> {
  const response = await apiClient.get('/feedback/admin/list', { params });
  return response.data.data;
}

/**
 * 管理员回复反馈
 */
export async function replyFeedback(id: string, content: string): Promise<FeedbackReply> {
  const response = await apiClient.post(`/feedback/${id}/reply`, { content });
  return response.data.data;
}

/**
 * 管理员更新反馈状态
 */
export async function updateFeedbackStatus(id: string, status: string): Promise<void> {
  await apiClient.put(`/feedback/${id}/status`, { status });
}

export async function deleteFeedback(id: string): Promise<void> {
  await apiClient.delete(`/feedback/${id}`);
}

export async function editFeedback(id: string, data: {
  title: string;
  content: string;
  contact?: string;
}): Promise<void> {
  await apiClient.put(`/feedback/${id}`, data);
}

/**
 * 获取状态显示文本
 */
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    in_progress: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  };
  return statusMap[status] || status;
}

/**
 * 获取状态样式类
 */
export function getStatusClass(status: string): string {
  const classMap: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    in_progress: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
  };
  return classMap[status] || '';
}
