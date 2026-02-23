'use client';

import { useState } from 'react';
import { AlertCircle, Cloud, HardDrive, Database, Save, Wifi, Server } from 'lucide-react';
import { StorageInfo, saveStorageConfig, testStorageConnection } from '@/lib/api/config';
import { StorageStatistics } from '@/lib/api/admin';
import { formatBytes } from '@/lib/utils';
import { extractApiError } from '@/lib/api/client';

type OssVendor = 'tencent' | 'aliyun' | 'qiniu' | 'huawei' | 'aws' | 'google' | 'azure' | 'custom';

interface StorageConfigTabProps {
  storageInfo: StorageInfo | null;
  storageStats: StorageStatistics | null;
  storageType: 'local' | 'oss' | 'minio' | 's3' | 'nas';
  setStorageType: (v: 'local' | 'oss' | 'minio' | 's3' | 'nas') => void;
  ossVendor: OssVendor;
  setOssVendor: (v: OssVendor) => void;
  ossConfig: { endpoint: string; bucket: string; region: string; accessKeyId: string; accessKeySecret: string; domain: string };
  setOssConfig: (v: any) => void;
  minioConfig: { endpoint: string; bucket: string; accessKey: string; secretKey: string; domain: string };
  setMinioConfig: (v: any) => void;
  localConfig: { path: string; baseUrl: string };
  setLocalConfig: (v: any) => void;
  s3Config?: { endpoint: string; bucket: string; region: string; accessKey: string; secretKey: string };
  setS3Config?: (v: any) => void;
  nasConfig?: { path: string; baseUrl: string };
  setNasConfig?: (v: any) => void;
}

const VENDOR_NAMES: Record<OssVendor, string> = {
  tencent: '腾讯云 COS', aliyun: '阿里云 OSS', qiniu: '七牛云 Kodo', huawei: '华为云 OBS',
  aws: 'AWS S3', google: 'Google Cloud Storage', azure: 'Azure Blob', custom: '自定义',
};

const OSS_VENDORS: { key: OssVendor; label: string }[] = [
  { key: 'aliyun', label: '阿里云 OSS' }, { key: 'tencent', label: '腾讯云 COS' },
  { key: 'qiniu', label: '七牛云 Kodo' }, { key: 'huawei', label: '华为云 OBS' },
  { key: 'aws', label: 'AWS S3' }, { key: 'google', label: 'Google Cloud' },
  { key: 'azure', label: 'Azure Blob' }, { key: 'custom', label: '自定义' },
];

const REGION_HINTS: Record<string, string> = {
  aliyun: '示例: cn-hangzhou, cn-beijing, cn-shanghai',
  tencent: '示例: ap-guangzhou, ap-beijing, ap-shanghai',
  qiniu: '示例: z0 (华东), z1 (华北), z2 (华南)',
  huawei: '示例: cn-north-4, cn-east-3, cn-south-1',
  aws: '示例: us-east-1, us-west-2, ap-northeast-1',
  google: '示例: us-central1, asia-east1, europe-west1',
  azure: '示例: eastus, westus, eastasia',
};

const REGION_PLACEHOLDERS: Record<string, string> = {
  aliyun: 'cn-hangzhou', tencent: 'ap-guangzhou', qiniu: 'z0',
  huawei: 'cn-north-4', aws: 'us-east-1', google: 'us-central1', azure: 'eastus',
};

