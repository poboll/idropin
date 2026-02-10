import { usePWA } from '@/src/hooks/usePWA';
import { WifiOff, RefreshCw, X } from 'lucide-react';

export default function OfflineBanner() {
  const { isOnline, offlineUploads, syncOfflineUploads } = usePWA();

  if (isOnline && offlineUploads.length === 0) {
    return null;
  }

  return (
    <>
      {/* 离线状态提示 */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-3 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="h-5 w-5" />
              <span className="font-medium">
                您当前处于离线状态，部分功能可能无法使用
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 离线上传提示 */}
      {isOnline && offlineUploads.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span className="font-medium">
                {offlineUploads.length} 个文件等待同步
              </span>
            </div>
            <button
              onClick={syncOfflineUploads}
              className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 transition-colors"
            >
              立即同步
            </button>
          </div>
        </div>
      )}

      {/* 调整页面内容，避免被遮挡 */}
      {!isOnline && (
        <div className="h-14" />
      )}
      {isOnline && offlineUploads.length > 0 && (
        <div className="h-14" />
      )}
    </>
  );
}
