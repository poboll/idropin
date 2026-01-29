'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, RefreshCw, MessageSquare, Clock, User,
  ChevronLeft, ChevronRight, X, Send
} from 'lucide-react';
import { 
  getAllFeedback, getFeedbackDetail, replyFeedback, updateFeedbackStatus,
  getStatusText, getStatusClass, Feedback, FeedbackDetail
} from '@/lib/api/feedback';

export default function FeedbackManagePage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Detail dialog
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllFeedback({
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        page,
        size: pageSize
      });
      setFeedbacks(data.records);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleSearch = () => {
    setPage(1);
    fetchFeedbacks();
  };

  const openDetail = async (feedback: Feedback) => {
    setDetailLoading(true);
    try {
      const detail = await getFeedbackDetail(feedback.id);
      setSelectedFeedback(detail);
    } catch (error) {
      console.error('Failed to fetch feedback detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedFeedback(null);
    setReplyContent('');
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedFeedback) return;
    setReplyLoading(true);
    try {
      const newReply = await replyFeedback(selectedFeedback.id, replyContent);
      setSelectedFeedback({
        ...selectedFeedback,
        replies: [...selectedFeedback.replies, newReply],
        replyCount: selectedFeedback.replyCount + 1
      });
      setReplyContent('');
      fetchFeedbacks();
    } catch (error) {
      console.error('Failed to reply:', error);
      alert('回复失败');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedFeedback) return;
    try {
      await updateFeedbackStatus(selectedFeedback.id, status);
      setSelectedFeedback({ ...selectedFeedback, status: status as any });
      fetchFeedbacks();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('状态更新失败');
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">需求反馈</h1>
          <p className="text-sm text-gray-500 mt-1">管理用户提交的需求和反馈</p>
        </div>
      </div>

      {/* 子导航 */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        <Link href="/dashboard/manage" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">概况</Link>
        <Link href="/dashboard/manage/users" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">用户</Link>
        <Link href="/dashboard/manage/feedback" className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg font-medium">需求</Link>
        <Link href="/dashboard/manage/config" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">配置</Link>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px] max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="请输入要检索的内容"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">状态: 全部</option>
          <option value="pending">待处理</option>
          <option value="in_progress">处理中</option>
          <option value="resolved">已解决</option>
          <option value="closed">已关闭</option>
        </select>
        <button
          onClick={fetchFeedbacks}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 反馈列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交者</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">联系方式</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">暂无反馈数据</td>
                </tr>
              ) : (
                feedbacks.map((feedback) => (
                  <tr key={feedback.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{feedback.title}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{feedback.content}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{feedback.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{feedback.contact || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {formatTime(feedback.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(feedback.status)}`}>
                        {getStatusText(feedback.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(feedback)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        查看
                        {feedback.replyCount > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded text-xs">
                            {feedback.replyCount}
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">共 {total} 条</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 详情对话框 */}
      {(selectedFeedback || detailLoading) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeDetail}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            {detailLoading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : selectedFeedback && (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedFeedback.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{selectedFeedback.username}</span>
                      <span>·</span>
                      <span>{formatTime(selectedFeedback.createdAt)}</span>
                      {selectedFeedback.contact && (
                        <>
                          <span>·</span>
                          <span>{selectedFeedback.contact}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedFeedback.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium border-0 ${getStatusClass(selectedFeedback.status)}`}
                    >
                      <option value="pending">待处理</option>
                      <option value="in_progress">处理中</option>
                      <option value="resolved">已解决</option>
                      <option value="closed">已关闭</option>
                    </select>
                    <button onClick={closeDetail} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Original feedback */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedFeedback.content}</p>
                  </div>

                  {/* Replies */}
                  {selectedFeedback.replies.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-500">回复记录</h4>
                      {selectedFeedback.replies.map((reply) => (
                        <div 
                          key={reply.id} 
                          className={`rounded-lg p-4 ${
                            reply.isAdmin 
                              ? 'bg-blue-50 dark:bg-blue-900/20 ml-4' 
                              : 'bg-gray-50 dark:bg-gray-900/50 mr-4'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-sm font-medium ${
                              reply.isAdmin ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {reply.username}
                              {reply.isAdmin && <span className="ml-1 text-xs">(管理员)</span>}
                            </span>
                            <span className="text-xs text-gray-400">{formatTime(reply.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reply input */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex gap-3">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="输入回复内容..."
                      rows={2}
                      className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleReply}
                      disabled={!replyContent.trim() || replyLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-end"
                    >
                      <Send className="w-4 h-4" />
                      {replyLoading ? '发送中...' : '回复'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
