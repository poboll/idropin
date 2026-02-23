'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  RefreshCw, Globe, Lock, AlertCircle, Settings, Database, Save, X, Cloud, HardDrive, Copy,
  Shield, Upload, Share2, CheckSquare, Mail, Monitor, ShieldAlert, Cpu, Search, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  getAllRouteConfigs, updateRouteConfig, getRouteDescription,
  getAllSystemConfigs, updateSystemConfig, toggleSystemConfig,
  getStorageInfo, StorageInfo, refreshEmailCache,
  backupConfigs, restoreConfigs,
  RouteConfig, SystemConfig
} from '@/lib/api/config';
import { getOverviewStats, OverviewStats, getStorageStatistics, StorageStatistics } from '@/lib/api/admin';
import { formatBytes } from '@/lib/utils';
import { extractApiError } from '@/lib/api/client';
import dynamic from 'next/dynamic';

const AiConfigTab = dynamic(() => import('@/components/config/AiConfigTab'), { ssr: false });
const StorageConfigTab = dynamic(() => import('@/components/config/StorageConfigTab'), { ssr: false });

export default function ConfigManagePage() {
  const [routes, setRoutes] = useState<RouteConfig[]>([]);
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activeTab, setActiveTab] = useState<'routes' | 'system' | 'quota' | 'storage' | 'ai'>('routes');
  const [fetchError, setFetchError] = useState<{ code: number; message: string } | null>(null);
  const [storageType, setStorageType] = useState<'local' | 'oss' | 'minio' | 's3' | 'nas'>('local');
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [ossVendor, setOssVendor] = useState<'tencent' | 'aliyun' | 'qiniu' | 'huawei' | 'aws' | 'google' | 'azure' | 'custom'>('aliyun');
  const [ossConfig, setOssConfig] = useState({
    endpoint: '',
    bucket: '',
    region: '',
    accessKeyId: '',
    accessKeySecret: '',
    domain: ''
  });
  const [minioConfig, setMinioConfig] = useState({
    endpoint: 'http://localhost:9000',
    bucket: 'idropin-files',
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
    domain: ''
  });
  const [s3Config, setS3Config] = useState({
    endpoint: '',
    bucket: '',
    region: 'us-east-1',
    accessKey: '',
    secretKey: '',
  });
  const [localConfig, setLocalConfig] = useState({
    path: './uploads',
    baseUrl: 'http://localhost:8081/api/files/download'
  });
  const [nasConfig, setNasConfig] = useState({
    path: '/vol1/shares/idropin',
    baseUrl: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['auth', 'upload', 'share', 'task', 'email', 'website', 'ratelimit', 'sys', 'database', 'url', 'other']));
  const [refreshingEmailCache, setRefreshingEmailCache] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [restoring, setRestoring] = useState(false);

  const isQuotaNumberConfig = (config: SystemConfig) =>
    config.configType === 'number' && /quota|limit/i.test(config.configKey);

  const matchKeywords = (key: string, keywords: string[]) => {
    const lower = key.toLowerCase();
    return keywords.some((keyword) => lower.includes(keyword));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'boolean': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'number': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'password':
      case 'secret': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const renderConfigRow = (config: SystemConfig) => (
    <div key={config.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border-l-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white">{config.description || config.configKey}</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(config.configType)}`}>
              {getConfigTypeLabel(config.configType)}
            </span>
            {!config.isEnabled && (
              <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                已禁用
              </span>
            )}
          </div>
          <code className="text-xs text-gray-500 dark:text-gray-400 font-mono">{config.configKey}</code>
          
          <div className="mt-3">
            {editingConfig?.id === config.id ? (
              <div className="flex items-center gap-2">
                {config.configType === 'number' ? (
                  <div className="flex-1 flex items-center gap-3 max-w-md">
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
                      className="w-24 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-right font-mono"
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
                    className="flex-1 max-w-md px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 font-mono"
                  />
                )}
                <button
                  onClick={handleSaveConfig}
                  disabled={updating === config.id}
                  className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingConfig(null)}
                  className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleEditConfig(config)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-mono"
              >
                {isQuotaNumberConfig(config)
                  ? `${Math.round(Number(config.configValue) / 1048576)} MB`
                  : (config.configValue || '(未设置)')
                }
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => handleConfigToggle(config)}
          disabled={updating === config.id}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex-shrink-0 ${
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
    let remaining: SystemConfig[] = [...systemConfigs];

    const storageConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['storage', 'bucket', 'oss', 'minio']));
    remaining = remaining.filter((config) => !storageConfigs.includes(config));

    const databaseConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['database', 'datasource', 'jdbc', 'db', 'postgres', 'mysql']));
    remaining = remaining.filter((config) => !databaseConfigs.includes(config));

    const urlConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['url', 'host', 'domain', 'endpoint']));
    remaining = remaining.filter((config) => !urlConfigs.includes(config));

    const authConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['auth', 'jwt', 'password', 'login', 'session', 'two.factor']));
    remaining = remaining.filter((config) => !authConfigs.includes(config));

    const uploadConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['upload', 'chunk', 'concurrent', 'filename', 'allowed.types', 'forbidden']));
    remaining = remaining.filter((config) => !uploadConfigs.includes(config));

    const quotaConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['quota', 'limit', 'retention', 'recycle', 'cleanup', 'threshold']));
    remaining = remaining.filter((config) => !quotaConfigs.includes(config));

    const shareConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['share', 'expiry', 'download', 'anonymous']));
    remaining = remaining.filter((config) => !shareConfigs.includes(config));

    const taskConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['task', 'deadline', 'resubmit']));
    remaining = remaining.filter((config) => !taskConfigs.includes(config));

    const emailConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['email', 'smtp', 'notification', 'template']));
    remaining = remaining.filter((config) => !emailConfigs.includes(config));

    const websiteConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['website', 'icp', 'police', 'contact', 'support', 'announcement']));
    remaining = remaining.filter((config) => !websiteConfigs.includes(config));

    const ratelimitConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['ratelimit', 'captcha', 'blacklist', 'whitelist']));
    remaining = remaining.filter((config) => !ratelimitConfigs.includes(config));

    const sysConfigs = remaining.filter((config) => matchKeywords(config.configKey, ['system', 'jvm', 'concurrency', 'thread', 'connection']));
    remaining = remaining.filter((config) => !sysConfigs.includes(config));

    return { 
      storageConfigs, 
      databaseConfigs, 
      urlConfigs, 
      authConfigs,
      uploadConfigs,
      quotaConfigs,
      shareConfigs,
      taskConfigs,
      emailConfigs,
      websiteConfigs,
      ratelimitConfigs,
      sysConfigs,
      otherConfigs: remaining 
    };
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const sectionAccent: Record<string, string> = {
    auth: 'border-l-red-500', upload: 'border-l-blue-500', share: 'border-l-green-500',
    task: 'border-l-purple-500', email: 'border-l-yellow-500', website: 'border-l-indigo-500',
    ratelimit: 'border-l-orange-500', sys: 'border-l-pink-500', database: 'border-l-gray-500',
    url: 'border-l-teal-500', other: 'border-l-gray-400',
  };

  const renderSection = (sectionId: string, title: string, icon: JSX.Element, configs: SystemConfig[], hint?: string) => {
    if (configs.length === 0) return null;

    const isCollapsed = collapsedSections.has(sectionId);
    const accent = sectionAccent[sectionId] || 'border-l-gray-400';

    return (
      <div className={`border-b border-gray-100 dark:border-gray-700 last:border-b-0 border-l-4 ${accent}`}>
        <button
          onClick={() => toggleSection(sectionId)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">{icon}</span>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {title}
                <span className="text-xs font-normal px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{configs.length}</span>
              </h3>
              {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</p>}
            </div>
          </div>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </button>
        {!isCollapsed && (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {configs.map(renderConfigRow)}
          </div>
        )}
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
          const t = storageData.storageType;
          if (t === 'qiniu') {
            setStorageType('oss');
            setOssVendor('qiniu');
            setOssConfig({
              endpoint: '',
              bucket: storageData.qiniuBucket || '',
              region: storageData.qiniuRegion || 'as0',
              accessKeyId: storageData.qiniuAccessKey || '',
              accessKeySecret: '',
              domain: storageData.qiniuDomain || '',
            });
          } else if (t === 'nas') {
            setStorageType('nas');
            setNasConfig({
              path: storageData.nasPath || '/vol1/shares/idropin',
              baseUrl: storageData.nasBaseUrl || '',
            });
          } else {
            setStorageType(t as 'local' | 'oss' | 'minio' | 's3');
            if (t === 's3') {
              setS3Config({
                endpoint: storageData.s3Endpoint || '',
                bucket: storageData.s3Bucket || '',
                region: storageData.s3Region || 'us-east-1',
                accessKey: storageData.s3AccessKey || '',
                secretKey: '',
              });
            }
          }
        }
      } catch {
        console.warn('Storage info endpoint unavailable');
      }

      try {
        const storageStatsData = await getStorageStatistics();
        setStorageStats(storageStatsData);
      } catch {
        console.warn('Storage statistics endpoint unavailable');
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

  const handleRefreshEmailCache = async () => {
    setRefreshingEmailCache(true);
    try {
      await refreshEmailCache();
      alert('邮件配置缓存已刷新，新配置将立即生效');
    } catch (error: any) {
      console.error('Failed to refresh email cache:', error);
      alert(`刷新失败: ${error.message || '未知错误'}`);
    } finally {
      setRefreshingEmailCache(false);
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
    <div className="space-y-6 page-enter">
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
      
      <div className="page-header animate-slide-in-down flex items-center justify-between">
        <div>
          <h1 className="page-title">配置管理</h1>
          <p className="page-description">管理系统路由和功能配置</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'system' && (
            <button
              onClick={handleRefreshEmailCache}
              disabled={refreshingEmailCache}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-4 h-4" />
              {refreshingEmailCache ? '刷新中...' : '刷新邮件缓存'}
            </button>
          )}
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
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
        <button
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'storage'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Cloud className="w-4 h-4 inline-block mr-2" />
          存储配置
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'ai'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <Cpu className="w-4 h-4 inline-block mr-2" />
          AI 配置
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
            
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索配置项名称或 key..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {!searchQuery && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setCollapsedSections(new Set())}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                >
                  全部展开
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={() => {
                    const allSections = new Set(['auth', 'upload', 'share', 'task', 'email', 'website', 'ratelimit', 'sys', 'database', 'url', 'other']);
                    setCollapsedSections(allSections);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                >
                  全部折叠
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
            </div>
          ) : systemConfigs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无系统配置</div>
          ) : (
            (() => {
              const { 
                databaseConfigs, 
                urlConfigs, 
                authConfigs,
                uploadConfigs,
                shareConfigs,
                taskConfigs,
                emailConfigs,
                websiteConfigs,
                ratelimitConfigs,
                sysConfigs,
                otherConfigs 
              } = categorizeConfigs();

              const filterConfigs = (configs: SystemConfig[]) => {
                if (!searchQuery) return configs;
                const query = searchQuery.toLowerCase();
                return configs.filter(config => 
                  config.configKey.toLowerCase().includes(query) ||
                  (config.description && config.description.toLowerCase().includes(query))
                );
              };

              const filteredAuthConfigs = filterConfigs(authConfigs);
              const filteredUploadConfigs = filterConfigs(uploadConfigs);
              const filteredShareConfigs = filterConfigs(shareConfigs);
              const filteredTaskConfigs = filterConfigs(taskConfigs);
              const filteredEmailConfigs = filterConfigs(emailConfigs);
              const filteredWebsiteConfigs = filterConfigs(websiteConfigs);
              const filteredRatelimitConfigs = filterConfigs(ratelimitConfigs);
              const filteredSysConfigs = filterConfigs(sysConfigs);
              const filteredDatabaseConfigs = filterConfigs(databaseConfigs);
              const filteredUrlConfigs = filterConfigs(urlConfigs);
              const filteredOtherConfigs = filterConfigs(otherConfigs);

              const totalResults = filteredAuthConfigs.length + filteredUploadConfigs.length + 
                filteredShareConfigs.length + filteredTaskConfigs.length + filteredEmailConfigs.length +
                filteredWebsiteConfigs.length + filteredRatelimitConfigs.length + filteredSysConfigs.length +
                filteredDatabaseConfigs.length + filteredUrlConfigs.length + filteredOtherConfigs.length;

              if (searchQuery && totalResults === 0) {
                return (
                  <div className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">未找到匹配的配置项</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      清除搜索
                    </button>
                  </div>
                );
              }

              return (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {searchQuery && totalResults > 0 && (
                    <div className="px-5 py-3 bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-300">
                      找到 {totalResults} 个匹配的配置项
                    </div>
                  )}
                  {renderSection('auth', '🔐 安全与认证配置', <Shield className="w-4 h-4 text-red-600" />, filteredAuthConfigs, 'JWT、密码策略、登录安全等配置')}
                  {renderSection('upload', '📤 文件上传配置', <Upload className="w-4 h-4 text-blue-600" />, filteredUploadConfigs, '文件大小、类型、分片上传等配置')}
                  {renderSection('share', '🔗 分享功能配置', <Share2 className="w-4 h-4 text-green-600" />, filteredShareConfigs, '分享链接、过期时间、下载限制等')}
                  {renderSection('task', '📋 收集任务配置', <CheckSquare className="w-4 h-4 text-purple-600" />, filteredTaskConfigs, '任务数量、过期时间、提交限制等')}
                  {renderSection('email', '📧 邮件通知配置', <Mail className="w-4 h-4 text-yellow-600" />, filteredEmailConfigs, 'SMTP服务器、发件人、通知频率等')}
                  {renderSection('website', '🌐 网站基础配置', <Monitor className="w-4 h-4 text-indigo-600" />, filteredWebsiteConfigs, '网站名称、Logo、备案信息等')}
                  {renderSection('ratelimit', '🛡️ 限流与防护配置', <ShieldAlert className="w-4 h-4 text-orange-600" />, filteredRatelimitConfigs, 'API频率限制、验证码、IP黑白名单等')}
                  {renderSection('sys', '⚙️ 系统性能配置', <Cpu className="w-4 h-4 text-pink-600" />, filteredSysConfigs, 'JVM内存、并发模式、线程池等')}
                  {renderSection('database', '💾 数据库配置', <Database className="w-4 h-4 text-gray-600" />, filteredDatabaseConfigs, '数据库连接与数据源设置')}
                  {renderSection('url', '🌍 URL / 域名配置', <Globe className="w-4 h-4 text-teal-600" />, filteredUrlConfigs, '外部访问地址、回调、域名等')}
                  {filteredOtherConfigs.length > 0 && renderSection('other', '🔧 其他配置', <Settings className="w-4 h-4 text-gray-600" />, filteredOtherConfigs, '未归类的系统参数')}
                </div>
              );
            })()
          )}
        </div>
      )}

      {activeTab === 'system' && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Save className="w-4 h-4" />
              配置备份与恢复
            </h2>
            <p className="text-sm text-gray-500 mt-1">导出所有系统配置为 JSON 文件，或从备份文件恢复</p>
          </div>
          <div className="p-5 flex flex-wrap items-center gap-3">
            <button
              onClick={async () => {
                setBackupMsg(null);
                try {
                  const configs = await backupConfigs();
                  const map: Record<string, string> = {};
                  configs.forEach(c => { map[c.configKey] = c.configValue; });
                  const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `idropin-config-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setBackupMsg({ ok: true, text: '备份已下载' });
                } catch {
                  setBackupMsg({ ok: false, text: '备份失败' });
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Save className="w-4 h-4" />
              导出备份
            </button>
            <label className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${restoring ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-4 h-4" />
              {restoring ? '恢复中...' : '从文件恢复'}
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  e.target.value = '';
                  setBackupMsg(null);
                  if (!confirm('确定要从此备份文件恢复配置吗？当前配置将被覆盖。')) return;
                  setRestoring(true);
                  try {
                    const text = await file.text();
                    const map = JSON.parse(text) as Record<string, string>;
                    await restoreConfigs(map);
                    setBackupMsg({ ok: true, text: '配置已恢复并生效' });
                  } catch {
                    setBackupMsg({ ok: false, text: '恢复失败，请检查文件格式' });
                  } finally {
                    setRestoring(false);
                  }
                }}
              />
            </label>
            {backupMsg && (
              <span className={`text-sm ${backupMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {backupMsg.text}
              </span>
            )}
          </div>
        </div>
      )}

      {activeTab === 'quota' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">总存储使用</span>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {overviewStats ? formatBytes(overviewStats.ossStorageBytes) : '0 B'}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">注册用户数</span>
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Database className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{overviewStats?.userCount || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">文件总数</span>
                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Cloud className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{overviewStats?.recordCount || 0}</p>
                </div>
              </div>

              {(() => {
                const quotaConfigs = systemConfigs.filter((c) =>
                  matchKeywords(c.configKey, ['quota', 'limit'])
                );
                if (quotaConfigs.length === 0) return null;
                return (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <HardDrive className="w-4 h-4" />
                          配额参数
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">点击数值可直接编辑</p>
                      </div>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quotaConfigs.map((config) => (
                        <div key={config.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-sm">{config.description || config.configKey}</p>
                              <code className="text-xs text-gray-400 font-mono">{config.configKey}</code>
                            </div>
                            {!config.isEnabled && (
                              <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex-shrink-0">已禁用</span>
                            )}
                          </div>
                          {editingConfig?.id === config.id ? (
                            <div className="space-y-2">
                              {isQuotaNumberConfig(config) && (
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {[
                                    { label: '512M', mb: 512 },
                                    { label: '1G', mb: 1024 },
                                    { label: '2G', mb: 2048 },
                                    { label: '5G', mb: 5120 },
                                    { label: '10G', mb: 10240 },
                                  ].map(({ label, mb }) => (
                                    <button
                                      key={label}
                                      onClick={() => setEditValue(String(mb))}
                                      className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all ${
                                        editValue === String(mb)
                                          ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {/task.*limit|limit.*task/i.test(config.configKey) && (
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {[5, 10, 20, 50, 100].map(v => (
                                    <button
                                      key={v}
                                      onClick={() => setEditValue(String(v))}
                                      className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-all ${
                                        editValue === String(v)
                                          ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                                      }`}
                                    >
                                      {v}个
                                    </button>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max={isQuotaNumberConfig(config) ? 10240 : (Number(editValue) > 1000 ? Number(editValue) * 2 : 10000)}
                                  step={isQuotaNumberConfig(config) ? 1 : 1}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-gray-900 dark:accent-white"
                                />
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-right font-mono"
                                />
                                {isQuotaNumberConfig(config) && <span className="text-xs text-gray-500">MB</span>}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSaveConfig}
                                  disabled={updating === config.id}
                                  className="flex-1 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                  保存
                                </button>
                                <button
                                  onClick={() => setEditingConfig(null)}
                                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditConfig(config)}
                              className="w-full text-left px-3 py-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {isQuotaNumberConfig(config)
                                  ? `${Math.round(Number(config.configValue) / 1048576)} MB`
                                  : (config.configValue || '(未设置)')}
                              </span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 快速跳转 */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/manage/users"
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  前往用户管理 →
                </Link>
                <button
                  onClick={() => setActiveTab('system')}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  查看系统配置 →
                </button>
              </div>
            </>
          )}
        </div>
      )}


      {activeTab === 'storage' && (
        <StorageConfigTab
          storageInfo={storageInfo}
          storageStats={storageStats}
          storageType={storageType}
          setStorageType={setStorageType}
          ossVendor={ossVendor}
          setOssVendor={setOssVendor}
          ossConfig={ossConfig}
          setOssConfig={setOssConfig}
          minioConfig={minioConfig}
          setMinioConfig={setMinioConfig}
          s3Config={s3Config}
          setS3Config={setS3Config}
          localConfig={localConfig}
          setLocalConfig={setLocalConfig}
          nasConfig={nasConfig}
          setNasConfig={setNasConfig}
        />
      )}

      {activeTab === 'ai' && <AiConfigTab />}

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
