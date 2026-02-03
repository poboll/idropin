import { apiClient } from './client';

export interface Message {
  id: string;
  title: string;
  content: string;
  senderType: 'admin' | 'system';
  senderName: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface MessagePage {
  records: Message[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/**
 * 获取消息列表
 */
export async function getMessages(params: {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}): Promise<MessagePage> {
  const response = await apiClient.get('/messages', { params });
  return response.data.data;
}

/**
 * 获取未读消息数量
 */
export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get('/messages/unread-count');
  return response.data.data;
}

/**
 * 标记消息为已读
 */
export async function markAsRead(messageId: string): Promise<void> {
  await apiClient.put(`/messages/${messageId}/read`);
}

/**
 * 标记所有消息为已读
 */
export async function markAllAsRead(): Promise<void> {
  await apiClient.put('/messages/read-all');
}

/**
 * 删除消息
 */
export async function deleteMessage(messageId: string): Promise<void> {
  await apiClient.delete(`/messages/${messageId}`);
}
