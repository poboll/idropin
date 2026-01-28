'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Loader2, Eye, Edit2, Download, Trash2, FileIcon, Image as ImageIcon } from 'lucide-react';
import { AuthGuard } from '@/components/auth';
import FileFilterBar from '@/components/files/FileFilterBar';
import FileBatchActions from '@/components/files/FileBatchActions';
import DownloadHistoryPanel, { DownloadAction, DownloadStatus, ActionType } from '@/components/files/DownloadHistoryPanel';
import InfosForm from '@/components/forms/InfosForm';
import Modal from '@/components/Modal';
import { useCategoryStore } from '@/lib/stores/category';
import { useTaskStore } from '@/lib/stores/task';
import { formatDate, formatSize, parseInfo, InfoItem, getFileSuffix } from '@/lib/utils/string';
import { copyRes } from '@/lib/utils/string';

interface FileRecord {
  id: number;
  date: string;
  task_key: string;
  task_name: string;
  name: string;
  origin_name?: string;
  size: number;
  people?: string;
  info: string;
  cover?: string;
  downloadCount?: number;
  fileId?: string;
  mimeType?: string;
}

function FilesPageContent() {
  const { categoryList: categories, getCategory: fetchCategories } = useCategoryStore();
  const { taskList: tasks, getTask: fetchTasks } = useTaskStore();

  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTask, setSelectedTask] = useState('all');
  const [searchWord, setSearchWord] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const [showImages, setShowImages] = useState(false);
  const [showOriginName, setShowOriginName] = useState(false);
  const [showPeople, setShowPeople] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const [pageSize, setPageSize] = useState(10);
  const [pageCurrent, setPageCurrent] = useState(1);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadActions, setDownloadActions] = useState<DownloadAction[]>([]);
  const [compressTasks, setCompressTasks] = useState<DownloadAction[]>([]);
  const [historyPageCurrent, setHistoryPageCurrent] = useState(1);
  const [historyPageTotal, setHistoryPageTotal] = useState(0);

  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [currentInfos, setCurrentInfos] = useState<InfoItem[]>([]);

  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameForm, setRenameForm] = useState({ id: -1, oldName: '', newName: '', suffix: '' });

  const [downloadUrl, setDownloadUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchTasks();
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      // 使用真实API获取文件列表
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'}/files?page=1&size=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.records) {
          // 转换API数据格式
          const apiFiles: FileRecord[] = data.data.records.map((f: any, index: number) => ({
            id: index + 1,
            date: f.createdAt || new Date().toISOString(),
            task_key: f.categoryId || 'default',
            task_name: f.categoryId ? `任务 ${f.categoryId}` : '默认任务',
            name: f.originalName || '未命名文件',
            origin_name: f.originalName,
            size: f.fileSize || 0,
            people: f.uploaderId || '-',
            info: '[]',
            cover: f.mimeType?.startsWith('image/') ? f.url : undefined,
            downloadCount: 0,
            fileId: f.id,
            mimeType: f.mimeType,
          }));
          setFiles(apiFiles);
        } else {
          setFiles([]);
        }
      } else {
        // API调用失败，显示空列表
        setFiles([]);
      }
    } catch (error) {
      console.error('加载文件失败', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    if (selectedCategory === 'all') return tasks;
    return tasks.filter(t => t.category === selectedCategory);
  }, [tasks, selectedCategory]);

  const filteredFiles = useMemo(() => {
    return files
      .filter(f => {
        if (selectedCategory === 'no-task') {
          return !tasks.some(t => t.key === f.task_key);
        }
        if (selectedTask !== 'all') {
          return f.task_key === selectedTask;
        }
        if (selectedCategory !== 'all' && selectedCategory !== 'default') {
          return filteredTasks.some(t => t.key === f.task_key);
        }
        return true;
      })
      .filter(f => {
        if (!searchWord) return true;
        const searchStr = JSON.stringify([
          formatDate(new Date(f.date)),
          formatSize(f.size),
          f.people,
          f.name,
          f.task_name,
          f.info,
        ]).replace(/[:'"{}\[\]]/g, '');
        return searchStr.toLowerCase().includes(searchWord.toLowerCase());
      });
  }, [files, selectedCategory, selectedTask, searchWord, tasks, filteredTasks]);

  const pageCount = Math.ceil(filteredFiles.length / pageSize);
  const paginatedFiles = useMemo(() => {
    const start = (pageCurrent - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, pageCurrent, pageSize]);

  const totalSize = useMemo(() => formatSize(files.reduce((acc, f) => acc + f.size, 0)), [files]);
  const filteredSize = useMemo(() => formatSize(filteredFiles.reduce((acc, f) => acc + f.size, 0)), [filteredFiles]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedTask('all');
    setPageCurrent(1);
  };

  const handleTaskChange = (task: string) => {
    setSelectedTask(task);
    setPageCurrent(1);
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(i => i !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedFiles.map(f => f.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBatchDownload = () => {
    if (selectedItems.length === 0) {
      alert('没有选中需要下载的内容');
      return;
    }
    setIsDownloading(true);
    setTimeout(() => {
      alert('开始归档选中的文件，请耐心等待');
      setIsDownloading(false);
      setSelectedItems([]);
    }, 1000);
  };

  const handleBatchDelete = () => {
    if (selectedItems.length === 0) {
      alert('没有选中需要删除的内容');
      return;
    }
    if (confirm('删除后无法恢复，是否删除？')) {
      setFiles(prev => prev.filter(f => !selectedItems.includes(f.id)));
      setSelectedItems([]);
      alert('删除成功');
    }
  };

  const handleExportExcel = () => {
    if (selectedItems.length === 0) {
      alert('没有选中需要导出的内容');
      return;
    }
    alert('导出成功');
    setSelectedItems([]);
  };

  const handleExportAll = () => {
    if (filteredFiles.length === 0) {
      alert('表格中没有可导出的内容');
      return;
    }
    alert('导出成功');
  };

  const handleDownloadTask = () => {
    if (selectedTask === 'all') return;
    setIsDownloading(true);
    setTimeout(() => {
      alert('开始归档任务中的文件，请耐心等待');
      setIsDownloading(false);
    }, 1000);
  };

  const handleCheckInfo = (file: FileRecord) => {
    setCurrentInfos(parseInfo(file.info));
    setShowInfoDialog(true);
  };

  const handleRename = (file: FileRecord) => {
    const suffix = getFileSuffix(file.name);
    setRenameForm({
      id: file.id,
      oldName: file.name,
      newName: file.name.replace(suffix, ''),
      suffix,
    });
    setShowRenameDialog(true);
  };

  const handleSaveRename = () => {
    const newName = `${renameForm.newName}${renameForm.suffix}`;
    setFiles(prev => prev.map(f => f.id === renameForm.id ? { ...f, name: newName } : f));
    setShowRenameDialog(false);
    alert('修改成功');
  };

  const handleDownloadOne = (file: FileRecord) => {
    setDownloadUrl(`https://example.com/download/${file.id}`);
    setShowLinkDialog(true);
  };

  const handleDeleteOne = (file: FileRecord) => {
    if (confirm('确认删除此文件吗？')) {
      setFiles(prev => prev.filter(f => f.id !== file.id));
      alert('删除成功');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <FileFilterBar
        categories={categories?.map(c => ({ k: c.k, name: c.name })) || []}
        tasks={filteredTasks?.map(t => ({ key: t.key, name: t.name, category: t.category })) || []}
        selectedCategory={selectedCategory}
        selectedTask={selectedTask}
        searchWord={searchWord}
        onCategoryChange={handleCategoryChange}
        onTaskChange={handleTaskChange}
        onSearchChange={setSearchWord}
        onDownloadTask={handleDownloadTask}
        onRefresh={loadFiles}
        isDownloading={isDownloading}
      />

      <FileBatchActions
        selectedCount={selectedItems.length}
        onBatchDownload={handleBatchDownload}
        onBatchDelete={handleBatchDelete}
        onExportExcel={handleExportExcel}
        onExportAll={handleExportAll}
        onRefresh={loadFiles}
        showImages={showImages}
        onShowImagesChange={setShowImages}
        showOriginName={showOriginName}
        onShowOriginNameChange={setShowOriginName}
        showPeople={showPeople}
        onShowPeopleChange={setShowPeople}
        showHistory={showHistory}
        onShowHistoryChange={setShowHistory}
        isDownloading={isDownloading}
        hasFilteredData={filteredFiles.length > 0}
      />

      {showHistory && (
        <DownloadHistoryPanel
          actions={downloadActions}
          compressTasks={compressTasks}
          pageSize={3}
          pageCount={Math.ceil(historyPageTotal / 3)}
          pageCurrent={historyPageCurrent}
          pageTotal={historyPageTotal}
          onPageChange={setHistoryPageCurrent}
          onDownload={(url) => window.open(url, '_blank')}
          onCopyLink={(url) => copyRes(url)}
          onShowQrCode={(url) => { setDownloadUrl(url); setShowLinkDialog(true); }}
        />
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <div className="text-sm text-orange-500 mb-2">
          全部文件大小：{totalSize}，当前筛选大小：{filteredSize}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="py-2 px-2 w-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === paginatedFiles.length && paginatedFiles.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">提交时间</th>
                  <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">任务</th>
                  <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">文件名</th>
                  {showOriginName && (
                    <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">原文件名</th>
                  )}
                  <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">大小</th>
                  <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">下载次数</th>
                  {showImages && (
                    <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">缩略图</th>
                  )}
                  {showPeople && (
                    <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">提交人</th>
                  )}
                  <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">操作</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFiles.map((file) => (
                  <tr key={file.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-2 px-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(file.id)}
                        onChange={(e) => handleSelectItem(file.id, e.target.checked)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {formatDate(new Date(file.date))}
                    </td>
                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                      {file.task_name}
                    </td>
                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300 max-w-[160px] truncate" title={file.name}>
                      {file.name}
                    </td>
                    {showOriginName && (
                      <td className="py-2 px-2 text-gray-500 max-w-[160px] truncate">
                        {file.origin_name || '-'}
                      </td>
                    )}
                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {file.size === 0 ? '未知大小' : formatSize(file.size)}
                    </td>
                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                      {file.downloadCount ?? 0}
                    </td>
                      {showImages && (
                        <td className="py-2 px-2">
                          {file.cover ? (
                            <div className="relative w-16 h-16">
                              <Image 
                                src={file.cover} 
                                alt="" 
                                fill 
                                className="object-cover rounded" 
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                      )}
                    {showPeople && (
                      <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                        {file.people || '-'}
                      </td>
                    )}
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => handleCheckInfo(file)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          查看信息
                        </button>
                        <button
                          onClick={() => handleRename(file)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          改名
                        </button>
                        <button
                          onClick={() => handleDownloadOne(file)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          下载
                        </button>
                        <button
                          onClick={() => handleDeleteOne(file)}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex justify-center items-center gap-4">
          <span className="text-sm text-gray-500">共 {filteredFiles.length} 条</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPageCurrent(1); }}
            className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option value={6}>6条/页</option>
            <option value={10}>10条/页</option>
            <option value={50}>50条/页</option>
            <option value={100}>100条/页</option>
          </select>
          <div className="flex gap-1">
            <button
              onClick={() => setPageCurrent(p => Math.max(1, p - 1))}
              disabled={pageCurrent <= 1}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-3 py-1 text-sm">{pageCurrent} / {pageCount}</span>
            <button
              onClick={() => setPageCurrent(p => Math.min(pageCount, p + 1))}
              disabled={pageCurrent >= pageCount}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showInfoDialog}
        onClose={() => setShowInfoDialog(false)}
        title="提交填写的信息"
      >
        <InfosForm infos={currentInfos} disabled />
      </Modal>

      <Modal
        isOpen={showRenameDialog}
        onClose={() => setShowRenameDialog(false)}
        title="修改文件名"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">原文件名</label>
            <input
              type="text"
              value={renameForm.oldName}
              disabled
              className="w-full px-3 py-2 border rounded bg-gray-100 dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">新文件名</label>
            <div className="flex">
              <input
                type="text"
                value={renameForm.newName}
                onChange={(e) => setRenameForm(prev => ({ ...prev, newName: e.target.value }))}
                className="flex-1 px-3 py-2 border rounded-l dark:bg-gray-700 dark:border-gray-600"
                placeholder="请输入新文件名"
              />
              <span className="px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-l-0 rounded-r text-sm">
                {renameForm.suffix}
              </span>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowRenameDialog(false)}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              取消
            </button>
            <button
              onClick={handleSaveRename}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        title="下载链接"
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded break-all text-sm">
            {downloadUrl}
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => copyRes(downloadUrl)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              复制链接
            </button>
            <button
              onClick={() => window.open(downloadUrl, '_blank')}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              打开下载
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function FilesPage() {
  return (
    <AuthGuard>
      <FilesPageContent />
    </AuthGuard>
  );
}
