'use client';

import Image from 'next/image';
import { X, Download, Check, Copy, Share2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { formatDate, formatSize, getFileSuffix } from '@/lib/utils/string';
import { copyRes } from '@/lib/utils/string';

interface FileRecord {
  id: string | number;
  date: string;
  task_key: string;
  task_name: string;
  name: string;
  origin_name?: string;
  size: number;
  people?: string;
  submitterIp?: string;
  info: string;
  cover?: string;
  downloadCount?: number;
  fileId?: string;
  mimeType?: string;
}

interface FileModalsProps {
  activeModal: 'info' | 'rename' | 'download' | 'share' | null;
  setActiveModal: (v: 'info' | 'rename' | 'download' | 'share' | null) => void;
  currentFile: FileRecord | null;
  renameValue: string;
  setRenameValue: (v: string) => void;
  handleSaveRename: () => void;
  shareFormData: { password: string; expireAt: string; downloadLimit: string };
  setShareFormData: (v: { password: string; expireAt: string; downloadLimit: string }) => void;
  shareResult: { shareCode: string; url: string } | null;
  handleCreateShare: () => void;
  getTaskBadgeStyle: (taskKey: string) => string;
}

export default function FileModals({
  activeModal, setActiveModal, currentFile,
  renameValue, setRenameValue, handleSaveRename,
  shareFormData, setShareFormData, shareResult, handleCreateShare,
  getTaskBadgeStyle,
}: FileModalsProps) {
  if (!currentFile || !activeModal) return null;

  const close = () => setActiveModal(null);

  return (
    <>
      {activeModal === 'info' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">文件信息</h3>
              <button onClick={close} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="modal-body space-y-4">
              {currentFile.cover && (
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <Image src={currentFile.cover} alt="" fill className="object-contain" />
                </div>
              )}
              <div>
                <label className="form-label">文件名</label>
                <p className="text-gray-900 dark:text-white">{currentFile.name}</p>
              </div>
              {currentFile.origin_name && currentFile.origin_name !== currentFile.name && (
                <div>
                  <label className="form-label">原始文件名</label>
                  <p className="text-gray-900 dark:text-white">{currentFile.origin_name}</p>
                </div>
              )}
              <div>
                <label className="form-label">任务</label>
                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg border ${getTaskBadgeStyle(currentFile.task_key)}`}>
                  {currentFile.task_name}
                </span>
              </div>
              <div>
                <label className="form-label">大小</label>
                <p className="text-gray-900 dark:text-white">{formatSize(currentFile.size)}</p>
              </div>
              <div>
                <label className="form-label">提交人</label>
                <p className="text-gray-900 dark:text-white">{currentFile.people || '-'}</p>
              </div>
              {currentFile.mimeType && (
                <div>
                  <label className="form-label">文件类型</label>
                  <p className="text-gray-900 dark:text-white">{currentFile.mimeType}</p>
                </div>
              )}
              <div>
                <label className="form-label">提交时间</label>
                <p className="text-gray-900 dark:text-white">{formatDate(new Date(currentFile.date))}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={close} className="btn-secondary">关闭</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'rename' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">重命名文件</h3>
              <button onClick={close} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">新文件名</label>
                <div className="flex">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="input rounded-r-none"
                    placeholder="输入新文件名"
                  />
                  <span className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-l-0 border-gray-200 dark:border-gray-700 rounded-r-lg text-sm text-gray-500">
                    {getFileSuffix(currentFile.name)}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={close} className="btn-secondary">取消</button>
              <button onClick={handleSaveRename} className="btn-primary">保存</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'download' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">下载文件</h3>
              <button onClick={close} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                文件: {currentFile.name}
              </p>
              {currentFile.fileId ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">点击下方按钮直接下载文件</p>
              ) : (
                <p className="text-sm text-amber-600 dark:text-amber-400">该提交记录没有关联文件，无法下载</p>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={close} className="btn-secondary">关闭</button>
              {currentFile.fileId && (
                <button
                  onClick={async () => {
                    try {
                      const response = await apiClient.get(`/files/${currentFile.fileId}/download`, { responseType: 'blob' });
                      const blob = new Blob([response.data]);
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = currentFile.origin_name || currentFile.name;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                      close();
                    } catch (err) {
                      console.error('下载失败', err);
                      alert('下载失败，请重试');
                    }
                  }}
                  className="btn-primary"
                >
                  <Download className="w-4 h-4" />
                  下载
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeModal === 'share' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal max-w-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">创建分享</h3>
              <button onClick={close} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="modal-body space-y-4">
              {!shareResult ? (
                <>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      文件: {currentFile.name}
                    </p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">分享密码（可选）</label>
                    <input
                      type="text"
                      value={shareFormData.password}
                      onChange={(e) => setShareFormData({ ...shareFormData, password: e.target.value })}
                      className="input"
                      placeholder="留空则无需密码"
                      maxLength={20}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">过期时间（可选）</label>
                    <input
                      type="datetime-local"
                      value={shareFormData.expireAt}
                      onChange={(e) => setShareFormData({ ...shareFormData, expireAt: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">下载次数限制（可选）</label>
                    <input
                      type="number"
                      value={shareFormData.downloadLimit}
                      onChange={(e) => setShareFormData({ ...shareFormData, downloadLimit: e.target.value })}
                      className="input"
                      placeholder="留空则不限制"
                      min="1"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">分享创建成功</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">分享链接</label>
                    <div className="flex gap-2">
                      <input type="text" value={shareResult.url} readOnly className="input flex-1" />
                      <button
                        onClick={() => { copyRes(shareResult.url); alert('链接已复制'); }}
                        className="btn-secondary"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">分享码</label>
                    <div className="flex gap-2">
                      <input type="text" value={shareResult.shareCode} readOnly className="input flex-1" />
                      <button
                        onClick={() => { copyRes(shareResult.shareCode); alert('分享码已复制'); }}
                        className="btn-secondary"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              {!shareResult ? (
                <>
                  <button onClick={close} className="btn-secondary">取消</button>
                  <button onClick={handleCreateShare} className="btn-primary">
                    <Share2 className="w-4 h-4" />
                    创建分享
                  </button>
                </>
              ) : (
                <button onClick={close} className="btn-primary w-full">完成</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
