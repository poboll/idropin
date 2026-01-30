'use client';

import { useEffect, useRef, useCallback } from 'react';
import { X, CheckCheck, Trash2, Mail, MailOpen } from 'lucide-react';
import { useMessageStore } from '@/lib/stores/messages';
import { Message } from '@/lib/api/messages';

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

  useEffect(() => {
    if (isOpen) {
      fetchMessages(true);
    }
  }, [isOpen, fetchMessages]);

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

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="fixed right-4 top-16 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 flex flex-col max-h-[80vh] border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">消息</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={markAllMessagesAsRead}
              className="btn-ghost btn-sm"
              title="全部已读"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
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
            onClick={() => setShowUnreadOnly(false)}
            className={`tab flex-1 ${!showUnreadOnly ? 'tab-active' : ''}`}
          >
            全部
          </button>
          <button
            onClick={() => setShowUnreadOnly(true)}
            className={`tab flex-1 ${showUnreadOnly ? 'tab-active' : ''}`}
          >
            未读
          </button>
        </div>

        {/* Message List */}
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
      </div>
  );
}

interface MessageItemProps {
  message: Message;
  onRead: () => void;
  onDelete: () => void;
  formatTime: (date: string) => string;
}

function MessageItem({ message, onRead, onDelete, formatTime }: MessageItemProps) {
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
              {message.title}
            </h3>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {formatTime(message.createdAt)}
            </span>
          </div>
          
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {message.content}
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
