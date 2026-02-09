'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  RefreshCw, Globe, Lock, AlertCircle, Settings, Database, Save, X, Cloud, HardDrive
} from 'lucide-react';
import { 
  getAllRouteConfigs, updateRouteConfig, getRouteDescription,
  getAllSystemConfigs, updateSystemConfig, toggleSystemConfig,
  getStorageInfo, StorageInfo,
  RouteConfig, SystemConfig
} from '@/lib/api/config';
import { getOverviewStats, OverviewStats } from '@/lib/api/admin';
import { formatBytes } from '@/lib/utils';
import { extractApiError } from '@/lib/api/client';

export default function ConfigManagePage() {
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activeTab, setActiveTab] = useState<'routes' | 'system' | 'quota'>('routes');
  const [fetchError, setFetchError] = useState<{ code: number; message: string } | null>(null);
  const [storageType, setStorageType] = useState<'local' | 'oss' | 'minio'>('local');
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  const isQuotaNumberConfig = (config: SystemConfig) =>
    config.configType === 'number' && /quota|limit/i.test(config.configKey);

  const matchKeywords = (key: string, keywords: string[]) => {
    const lower = key.toLowerCase();
    return keywords.some((keyword) => lower.includes(keyword));
  };

  const renderConfigRow = (config: SystemConfig) => (
    <div key={config.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 dark:text-white">{config.description || config.configKey}</h3>
          <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400">
            {config.configKey}
          </code>
          <span className={`px-2 py-0.5 rounded text-xs ${
            config.isEnabled 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {getConfigTypeLabel(config.configType)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {editingConfig?.id === config.id ? (
            <div className="flex items-center gap-3 w-full max-w-md">
              {config.configType === 'number' ? (
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={isQuotaNumberConfig(config) ? 10240 : (Number(editValue) > 1000 ? Number(editValue) * 2 : 10000)}
                    step={isQuotaNumberConfig(config) ? 1 : (Number(editValue) > 1000 ? 100 : 1)}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-gray-900 dark:accent-white"
                  />
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-24 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-right"
                  />
                  {isQuotaNumberConfig(config) && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">MB</span>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500"
                />
              )}
              <button
                onClick={handleSaveConfig}
                disabled={updating === config.id}
                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingConfig(null)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleEditConfig(config)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-900 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              {isQuotaNumberConfig(config)
                ? `${Math.round(Number(config.configValue) / 1048576)} MB`
                : (config.configValue || '(未设置)')
              }
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => handleConfigToggle(config)}
          disabled={updating === config.id}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
            config.isEnabled ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
          } ${updating === config.id ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full ${config.isEnabled ? 'bg-white dark:bg-gray-900' : 'bg-white'} transition-transform ${
              config.isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );

  const categorizeConfigs = () => {
    let remaining = [...systemConfigs];

    const storageConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['storage', 'bucket', 'oss', 'minio']));
    remaining = remaining.filter((config) => !storageConfigs.includes(config));

    const databaseConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['database', 'datasource', 'jdbc', 'db', 'postgres', 'mysql']));
    remaining = remaining.filter((config) => !databaseConfigs.includes(config));

    const urlConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['url', 'host', 'domain', 'endpoint']));
    remaining = remaining.filter((config) => !urlConfigs.includes(config));

    return { storageConfigs, databaseConfigs, urlConfigs, otherConfigs: remaining };
  };

  const renderSection = (title: string, icon: JSX.Element, configs: SystemConfig[], hint?: string) => {
    if (configs.length === 0) return null;

    return (
      <div className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <div className="px-5 py-4 flex items-center gap-2">
          <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">{icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            {hint && <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {configs.map(renderConfigRow)}
        </div>
      </div>
    );
  };

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [routeData, configData, statsData] = await Promise.all([
        getAllRouteConfigs(),
        getAllSystemConfigs(),
        getOverviewStats(),
      ]);
      setRoutes(routeData);
      setSystemConfigs(configData);
      setOverviewStats(statsData);

      try {
        const storageData = await getStorageInfo();
        setStorageInfo(storageData);
        if (storageData?.storageType) {
          setStorageType(storageData.storageType as 'local' | 'oss' | 'minio');
        }
      } catch {
        console.warn('Storage info endpoint unavailable');
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
      const apiError = extractApiError(error);
      setFetchError(apiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRouteToggle = async (route: RouteConfig) => {
    setUpdating(route.id);
    try {
      await updateRouteConfig(route.id, { isEnabled: !route.isEnabled });
      setRoutes(routes.map(r => 
        r.id === route.id ? { ...r, isEnabled: !r.isEnabled } : r
      ));
    } catch (error: any) {
      console.error('Failed to update route:', error);
      alert(`更新失败: ${error.message || '未知错误'}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleConfigToggle = async (config: SystemConfig) => {
    setUpdating(config.id);
    try {
      await toggleSystemConfig(config.id, !config.isEnabled);
      setSystemConfigs(systemConfigs.map(c => 
        c.id === config.id ? { ...c, isEnabled: !c.isEnabled } : c
      ));
    } catch (error: any) {
      console.error('Failed to toggle config:', error);
      alert(`更新失败: ${error.message || '未知错误'}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleEditConfig = (config: SystemConfig) => {
    setEditingConfig(config);
    if (isQuotaNumberConfig(config)) {
      setEditValue(String(Math.round(Number(config.configValue) / 1048576)));
    } else {
      setEditValue(config.configValue);
    }
  };

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    setUpdating(editingConfig.id);
    try {
      const saveValue = isQuotaNumberConfig(editingConfig)
        ? String(Number(editValue) * 1048576)
        : editValue;
      await updateSystemConfig(editingConfig.id, saveValue);
      setSystemConfigs(systemConfigs.map(c => 
        c.id === editingConfig.id ? { ...c, configValue: saveValue } : c
      ));
      setEditingConfig(null);
    } catch (error: any) {
      console.error('Failed to save config:', error);
      alert(`保存失败: ${error.message || '未知错误'}`);
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

  const getConfigTypeLabel = (type: string) => {
    switch (type) {
      case 'string': return '文本';
      case 'number': return '数字';
      case 'boolean': return '布尔';
      case 'json': return 'JSON';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {fetchError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 dark:text-red-300">加载配置失败</h4>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                {fetchError.code === 401 && '未登录或登录已过期，请重新登录'}
                {fetchError.code === 403 && '您没有访问配置的权限，请联系管理员'}
                {fetchError.code !== 401 && fetchError.code !== 403 && fetchError.message}
              </p>
              <button
                onClick={fetchData}
                className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">配置管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理系统路由和功能配置</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        <Link href="/dashboard/manage" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">概况</Link>
        <Link href="/dashboard/manage/users" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">用户</Link>
        <Link href="/dashboard/manage/feedback" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">需求</Link>
        <Link href="/dashboard/manage/config" className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg font-medium">配置</Link>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'routes'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Lock className="w-4 h-4 inline-block mr-2" />
          路由配置
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'system'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Database className="w-4 h-4 inline-block mr-2" />
          系统配置
        </button>
        <button
          onClick={() => setActiveTab('quota')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'quota'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <HardDrive className="w-4 h-4 inline-block mr-2" />
          空间限额
        </button>
      </div>

      {activeTab === 'routes' && (
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
              <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
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
                    
                    <button
                      onClick={() => handleRouteToggle(route)}
                      disabled={updating === route.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                        route.isEnabled ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
                      } ${updating === route.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full ${route.isEnabled ? 'bg-white dark:bg-gray-900' : 'bg-white'} transition-transform ${
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
      )}

      {activeTab === 'system' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4" />
              系统参数配置
            </h2>
            <p className="text-sm text-gray-500 mt-1">管理系统全局参数设置</p>
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
            </div>
          ) : systemConfigs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无系统配置</div>
          ) : (
            (() => {
              const { storageConfigs, databaseConfigs, urlConfigs, otherConfigs } = categorizeConfigs();

              const localStorageItems = storageConfigs.filter(c => !matchKeywords(c.configKey, ['oss', 'minio']));
              const ossItems = storageConfigs.filter(c => matchKeywords(c.configKey, ['oss']));
              const minioItems = storageConfigs.filter(c => matchKeywords(c.configKey, ['minio']));

              const storageSegments = [
                { key: 'local' as const, label: '本地存储', items: localStorageItems },
                { key: 'oss' as const, label: 'OSS', items: ossItems },
                { key: 'minio' as const, label: 'MinIO', items: minioItems },
              ];
              const activeSegment = storageSegments.find(s => s.key === storageType) || storageSegments[0];

              return (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"><Cloud className="w-4 h-4" /></span>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">存储配置</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">对象存储、OSS、MinIO 等相关参数</p>
                      </div>
                    </div>
                    <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      {storageSegments.map((seg) => (
                        <button
                          key={seg.key}
                          onClick={() => setStorageType(seg.key)}
                          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                            storageType === seg.key
                              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          {seg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {activeSegment.items.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {activeSegment.items.map(renderConfigRow)}
                    </div>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      {activeSegment.key === 'local' ? (
                        <div className="space-y-3">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
                            <HardDrive className="w-4 h-4" />
                            {storageInfo?.storageType === 'local' ? '当前正在使用本地存储' : '本地存储未启用'}
                          </div>
                          {storageInfo && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">存储类型</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{storageInfo.storageType}</p>
                              </div>
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">已用空间</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatBytes(overviewStats?.ossStorageBytes || 0)}</p>
                              </div>
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg col-span-full">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">存储路径</p>
                                <code className="text-sm font-mono text-gray-900 dark:text-white">{storageInfo.localPath || './uploads'}</code>
                              </div>
                              {storageInfo.localBaseUrl && (
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg col-span-full">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">访问地址</p>
                                  <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{storageInfo.localBaseUrl}</code>
                                </div>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            如需切换到OSS或MinIO，请修改后端 application.yml 中的 storage.type 配置
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            当前未启用{activeSegment.label}存储
                          </p>
                          {activeSegment.key === 'minio' && storageInfo?.minioEndpoint && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">MinIO 端点</p>
                                <code className="text-sm font-mono text-gray-900 dark:text-white">{storageInfo.minioEndpoint}</code>
                              </div>
                              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">存储桶</p>
                                <code className="text-sm font-mono text-gray-900 dark:text-white">{storageInfo.minioBucket}</code>
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            如需使用{activeSegment.label}，请在后端 application.yml 中配置 <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-900 rounded text-xs">storage.type={activeSegment.key}</code> 并添加相关连接参数
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {renderSection('数据库配置', <Database className="w-4 h-4" />, databaseConfigs, '数据库连接与数据源设置')}
                  {renderSection('URL / 域名配置', <Globe className="w-4 h-4" />, urlConfigs, '外部访问地址、回调、域名等')}
                  {renderSection('其他配置', <Settings className="w-4 h-4" />, otherConfigs, '未归类的系统参数')}
                </div>
              );
            })()
          )}
        </div>
      )}

      {activeTab === 'quota' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              空间限额配置
            </h2>
            <p className="text-sm text-gray-500 mt-1">管理系统存储配额与用户限制</p>
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* 系统存储概况 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">总存储使用</span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {overviewStats ? formatBytes(overviewStats.ossStorageBytes) : '0 B'}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">总用户数</span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {overviewStats?.userCount || 0}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">文件总数</span>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {overviewStats?.recordCount || 0}
                  </p>
                </div>
              </div>

              {/* 配额配置项 */}
              {(() => {
                const quotaConfigs = systemConfigs.filter((c) =>
                  matchKeywords(c.configKey, ['quota', 'limit'])
                );
                if (quotaConfigs.length > 0) {
                  return (
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-4">配额参数</h3>
                      <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
                        {quotaConfigs.map(renderConfigRow)}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">配额管理说明</h3>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                    <p><strong className="text-gray-900 dark:text-white">用户存储配额：</strong>在用户管理页面可为每个用户单独设置存储空间限制</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                    <p><strong className="text-gray-900 dark:text-white">任务数量限制：</strong>可限制单个用户创建的收集任务数量上限</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                    <p><strong className="text-gray-900 dark:text-white">系统总容量：</strong>需在系统配置中设置 <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-900 rounded text-xs">system.storage.total.limit</code> 参数</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                    <p><strong className="text-gray-900 dark:text-white">默认用户配额：</strong>在系统配置中设置 <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-900 rounded text-xs">user.default.storage.limit</code> 作为新用户默认配额</p>
                  </div>
                </div>
              </div>

              {/* 快速跳转 */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                <div className="flex flex-wrap gap-3">
                  <Link 
                    href="/dashboard/manage/users" 
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    前往用户管理 →
                  </Link>
                  <button 
                    onClick={() => setActiveTab('system')}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    查看系统配置 →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 dark:text-amber-300">注意事项</h4>
            <ul className="mt-1 text-sm text-amber-700 dark:text-amber-400 space-y-1">
              <li>• 禁用注册功能后，新用户将无法注册账号</li>
              <li>• 禁用首页后，未登录用户将被重定向到登录页</li>
              <li>• 系统配置更改会立即生效，请谨慎操作</li>
              <li>• 回收站自动清理天数设为0表示不自动清理</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
