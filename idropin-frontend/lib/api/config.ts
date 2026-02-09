import { apiClient } from './client';

export interface RouteConfig {
  id: string;
  routePath: string;
  routeName: string;
  isEnabled: boolean;
  redirectUrl: string | null;
  redirectMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  id: string;
  configKey: string;
  configValue: string;
  configType: string;
  description: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getRouteConfigs(): Promise<RouteConfig[]> {
  const response = await apiClient.get('/config/routes');
  return response.data.data;
}

export async function getAllRouteConfigs(): Promise<RouteConfig[]> {
  const response = await apiClient.get('/config/admin/routes');
  return response.data.data;
}

export async function updateRouteConfig(id: string, data: {
  isEnabled?: boolean;
  redirectUrl?: string;
  redirectMessage?: string;
}): Promise<void> {
  await apiClient.put(`/config/admin/routes/${id}`, data);
}

export async function getAllSystemConfigs(): Promise<SystemConfig[]> {
  const response = await apiClient.get('/config/admin/system');
  return response.data.data;
}

export async function getSystemConfigValue(key: string): Promise<string | null> {
  const response = await apiClient.get(`/config/system/${key}`);
  return response.data.data;
}

export async function updateSystemConfig(id: string, value: string): Promise<void> {
  await apiClient.put(`/config/admin/system/${id}`, { value });
}

export async function toggleSystemConfig(id: string, enabled: boolean): Promise<void> {
  await apiClient.put(`/config/admin/system/${id}/toggle`, { enabled });
}

export interface StorageInfo {
  storageType: string;
  localPath: string;
  localBaseUrl: string;
  minioEndpoint: string;
  minioBucket: string;
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const response = await apiClient.get('/config/admin/storage-info');
  return response.data.data;
}

export function getRouteDisplayName(routePath: string): string {
  const nameMap: Record<string, string> = {
    '/register': '用户注册',
    '/': '首页',
    '/reset-password': '找回密码'
  };
  return nameMap[routePath] || routePath;
}

export function getRouteDescription(routePath: string): string {
  const descMap: Record<string, string> = {
    '/register': '关闭后将同时禁用注册功能',
    '/': '关闭后用户将无法访问首页',
    '/reset-password': '关闭后用户将无法找回密码'
  };
  return descMap[routePath] || '';
}
