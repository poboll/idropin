'use client';

import { useState } from 'react';
import { ChevronDown, Download, Trash2, FileSpreadsheet, RefreshCw } from 'lucide-react';

interface FileBatchActionsProps {
  selectedCount: number;
  onBatchDownload: () => void;
  onBatchDelete: () => void;
  onExportExcel: () => void;
  onExportAll: () => void;
  onRefresh: () => void;
  showImages: boolean;
  onShowImagesChange: (show: boolean) => void;
  showOriginName: boolean;
  onShowOriginNameChange: (show: boolean) => void;
  showPeople: boolean;
  onShowPeopleChange: (show: boolean) => void;
  showHistory: boolean;
  onShowHistoryChange: (show: boolean) => void;
  isDownloading?: boolean;
  hasFilteredData?: boolean;
}

export default function FileBatchActions({
  selectedCount,
  onBatchDownload,
  onBatchDelete,
  onExportExcel,
  onExportAll,
  onRefresh,
  showImages,
  onShowImagesChange,
  showOriginName,
  onShowOriginNameChange,
  showPeople,
  onShowPeopleChange,
  showHistory,
  onShowHistoryChange,
  isDownloading = false,
  hasFilteredData = false,
}: FileBatchActionsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="card p-4 mb-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="btn-primary btn-sm flex items-center gap-1.5"
          >
            批量操作
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg z-20 min-w-[130px] overflow-hidden">
                <button
                  onClick={() => { onBatchDownload(); setIsDropdownOpen(false); }}
                  disabled={selectedCount === 0 || isDownloading}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4" />
                  下载
                </button>
                <button
                  onClick={() => { onBatchDelete(); setIsDropdownOpen(false); }}
                  disabled={selectedCount === 0}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
                <button
                  onClick={() => { onExportExcel(); setIsDropdownOpen(false); }}
                  disabled={selectedCount === 0}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  导出记录
                </button>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onRefresh}
          className="btn-secondary btn-sm flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          刷新
        </button>

        <button
          onClick={onExportAll}
          disabled={!hasFilteredData}
          className="btn-secondary btn-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          导出全部
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {[
          { label: '图片', value: showImages, onChange: onShowImagesChange },
          { label: '原文件名', value: showOriginName, onChange: onShowOriginNameChange },
          { label: '提交人', value: showPeople, onChange: onShowPeopleChange },
          { label: '下载历史', value: showHistory, onChange: onShowHistoryChange },
        ].map(({ label, value, onChange }) => (
          <button
            key={label}
            onClick={() => onChange(!value)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              value
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {selectedCount > 0 && (
        <div className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          已选择 {selectedCount} 个文件
        </div>
      )}
    </div>
  );
}
