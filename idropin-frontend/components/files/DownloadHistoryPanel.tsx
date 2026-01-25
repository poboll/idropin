'use client';

import { Download, Link as LinkIcon, QrCode, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDate, formatSize } from '@/lib/utils/string';

export enum DownloadStatus {
  SUCCESS = 'success',
  FAIL = 'fail',
  ARCHIVE = 'archive',
  EXPIRED = 'expired',
}

export enum ActionType {
  Compress = 'compress',
  Download = 'download',
}

export interface DownloadAction {
  id: string;
  date: string;
  tip: string;
  type: ActionType;
  status: DownloadStatus;
  size?: number;
  url?: string;
  error?: string;
}

interface DownloadHistoryPanelProps {
  actions: DownloadAction[];
  compressTasks: DownloadAction[];
  pageSize: number;
  pageCount: number;
  pageCurrent: number;
  pageTotal: number;
  onPageChange: (page: number) => void;
  onDownload: (url: string) => void;
  onCopyLink: (url: string) => void;
  onShowQrCode: (url: string) => void;
}

export default function DownloadHistoryPanel({
  actions,
  compressTasks,
  pageSize,
  pageCount,
  pageCurrent,
  pageTotal,
  onPageChange,
  onDownload,
  onCopyLink,
  onShowQrCode,
}: DownloadHistoryPanelProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
      <div className="text-center mb-4">
        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
          ❤️ 下面展示历史的下载记录与归档任务完成情况 ❤️
        </p>
        <p className="text-sm text-orange-500 mt-1">
          再也不需要在页面停留等待归档完成
        </p>
      </div>

      {compressTasks.length > 0 && (
        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <p className="text-orange-600 font-medium mb-2">
            正在进行归档的任务 {compressTasks.length} 个
          </p>
          {compressTasks.map((task, idx) => (
            <div key={task.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>{idx + 1}. {task.tip}</span>
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-gray-700">
              <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">触发时间</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">文件名</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">类型</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">大小</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">操作</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((action) => (
              <tr key={action.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                  {formatDate(new Date(action.date))}
                </td>
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                  {action.tip}
                </td>
                <td className="py-2 px-3">
                  {action.type === ActionType.Compress ? (
                    <span className="text-blue-600">归档下载</span>
                  ) : (
                    <span className="text-gray-500">普通下载</span>
                  )}
                </td>
                <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                  {action.status === DownloadStatus.ARCHIVE ? (
                    <span className="text-red-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      归档中...
                    </span>
                  ) : action.status === DownloadStatus.FAIL ? (
                    <span className="text-red-500">归档失败</span>
                  ) : action.size ? (
                    formatSize(action.size)
                  ) : (
                    '未知大小'
                  )}
                </td>
                <td className="py-2 px-3">
                  {action.status === DownloadStatus.ARCHIVE && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      归档中...
                    </div>
                  )}
                  {action.status === DownloadStatus.EXPIRED && (
                    <span className="text-gray-500">链接已失效</span>
                  )}
                  {action.status === DownloadStatus.FAIL && (
                    <span className="text-red-500 text-xs">
                      联系开发者: {action.error}
                    </span>
                  )}
                  {action.status === DownloadStatus.SUCCESS && action.url && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDownload(action.url!)}
                        className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        下载
                      </button>
                      <button
                        onClick={() => onCopyLink(action.url!)}
                        className="text-green-600 hover:text-green-700 flex items-center gap-1"
                      >
                        <LinkIcon className="w-3 h-3" />
                        链接
                      </button>
                      <button
                        onClick={() => onShowQrCode(action.url!)}
                        className="text-orange-600 hover:text-orange-700 flex items-center gap-1"
                      >
                        <QrCode className="w-3 h-3" />
                        二维码
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <span className="text-sm text-gray-500">共 {pageTotal} 条</span>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 text-sm rounded ${
                  page === pageCurrent
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
