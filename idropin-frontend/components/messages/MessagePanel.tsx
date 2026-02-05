'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { X, CheckCheck, Trash2, Mail, MailOpen, Send, Loader2, Check } from 'lucide-react';
import { useMessageStore } from '@/lib/stores/messages';
import { Message } from '@/lib/api/messages';
import { submitFeedback } from '@/lib/api/feedback';

interface MessagePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MessagePanel({ isOpen, onClose }: MessagePanelProps) {
  const {
    messages,
    loading,
    hasMore,
    showUnreadOnly,
    fetchMessages,
    markMessageAsRead,
    markAllMessagesAsRead,
    removeMessage,
    setShowUnreadOnly,
    loadMore,
  } = useMessageStore();

  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'messages' | 'feedback'>('messages');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMessages(true);
      setActiveTab('messages');
      setFeedbackSuccess(false);
    }
  }, [isOpen, fetchMessages]);

  const handleFeedbackSubmit = async () => {
    if (!feedbackTitle.trim() || !feedbackContent.trim()) {
      alert('请填写标题和内容');
      return;
    }

    setFeedbackLoading(true);
    try {
      await submitFeedback({
        title: feedbackTitle.trim(),
        content: feedbackContent.trim(),
        contact: feedbackContact.trim() || undefined
      });
      setFeedbackSuccess(true);
      setTimeout(() => {
        setFeedbackSuccess(false);
        setActiveTab('messages');
        setFeedbackTitle('');
        setFeedbackContent('');
        setFeedbackContact('');
      }, 2000);
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      const errorMessage = error.message || error.response?.data?.message || '提交失败，请稍后重试';
      alert(`提交失败: ${errorMessage}`);
    } finally {
      setFeedbackLoading(false);
    }
  };

  // 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // 延迟添加监听器，避免立即触发
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  const handleScroll = useCallback(() => {
    if (!listRef.current || loading || !hasMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
    }
  }, [loading, hasMore, loadMore]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleDateString('zh-CN');
  };

  const decodeHtml = (input: string) => {
    let value = input ?? '';
    // 最多3次迭代解码，避免多重HTML编码
    for (let i = 0; i < 3; i++) {
      const txt = document.createElement('textarea');
      txt.innerHTML = value;
      const next = txt.value;
      if (next === value) break; // 不再变化时停止
      value = next;
    }
    // Normalize common formatting and ensure plain-text rendering
    value = value.replace(/<br\s*\/?>/gi, '\n');
    value = value.replace(/<\/?[^>]+>/g, '');
    return value;
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="fixed right-4 top-16 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 flex flex-col max-h-[80vh] border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {activeTab === 'messages' ? '消息' : '提交反馈'}
          </h2>
          <div className="flex items-center gap-1">
            {activeTab === 'messages' && (
              <button
                onClick={markAllMessagesAsRead}
                className="btn-ghost btn-sm"
                title="全部已读"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-ghost btn-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs mx-3 my-2">
          <button
            onClick={() => { setActiveTab('messages'); setShowUnreadOnly(false); }}
            className={`tab flex-1 ${activeTab === 'messages' && !showUnreadOnly ? 'tab-active' : ''}`}
          >
            全部
          </button>
          <button
            onClick={() => { setActiveTab('messages'); setShowUnreadOnly(true); }}
            className={`tab flex-1 ${activeTab === 'messages' && showUnreadOnly ? 'tab-active' : ''}`}
          >
            未读
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`tab flex-1 ${activeTab === 'feedback' ? 'tab-active' : ''}`}
          >
            反馈
          </button>
        </div>

        {activeTab === 'feedback' ? (
          feedbackSuccess ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">提交成功</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">感谢您的反馈，我们会尽快处理</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              <div className="form-group">
                <label className="form-label">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  placeholder="简要描述您的需求或问题"
                  className="input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  详细描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={feedbackContent}
                  onChange={(e) => setFeedbackContent(e.target.value)}
                  placeholder="请详细描述您的需求或遇到的问题..."
                  rows={4}
                  className="input resize-none"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  联系方式 <span className="text-gray-400 font-normal">(选填)</span>
                </label>
                <input
                  type="text"
                  value={feedbackContact}
                  onChange={(e) => setFeedbackContact(e.target.value)}
                  placeholder="邮箱或手机号，方便我们联系您"
                  className="input"
                />
              </div>

              <button
                onClick={handleFeedbackSubmit}
                disabled={feedbackLoading}
                className="btn-primary w-full"
              >
                {feedbackLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    提交反馈
                  </>
                )}
              </button>
            </div>
          )
        ) : (
          /* Message List */
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto"
          >
            {messages.length === 0 && !loading ? (
              <div className="empty-state py-12">
                <Mail className="empty-state-icon" />
                <p className="empty-state-description">暂无更多消息</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                  onRead={() => markMessageAsRead(message.id)}
                  onDelete={() => removeMessage(message.id)}
                  formatTime={formatTime}
                  decodeHtml={decodeHtml}
                />
              ))}
            </div>
          )}
          
          {loading && (
            <div className="flex justify-center py-4">
              <div className="spinner" />
            </div>
          )}
        </div>
        )}
      </div>
  );
}

interface MessageItemProps {
  message: Message;
  onRead: () => void;
  onDelete: () => void;
  formatTime: (date: string) => string;
  decodeHtml: (html: string) => string;
}

function MessageItem({ message, onRead, onDelete, formatTime, decodeHtml }: MessageItemProps) {
  return (
    <div
      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
        !message.isRead ? 'bg-gray-50 dark:bg-gray-800/30' : ''
      }`}
      onClick={() => !message.isRead && onRead()}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 p-1.5 rounded-lg ${
          message.senderType === 'system' 
            ? 'bg-gray-100 dark:bg-gray-800' 
            : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          {message.isRead ? (
            <MailOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <Mail className="w-4 h-4 text-gray-900 dark:text-white" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-sm truncate ${
              !message.isRead 
                ? 'font-medium text-gray-900 dark:text-white' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {decodeHtml(message.title)}
            </h3>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatTime(message.createdAt)}
            </span>
          </div>
          
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {decodeHtml(message.content)}
          </p>
          
          <div className="mt-2 flex items-center justify-between">
            <span className="badge-default text-xs">
              {message.senderName}
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
              title="删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
