import apiClient from '../api/client';

let cachedStorageType: string | null = null;

export async function getStorageType(): Promise<string> {
  if (cachedStorageType) return cachedStorageType;
  
  try {
    const response = await apiClient.get('/config/admin/storage-info');
    cachedStorageType = response.data.data.storageType;
    return cachedStorageType ?? 'local';
  } catch (error) {
    console.warn('Failed to fetch storage type, defaulting to local:', error);
    return 'local';
  }
}

export async function isMinioMode(): Promise<boolean> {
  const type = await getStorageType();
  return type === 'minio';
}

export function clearStorageTypeCache(): void {
  cachedStorageType = null;
}
