'use client';

export default function LoadingScreen({ message = "加载中..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm mx-4">
        <div className="flex flex-col items-center">
          {/* 加载动画 */}
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin"></div>
          </div>
          
          {/* 加载文字 */}
          <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
            {message}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            请稍候...
          </p>
        </div>
      </div>
    </div>
  );
}
