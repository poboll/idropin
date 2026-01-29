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

/**
 * 获取路由配置（公开接口，用于前端判断）
 */
export async function getRouteConfigs(): Promise<RouteConfig[]> {
  const response = await apiClient.get('/api/config/routes');
  return response.data.data;
}

/**
 * 管理员获取所有配置
 */
export async function getAllRouteConfigs(): Promise<RouteConfig[]> {
  const response = await apiClient.get('/api/config/admin/routes');
  return response.data.data;
}

/**
 * 管理员更新路由配置
 */
export async function updateRouteConfig(id: string, data: {
  isEnabled?: boolean;
  redirectUrl?: string;
  redirectMessage?: string;
}): Promise<void> {
  await apiClient.put(`/api/config/admin/routes/${id}`, data);
}

/**
 * 获取路由显示名称
 */
export function getRouteDisplayName(routePath: string): string {
  const nameMap: Record<string, string> = {
    '/register': '用户注册',
    '/': '首页',
    '/reset-password': '找回密码'
  };
  return nameMap[routePath] || routePath;
}

/**
 * 获取路由描述
 */
export function getRouteDescription(routePath: string): string {
  const descMap: Record<string, string> = {
    '/register': '关闭后将同时禁用注册功能',
    '/': '关闭后用户将无法访问首页',
    '/reset-password': '关闭后用户将无法找回密码'
  };
  return descMap[routePath] || '';
}
