'use client';

import { useState } from 'react';
import { ChevronDown, Download, Trash2, FileSpreadsheet, RefreshCw, Image, Eye, Clock } from 'lucide-react';

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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            批量操作
            <ChevronDown className="w-4 h-4" />
          </button>
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)} 
              />
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-20 min-w-[120px]">
                <button
                  onClick={() => { onBatchDownload(); setIsDropdownOpen(false); }}
                  disabled={selectedCount === 0 || isDownloading}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  下载
                </button>
                <button
                  onClick={() => { onBatchDelete(); setIsDropdownOpen(false); }}
                  disabled={selectedCount === 0}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
                <button
                  onClick={() => { onExportExcel(); setIsDropdownOpen(false); }}
                  disabled={selectedCount === 0}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>

        <button
          onClick={onExportAll}
          disabled={!hasFilteredData}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet className="w-4 h-4" />
          导出记录
        </button>

        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-600 dark:text-gray-400">显示图片</span>
          <button
            onClick={() => onShowImagesChange(!showImages)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              showImages ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              showImages ? 'left-5' : 'left-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-600 dark:text-gray-400">原文件名</span>
          <button
            onClick={() => onShowOriginNameChange(!showOriginName)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              showOriginName ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              showOriginName ? 'left-5' : 'left-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-600 dark:text-gray-400">提交人</span>
          <button
            onClick={() => onShowPeopleChange(!showPeople)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              showPeople ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              showPeople ? 'left-5' : 'left-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center gap-1 text-sm">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">下载历史</span>
          <button
            onClick={() => onShowHistoryChange(!showHistory)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              showHistory ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              showHistory ? 'left-5' : 'left-0.5'
            }`} />
          </button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="mt-2 text-sm text-blue-600">
          已选择 {selectedCount} 个文件
        </div>
      )}
    </div>
  );
}
