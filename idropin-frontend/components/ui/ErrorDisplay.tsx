'use client';

import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

/**
 * Vercel风格的错误展示组件
 * 用于替代alert弹窗，提供更好的用户体验
 */
export default function ErrorDisplay({
  title = '出错了',
  message,
  details,
  onRetry,
  showHomeButton = false,
}: ErrorDisplayProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* 错误图标 */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
          </div>
        </div>

        {/* 错误标题 */}
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-3">
          {title}
        </h1>

        {/* 错误消息 */}
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          {message}
        </p>

        {/* 错误详情（可选） */}
        {details && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-500 font-mono break-all">
              {details}
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          )}
          {showHomeButton && (
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              返回首页
            </Link>
          )}
        </div>

        {/* 帮助文本 */}
        <p className="mt-6 text-xs text-gray-500 dark:text-gray-500 text-center">
          如果问题持续存在，请联系技术支持
        </p>
      </div>
    </div>
  );
}

/**
 * 内联错误提示组件（用于表单等场景）
 */
export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg">
      <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
    </div>
  );
}

/**
 * Toast风格的错误提示（自动消失）
 */
export function ErrorToast({ 
  message, 
  onClose 
}: { 
  message: string; 
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg max-w-md">
        <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            操作失败
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Toast风格的成功提示（自动消失）
 */
export function SuccessToast({ 
  message,
  details,
  onClose 
}: { 
  message: string;
  details?: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg max-w-md">
        <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {message}
          </p>
          {details && (
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {details}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
