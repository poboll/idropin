'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { X, CheckCheck, Trash2, Mail, MailOpen, ArrowLeft, Plus, Send, Clock, MessageCircle } from 'lucide-react';
import { useMessageStore } from '@/lib/stores/messages';
import { Message } from '@/lib/api/messages';
import {
  submitFeedback, getMyFeedback, getFeedbackDetail, replyFeedback,
  getStatusText, getStatusClass, Feedback, FeedbackDetail
} from '@/lib/api/feedback';

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
  const [feedbackView, setFeedbackView] = useState<'list' | 'detail' | 'submit'>('list');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMessages(true);
      setActiveTab('messages');
      setFeedbackView('list');
    }
  }, [isOpen, fetchMessages]);

  const fetchFeedbacks = useCallback(async () => {
    setFeedbackLoading(true);
    try {
      const data = await getMyFeedback({ page: 1, size: 50 });
      setFeedbacks(data.records);
    } catch {
      console.error('Failed to fetch feedbacks');
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  const openDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setFeedbackView('detail');
    try {
      const detail = await getFeedbackDetail(id);
      setSelectedFeedback(detail);
    } catch {
      console.error('Failed to load feedback detail');
      setFeedbackView('list');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedFeedback) return;
    setReplyLoading(true);
    try {
      const reply = await replyFeedback(selectedFeedback.id, replyContent.trim());
      setSelectedFeedback(prev => prev ? { ...prev, replies: [...prev.replies, reply] } : prev);
      setReplyContent('');
    } catch {
      console.error('Failed to send reply');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackTitle.trim() || !feedbackContent.trim()) return;
    setSubmitLoading(true);
    try {
      await submitFeedback({
        title: feedbackTitle.trim(),
        content: feedbackContent.trim(),
        contact: feedbackContact.trim() || undefined,
      });
      setFeedbackTitle('');
      setFeedbackContent('');
      setFeedbackContact('');
      setFeedbackView('list');
      fetchFeedbacks();
    } catch (error: any) {
      const msg = error.message || error.response?.data?.message || '提交失败';
      alert(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'feedback' && feedbackView === 'list') {
      fetchFeedbacks();
    }
  }, [isOpen, activeTab, feedbackView, fetchFeedbacks]);

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
    if (!input) return '';

    const decodeOnce = (value: string) => {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = value;
      return textarea.value;
    };

    // 有些消息文本会被多次实体编码（例如 &amp;lt;），这里做有限次解码直到稳定。
    let decoded = input;
    for (let i = 0; i < 3; i++) {
      const next = decodeOnce(decoded);
      if (next === decoded) break;
      decoded = next;
    }

    // 移除HTML标签（保留换行）
    decoded = decoded.replace(/<br\s*\/?>/gi, '\n');
    decoded = decoded.replace(/<\/?[^>]+(>|$)/g, '');

    return decoded.trim();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={panelRef}
      className="fixed right-4 top-16 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-xl shadow-2xl z-50 flex flex-col max-h-[80vh] border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            {activeTab === 'feedback' && feedbackView !== 'list' && (
              <button
                onClick={() => { setFeedbackView('list'); setSelectedFeedback(null); setReplyContent(''); }}
                className="btn-ghost btn-sm"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {activeTab === 'messages' ? '消息' : feedbackView === 'detail' ? '反馈详情' : feedbackView === 'submit' ? '提交反馈' : '反馈'}
            </h2>
          </div>
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
            {activeTab === 'feedback' && feedbackView === 'list' && (
              <button
                onClick={() => setFeedbackView('submit')}
                className="btn-ghost btn-sm"
                title="提交反馈"
              >
                <Plus className="w-4 h-4" />
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
          feedbackView === 'detail' ? (
            /* Detail View */
            <div className="flex-1 overflow-y-auto flex flex-col">
              {detailLoading ? (
                <div className="flex-1 flex items-center justify-center py-12">
                  <div className="spinner" />
                </div>
              ) : selectedFeedback ? (
                <>
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusClass(selectedFeedback.status)}`}>
                        {getStatusText(selectedFeedback.status)}
                      </span>
                      <span className="text-xs text-gray-400">{formatTime(selectedFeedback.createdAt)}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{selectedFeedback.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">{selectedFeedback.content}</p>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
                    {selectedFeedback.replies.length === 0 ? (
                      <div className="text-center py-8 text-xs text-gray-400">暂无回复</div>
                    ) : (
                      selectedFeedback.replies.map(reply => (
                        <div key={reply.id} className={`flex ${reply.isAdmin ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            reply.isAdmin
                              ? 'bg-gray-100 dark:bg-gray-800'
                              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                          }`}>
                            {reply.isAdmin && (
                              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 block mb-0.5">管理员</span>
                            )}
                            <p className="text-xs whitespace-pre-wrap">{reply.content}</p>
                            <span className={`text-[10px] block mt-1 ${
                              reply.isAdmin ? 'text-gray-400' : 'text-gray-300 dark:text-gray-500'
                            }`}>{formatTime(reply.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                    <input
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
                      placeholder="输入回复..."
                      className="input flex-1 text-sm"
                    />
                    <button
                      onClick={handleReply}
                      disabled={replyLoading || !replyContent.trim()}
                      className="btn-primary px-3"
                    >
                      {replyLoading ? <div className="spinner w-4 h-4" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : feedbackView === 'submit' ? (
            /* Submit View */
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              <div className="form-group">
                <label className="form-label">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={feedbackTitle}
                  onChange={e => setFeedbackTitle(e.target.value)}
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
                  onChange={e => setFeedbackContent(e.target.value)}
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
                  onChange={e => setFeedbackContact(e.target.value)}
                  placeholder="邮箱或手机号，方便我们联系您"
                  className="input"
                />
              </div>
              <button
                onClick={handleFeedbackSubmit}
                disabled={submitLoading || !feedbackTitle.trim() || !feedbackContent.trim()}
                className="btn-primary w-full"
              >
                {submitLoading ? '提交中...' : '提交反馈'}
              </button>
            </div>
          ) : (
            /* List View */
            <div className="flex-1 overflow-y-auto">
              {feedbackLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="spinner" />
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="empty-state py-12">
                  <MessageCircle className="empty-state-icon" />
                  <p className="empty-state-description">暂无反馈记录</p>
                  <button onClick={() => setFeedbackView('submit')} className="btn-primary mt-3 text-sm">
                    提交反馈
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {feedbacks.map(fb => (
                    <div
                      key={fb.id}
                      onClick={() => openDetail(fb.id)}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{fb.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${getStatusClass(fb.status)}`}>
                          {getStatusText(fb.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{fb.content}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />{formatTime(fb.createdAt)}
                        </span>
                        {fb.replyCount > 0 && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />{fb.replyCount} 条回复
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
