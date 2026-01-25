'use client';

import { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Edit3, Save, X, RefreshCw } from 'lucide-react';

interface RouteConfig {
  path: string;
  name: string;
  title: string;
  disabled: boolean;
}

const allowDisabledRoutes = [
  { path: '/register', name: 'register', title: '注册', hint: '关闭后将同时禁用注册功能' },
  { path: '/login', name: 'login', title: '登录', hint: '' },
  { path: '/reset-password', name: 'reset-password', title: '找回密码', hint: '' },
  { path: '/feedback', name: 'feedback', title: '反馈', hint: '' },
];

export default function ConfigManagePage() {
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [editConfig, setEditConfig] = useState(false);
  const [jsonData, setJsonData] = useState<Record<string, unknown>>({});
  const [editJSON, setEditJSON] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    
    const mockRoutes: RouteConfig[] = allowDisabledRoutes.map((r) => ({
      path: r.path,
      name: r.name,
      title: r.title,
      disabled: r.path === '/feedback',
    }));
    setRoutes(mockRoutes);

    const mockJsonData = {
      site: {
        title: 'Idrop.in - 云集',
        description: '智能文件收集与管理平台',
        keywords: ['文件收集', '文件管理', '云存储'],
        icp: '备案号示例',
      },
      features: {
        maxUploadSize: 104857600,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'png', 'zip'],
        enableSmsLogin: true,
        enableWechatLogin: false,
      },
      storage: {
        provider: 'minio',
        bucket: 'idropin',
        region: 'cn-east-1',
      },
      notification: {
        enableEmail: true,
        enableSms: false,
        smtpHost: 'smtp.example.com',
        smtpPort: 465,
      },
    };
    setJsonData(mockJsonData);
    setIsLoading(false);
  };

  const handleToggleRoute = async (route: RouteConfig) => {
    setRoutes(prev => prev.map(r => 
      r.path === route.path ? { ...r, disabled: !r.disabled } : r
    ));
    alert('切换成功');
  };

  const handleEditConfig = () => {
    setEditConfig(true);
    setEditJSON(JSON.stringify(jsonData, null, 2));
  };

  const handleSaveConfig = async () => {
    try {
      const data = JSON.parse(editJSON);
      setJsonData(data);
      setEditConfig(false);
      alert('保存成功');
    } catch (e) {
      alert('JSON 格式错误');
    }
  };

  const getRouteHint = (path: string) => {
    return allowDisabledRoutes.find(r => r.path === path)?.hint || '';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            禁用路由管理
          </h2>
          <button
            onClick={loadConfig}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
        
        <div className="space-y-3 max-w-lg">
          {routes.map((route) => (
            <div
              key={route.path}
              className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <button
                onClick={() => handleToggleRoute(route)}
                className="flex-shrink-0"
              >
                {route.disabled ? (
                  <ToggleLeft className="w-10 h-6 text-red-500" />
                ) : (
                  <ToggleRight className="w-10 h-6 text-green-500" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 dark:text-white">{route.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${route.disabled ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                    {route.disabled ? '已禁用' : '已启用'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {route.path}
                  {getRouteHint(route.path) && (
                    <span className="text-orange-500 ml-2">{getRouteHint(route.path)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            全局配置管理（JSON）
          </h2>
          <div className="flex gap-2">
            {!editConfig ? (
              <button
                onClick={handleEditConfig}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                <Edit3 className="w-4 h-4" />
                更新
              </button>
            ) : (
              <>
                <button
                  onClick={() => setEditConfig(false)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                  取消
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </>
            )}
          </div>
        </div>

        <div className="max-w-2xl">
          {!editConfig ? (
            <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
              {JSON.stringify(jsonData, null, 2)}
            </pre>
          ) : (
            <textarea
              value={editJSON}
              onChange={(e) => setEditJSON(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
