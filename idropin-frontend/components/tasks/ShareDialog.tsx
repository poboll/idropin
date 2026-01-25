import React, { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { Task } from '@/lib/stores/task';
import { copyRes } from '@/lib/utils/string';
import { Copy, Link as LinkIcon, Check, Zap, Eye } from 'lucide-react';

interface ShareDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ task, open, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [generating, setGenerating] = useState(false);
  const [isShort, setIsShort] = useState(false);

  useEffect(() => {
    if (open && task) {
      setShareLink(`${window.location.origin}/task/${task.key}`);
      setCopied(false);
      setIsShort(false);
    }
  }, [open, task]);

  const handleCopy = async () => {
    await copyRes(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateShortLink = async () => {
    if (isShort || generating) return;
    setGenerating(true);
    try {
      const response = await fetch('/api/short-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: shareLink })
      });
      const data = await response.json();
      if (data.code === 0 && data.data?.url) {
        setShareLink(data.data.url);
        setIsShort(true);
      } else {
        alert('生成失败: ' + (data.msg || '未知错误'));
      }
    } catch (e) {
      console.error(e);
      alert('生成短链失败');
    } finally {
      setGenerating(false);
    }
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="分享任务"
      size="md"
    >
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-slate-500 mb-2 block">
            任务名称
          </label>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-800 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-700">
            {task.name}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-500 mb-2 block">
            收取链接
          </label>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                readOnly
                value={shareLink}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-600 dark:text-slate-300"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => window.open(shareLink, '_blank')}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
              >
                <Eye className="w-4 h-4 text-purple-500" />
                预览
              </button>

              <button
                onClick={handleGenerateShortLink}
                disabled={isShort || generating}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all border ${
                  isShort
                    ? 'bg-slate-100 text-slate-400 border-transparent cursor-default'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Zap className={`w-4 h-4 ${isShort ? '' : 'text-orange-500'}`} />
                {generating ? '生成中...' : isShort ? '已是短链' : '生成短链'}
              </button>

              <button
                onClick={handleCopy}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  copied
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    复制链接
                  </>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            * 任何人拥有此链接都可以上传文件，请妥善保管
          </p>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </Modal>
  );
};
