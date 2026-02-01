'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  RefreshCw, Globe, Lock, Unlock, AlertCircle, Settings
} from 'lucide-react';
import { 
  getAllRouteConfigs, updateRouteConfig, getRouteDescription,
  RouteConfig
} from '@/lib/api/config';

export default function ConfigManagePage() {
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const data = await getAllRouteConfigs();
      setRoutes(data);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleToggle = async (route: RouteConfig) => {
    setUpdating(route.id);
    try {
      await updateRouteConfig(route.id, { isEnabled: !route.isEnabled });
      setRoutes(routes.map(r => 
        r.id === route.id ? { ...r, isEnabled: !r.isEnabled } : r
      ));
    } catch (error: any) {
      console.error('Failed to update route:', error);
      const errorMessage = error.message || error.response?.data?.message || '更新失败';
      alert(`更新失败: ${errorMessage}`);
    } finally {
      setUpdating(null);
    }
  };

  const getRouteIcon = (routePath: string) => {
    switch (routePath) {
      case '/register':
        return <Globe className="w-5 h-5" />;
      case '/':
        return <Globe className="w-5 h-5" />;
      case '/reset-password':
        return <Lock className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">配置管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理系统路由和功能配置</p>
        </div>
        <button
          onClick={fetchRoutes}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 子导航 */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        <Link href="/dashboard/manage" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">概况</Link>
        <Link href="/dashboard/manage/users" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">用户</Link>
        <Link href="/dashboard/manage/feedback" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">需求</Link>
        <Link href="/dashboard/manage/config" className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg font-medium">配置</Link>
      </div>

      {/* 路由配置 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4" />
            禁用路由管理
          </h2>
          <p className="text-sm text-gray-500 mt-1">控制系统各功能页面的访问权限</p>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : routes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无路由配置</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {routes.map((route) => (
              <div key={route.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    route.isEnabled 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {getRouteIcon(route.routePath)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{route.routeName}</h3>
                      <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400">
                        {route.routePath}
                      </code>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{getRouteDescription(route.routePath)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {!route.isEnabled && (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">已禁用</span>
                    </div>
                  )}
                  
                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggle(route)}
                    disabled={updating === route.id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      route.isEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    } ${updating === route.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        route.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 dark:text-amber-300">注意事项</h4>
            <ul className="mt-1 text-sm text-amber-700 dark:text-amber-400 space-y-1">
              <li>• 禁用注册功能后，新用户将无法注册账号</li>
              <li>• 禁用首页后，未登录用户将被重定向到登录页</li>
              <li>• 禁用找回密码后，用户将无法通过邮箱重置密码</li>
              <li>• 配置更改会立即生效，请谨慎操作</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
