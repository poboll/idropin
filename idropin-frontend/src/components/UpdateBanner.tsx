import { usePWA } from '@/src/hooks/usePWA';
import { Download, X } from 'lucide-react';

export default function UpdateBanner() {
  const { hasUpdate, updateApp } = usePWA();

  if (!hasUpdate) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-green-600 text-white px-4 py-3 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          <span className="font-medium">
            新版本可用，点击更新以获取最新功能
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={updateApp}
            className="px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
          >
            立即更新
          </button>
        </div>
      </div>
    </div>
  );
}