export default function StorageConfigTab(props: StorageConfigTabProps) {
  const {
    storageInfo, storageStats, storageType, setStorageType,
    ossVendor, setOssVendor, ossConfig, setOssConfig,
    minioConfig, setMinioConfig, localConfig, setLocalConfig,
    s3Config, setS3Config, nasConfig, setNasConfig,
  } = props;

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      const msg = await testStorageConnection();
      setTestMsg({ ok: true, text: msg });
    } catch (err: unknown) {
      const apiError = extractApiError(err);
      setTestMsg({ ok: false, text: apiError.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      let configMap: Record<string, string> = {};
      if (storageType === 'local') {
        configMap = {
          'storage.type': 'local',
          'storage.local.path': localConfig.path,
          'storage.local.base-url': localConfig.baseUrl,
        };
      } else if (storageType === 'minio') {
        configMap = {
          'storage.type': 'minio',
          'storage.minio.endpoint': minioConfig.endpoint,
          'storage.minio.accessKey': minioConfig.accessKey,
          'storage.minio.secretKey': minioConfig.secretKey,
          'storage.minio.bucket': minioConfig.bucket,
        };
      } else if (storageType === 'oss' && ossVendor === 'qiniu') {
        configMap = {
          'storage.type': 'qiniu',
          'storage.qiniu.accessKey': ossConfig.accessKeyId,
          'storage.qiniu.secretKey': ossConfig.accessKeySecret,
          'storage.qiniu.bucket': ossConfig.bucket,
          'storage.qiniu.domain': ossConfig.domain,
          'storage.qiniu.region': ossConfig.region || 'as0',
        };
      } else if (storageType === 's3') {
        const cfg = s3Config ?? { endpoint: '', bucket: '', region: 'us-east-1', accessKey: '', secretKey: '' };
        configMap = {
          'storage.type': 's3',
          'storage.s3.endpoint': cfg.endpoint,
          'storage.s3.accessKey': cfg.accessKey,
          'storage.s3.secretKey': cfg.secretKey,
          'storage.s3.bucket': cfg.bucket,
          'storage.s3.region': cfg.region,
          'storage.s3.pathStyle': 'true',
        };
      } else if (storageType === 'nas') {
        const nas = nasConfig ?? { path: '/vol1/shares/idropin', baseUrl: '' };
        configMap = {
          'storage.type': 'nas',
          'storage.nas.path': nas.path,
          'storage.nas.base-url': nas.baseUrl,
        };
      } else {
        setSaveMsg({ ok: false, text: '当前仅支持本地存储、MinIO 和七牛云，其他 OSS 暂不支持直接保存' });
        setSaving(false);
        return;
      }
      await saveStorageConfig(configMap);
      setSaveMsg({ ok: true, text: '存储配置已保存并立即生效，无需重启' });
    } catch {
      setSaveMsg({ ok: false, text: '保存失败，请检查配置后重试' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const vendorBtnCls = (active: boolean) =>
    `px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
      active
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
    }`;
  const typeBtnCls = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-md transition-all ${
      active
        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
    }`;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Cloud className="w-4 h-4" />
          存储配置
        </h2>
        <p className="text-sm text-gray-500 mt-1">配置文件存储服务（本地存储 / 对象存储 / MinIO）</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="px-5 py-8 text-center bg-gray-50 dark:bg-gray-800 rounded-xl">
          {storageInfo?.storageType === 'local' && (
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
                <HardDrive className="w-4 h-4" />
                当前正在使用本地存储
              </div>
              {storageStats?.storageUsage && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <HardDrive className="w-5 h-5" />
                      存储使用情况
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">已使用</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatBytes(storageStats.storageUsage.used)}
                        </span>
                      </div>
                      <div className="relative">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              storageStats.storageUsage.percentage >= 90 ? 'bg-red-500'
                              : storageStats.storageUsage.percentage >= 80 ? 'bg-yellow-500'
                              : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(storageStats.storageUsage.percentage, 100)}%` }}
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                            {storageStats.storageUsage.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">总容量</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatBytes(storageStats.storageUsage.total)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">剩余空间</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatBytes(storageStats.storageUsage.remaining)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">存储路径</p>
                  <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{storageInfo.localPath || './uploads'}</code>
                </div>
                {storageInfo.localBaseUrl && (
                  <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">访问地址</p>
                    <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{storageInfo.localBaseUrl}</code>
                  </div>
                )}
              </div>
            </div>
          )}
          {storageInfo?.storageType === 'minio' && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium">
                <Database className="w-4 h-4" />
                当前正在使用 MinIO 存储
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
                <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">MinIO 端点</p>
                  <code className="text-sm font-mono text-gray-900 dark:text-white">{storageInfo.minioEndpoint}</code>
                </div>
                <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">存储桶</p>
                  <code className="text-sm font-mono text-gray-900 dark:text-white">{storageInfo.minioBucket}</code>
                </div>
              </div>
            </div>
          )}
          {storageInfo?.storageType === 'qiniu' && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-medium">
                <Cloud className="w-4 h-4" />
                当前正在使用七牛云 Kodo
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
                <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">存储桶</p>
                  <code className="text-sm font-mono text-gray-900 dark:text-white">{storageInfo.qiniuBucket || '-'}</code>
                </div>
                <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">访问域名</p>
                  <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{storageInfo.qiniuDomain || '-'}</code>
                </div>
              </div>
            </div>
          )}
          {storageInfo?.storageType === 's3' && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium">
                <Cloud className="w-4 h-4" />
                当前正在使用 S3 兼容存储
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
                <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">接入点</p>
                  <code className="text-sm font-mono text-gray-900 dark:text-white break-all block">{storageInfo.s3Endpoint || '-'}</code>
                </div>
                <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">存储桶</p>
                  <code className="text-sm font-mono text-gray-900 dark:text-white break-all block">{storageInfo.s3Bucket || '-'}</code>
                </div>
                <div className="p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Access Key</p>
                  <code className="text-sm font-mono text-gray-900 dark:text-white break-all block">{storageInfo.s3AccessKey || '-'}</code>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs">
                Secret Key {storageInfo.s3SecretKeyConfigured ? '已配置 ✓' : '未配置'}
              </div>
            </div>
          )}
          {storageInfo?.storageType === 'nas' && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg text-sm font-medium">
                <Server className="w-4 h-4" />
                当前正在使用 NAS 本地存储
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">NAS 存储路径</p>
                  <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{storageInfo.nasPath || '/vol1/shares/idropin'}</code>
                </div>
                {storageInfo.nasBaseUrl && (
                  <div className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">访问地址</p>
                    <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{storageInfo.nasBaseUrl}</code>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">选择存储类型</h3>
            <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <button onClick={() => setStorageType('local')} className={typeBtnCls(storageType === 'local')}>
                <HardDrive className="w-4 h-4 inline mr-1.5" />本地存储
                {storageInfo?.storageType === 'local' && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />}
              </button>
              <button onClick={() => setStorageType('oss')} className={typeBtnCls(storageType === 'oss')}>
                <Cloud className="w-4 h-4 inline mr-1.5" />对象存储 OSS
                {storageInfo?.storageType === 'qiniu' && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />}
              </button>
              <button onClick={() => setStorageType('minio')} className={typeBtnCls(storageType === 'minio')}>
                <Database className="w-4 h-4 inline mr-1.5" />MinIO
                {storageInfo?.storageType === 'minio' && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />}
              </button>
              <button onClick={() => setStorageType('s3')} className={typeBtnCls(storageType === 's3')}>
                <Cloud className="w-4 h-4 inline mr-1.5" />S3 兼容
                {storageInfo?.storageType === 's3' && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />}
              </button>
              <button onClick={() => setStorageType('nas')} className={typeBtnCls(storageType === 'nas')}>
                <Server className="w-4 h-4 inline mr-1.5" />NAS 存储
                {storageInfo?.storageType === 'nas' && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />}
              </button>
            </div>
          </div>

          {storageType === 'local' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">本地存储配置</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">存储路径 *</label>
                <input type="text" value={localConfig.path} onChange={e => setLocalConfig({ ...localConfig, path: e.target.value })} placeholder="./uploads" className={inputCls} />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">文件存储的本地路径，相对路径或绝对路径</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">访问地址 *</label>
                <input type="text" value={localConfig.baseUrl} onChange={e => setLocalConfig({ ...localConfig, baseUrl: e.target.value })} placeholder="http://localhost:8081/api/files/download" className={inputCls} />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">文件下载的 HTTP 访问地址</p>
              </div>
            </div>
          )}

          {storageType === 'oss' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">对象存储 OSS 配置</h3>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">选择云服务商</label>
                <div className="grid grid-cols-4 gap-3">
                  {OSS_VENDORS.map(v => (
                    <button key={v.key} type="button" onClick={() => setOssVendor(v.key)} className={vendorBtnCls(ossVendor === v.key)}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4 mb-6">
                {ossVendor !== 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">地域 (Region) *</label>
                    <input type="text" value={ossConfig.region} onChange={e => setOssConfig({ ...ossConfig, region: e.target.value })} placeholder={REGION_PLACEHOLDERS[ossVendor] || 'cn-hangzhou'} className={inputCls} />
                    {REGION_HINTS[ossVendor] && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{REGION_HINTS[ossVendor]}</p>}
                  </div>
                )}
                {ossVendor === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endpoint *</label>
                    <input type="text" value={ossConfig.endpoint} onChange={e => setOssConfig({ ...ossConfig, endpoint: e.target.value })} placeholder="https://oss.example.com" className={inputCls} />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bucket 名称 *</label>
                  <input type="text" value={ossConfig.bucket} onChange={e => setOssConfig({ ...ossConfig, bucket: e.target.value })} placeholder="my-bucket" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Access Key ID *</label>
                    <input type="text" value={ossConfig.accessKeyId} onChange={e => setOssConfig({ ...ossConfig, accessKeyId: e.target.value })} placeholder="AKID..." className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Access Key Secret *</label>
                    <input type="password" value={ossConfig.accessKeySecret} onChange={e => setOssConfig({ ...ossConfig, accessKeySecret: e.target.value })} placeholder="••••••••" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">自定义域名 (可选)</label>
                  <input type="text" value={ossConfig.domain} onChange={e => setOssConfig({ ...ossConfig, domain: e.target.value })} placeholder="https://cdn.example.com" className={inputCls} />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">如果配置了 CDN 加速域名，请在此填写</p>
                </div>
              </div>
            </div>
          )}

          {storageType === 'minio' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">MinIO 配置</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endpoint *</label>
                <input type="text" value={minioConfig.endpoint} onChange={e => setMinioConfig({ ...minioConfig, endpoint: e.target.value })} placeholder="http://localhost:9000" className={inputCls} />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">MinIO 服务器地址，支持自定义服务器</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bucket 名称 *</label>
                <input type="text" value={minioConfig.bucket} onChange={e => setMinioConfig({ ...minioConfig, bucket: e.target.value })} placeholder="idropin-files" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Access Key *</label>
                  <input type="text" value={minioConfig.accessKey} onChange={e => setMinioConfig({ ...minioConfig, accessKey: e.target.value })} placeholder="minioadmin" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secret Key *</label>
                  <input type="password" value={minioConfig.secretKey} onChange={e => setMinioConfig({ ...minioConfig, secretKey: e.target.value })} placeholder="••••••••" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">自定义域名 (可选)</label>
                <input type="text" value={minioConfig.domain} onChange={e => setMinioConfig({ ...minioConfig, domain: e.target.value })} placeholder="https://minio.example.com" className={inputCls} />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">如果配置了自定义域名，请在此填写</p>
              </div>
            </div>
          )}

          {storageType === 's3' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">S3 兼容存储配置</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">适用于中国科技云数据胶囊（CSTCloud）及其他 S3 兼容存储，使用 Path-Style 模式 + v4 签名</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">接入点 (Endpoint) *</label>
                <input type="text" value={s3Config?.endpoint ?? ''} onChange={e => setS3Config?.({ ...s3Config, endpoint: e.target.value })} placeholder="https://s3.cstcloud.cn" className={inputCls} />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">CSTCloud 固定值：https://s3.cstcloud.cn</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bucket 名称 *</label>
                <input type="text" value={s3Config?.bucket ?? ''} onChange={e => setS3Config?.({ ...s3Config, bucket: e.target.value })} placeholder="31a3623c9c2f4ff1b85cc8e2717f851d" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">区域 (Region)</label>
                <input type="text" value={s3Config?.region ?? 'us-east-1'} onChange={e => setS3Config?.({ ...s3Config, region: e.target.value })} placeholder="us-east-1" className={inputCls} />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">CSTCloud 固定值：us-east-1</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Access Key ID *</label>
                  <input type="text" value={s3Config?.accessKey ?? ''} onChange={e => setS3Config?.({ ...s3Config, accessKey: e.target.value })} placeholder="AKIA..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secret Access Key *</label>
                  <input type="password" value={s3Config?.secretKey ?? ''} onChange={e => setS3Config?.({ ...s3Config, secretKey: e.target.value })} placeholder="••••••••" className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {storageType === 'nas' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">NAS 存储配置</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">适用于飞牛（FnOS）等 NAS 设备的本地文件系统存储，支持通过环境变量指定路径</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">NAS 存储路径 *</label>
                <input
                  type="text"
                  value={nasConfig?.path ?? '/vol1/shares/idropin'}
                  onChange={e => setNasConfig?.({ ...nasConfig, path: e.target.value })}
                  placeholder="/vol1/shares/idropin"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">飞牛 NAS 默认共享路径，也可通过环境变量 <code className="font-mono">STORAGE_NAS_PATH</code> 覆盖</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">访问地址 *</label>
                <input
                  type="text"
                  value={nasConfig?.baseUrl ?? ''}
                  onChange={e => setNasConfig?.({ ...nasConfig, baseUrl: e.target.value })}
                  placeholder="http://your-nas-ip:8081/api/files/download"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">文件下载的 HTTP 访问地址，应指向 NAS 的内网地址</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存并立即生效'}
            </button>
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Wifi className="w-4 h-4" />
              {testing ? '测试中...' : '连接测试'}
            </button>
            {saveMsg && (
              <span className={`text-sm flex items-center gap-1.5 ${saveMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {!saveMsg.ok && <AlertCircle className="w-4 h-4" />}
                {saveMsg.text}
              </span>
            )}
            {testMsg && (
              <span className={`text-sm flex items-center gap-1.5 ${testMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {!testMsg.ok && <AlertCircle className="w-4 h-4" />}
                {testMsg.text}
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">官方文档</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: 'https://help.aliyun.com/product/31815.html', label: '阿里云 OSS 文档' },
              { href: 'https://cloud.tencent.com/document/product/436', label: '腾讯云 COS 文档' },
              { href: 'https://developer.qiniu.com/kodo', label: '七牛云 Kodo 文档' },
            ].map(doc => (
              <a key={doc.href} href={doc.href} target="_blank" rel="noopener noreferrer"
                className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-center"
              >
                {doc.label} &rarr;
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
