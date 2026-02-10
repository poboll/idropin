import React, { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { Task } from '@/lib/stores/task';
import { copyRes } from '@/lib/utils/string';
import { Copy, Link as LinkIcon, Check, Zap, Eye, Loader2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
  const [showQR, setShowQR] = useState(false);

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
      <div className="space-y-5">
        <div className="form-group">
          <label className="form-label">任务名称</label>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white font-medium border border-gray-200 dark:border-gray-700">
            {task.name}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">收取链接</label>
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                readOnly
                value={shareLink}
                className="input pl-9"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => window.open(shareLink, '_blank')}
                className="btn-secondary flex-1"
              >
                <Eye className="w-4 h-4" />
                预览
              </button>

              <button
                onClick={handleGenerateShortLink}
                disabled={isShort || generating}
                className="btn-secondary flex-1"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {generating ? '生成中...' : isShort ? '已是短链' : '生成短链'}
              </button>

              <button
                onClick={handleCopy}
                className={`flex-1 ${copied ? 'btn-primary bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700' : 'btn-primary'}`}
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
          <p className="form-hint mt-2">
            任何人拥有此链接都可以上传文件，请妥善保管
          </p>
        </div>

        <div className="form-group">
          <button
            onClick={() => setShowQR(!showQR)}
            className="btn-secondary w-full"
          >
            <QrCode className="w-4 h-4" />
            {showQR ? '收起二维码' : '显示二维码'}
          </button>
          {showQR && (
            <div className="mt-3 flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200">
              <QRCodeSVG
                value={shareLink}
                size={180}
                level="M"
                includeMargin
              />
              <p className="mt-2 text-xs text-gray-500">扫描二维码即可打开收集页面</p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="btn-ghost"
          >
            关闭
          </button>
        </div>
      </div>
    </Modal>
  );
};
