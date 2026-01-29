'use client';

import { useState } from 'react';
import { MessageSquarePlus, X, Send, Loader2, Check } from 'lucide-react';
import { submitFeedback } from '@/lib/api/feedback';

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    setLoading(true);
    try {
      await submitFeedback({
        title: title.trim(),
        content: content.trim(),
        contact: contact.trim() || undefined
      });
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setTitle('');
        setContent('');
        setContact('');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('提交失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-lg hover:scale-105 transition-transform group"
        title="提交反馈"
      >
        <MessageSquarePlus className="w-5 h-5" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          提交反馈
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div 
            className="modal"
            onClick={e => e.stopPropagation()}
          >
            {success ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">提交成功</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">感谢您的反馈，我们会尽快处理</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="modal-header">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">提交反馈</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">告诉我们您的需求或问题</p>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="btn-ghost btn-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <div className="modal-body space-y-4">
                  <div className="form-group">
                    <label className="form-label">
                      标题 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="简要描述您的需求或问题"
                      className="input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      详细描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
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
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="邮箱或手机号，方便我们联系您"
                      className="input"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        提交中...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        提交
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
