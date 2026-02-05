'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Send, Check, Loader2 } from 'lucide-react';
import { submitFeedback } from '@/lib/api/feedback';

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    title: '',
    des: '',
    contact: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('需求标题不能为空');
      return;
    }

    if (!formData.des.trim()) {
      setError('需求详细描述不能为空');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitFeedback({
        title: formData.title.trim(),
        content: formData.des.trim(),
        contact: formData.contact.trim() || undefined
      });
      setIsSuccess(true);
      setFormData({ title: '', des: '', contact: '' });
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      const errorMessage = err.message || err.response?.data?.message || '提交失败，请稍后重试';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col">
        <header className="border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">返回首页</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              提交成功
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              感谢你的反馈！你的需求已进入审核阶段，我们会认真评估每一条建议。
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsSuccess(false)}
                className="btn-secondary"
              >
                继续提交
              </button>
              <Link href="/" className="btn-primary">
                返回首页
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回首页</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-gray-600 dark:text-gray-400" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              需求墙
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              通过投票决定下一个新功能是什么
            </p>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-medium text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Send className="w-4 h-4" />
              提交需求
            </h2>

            {error && (
              <div className="alert alert-error mb-5">
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label htmlFor="title" className="form-label">
                  需求标题 <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="一句简单明了的话概括一下"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="des" className="form-label">
                  详细描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="des"
                  value={formData.des}
                  onChange={(e) => setFormData({ ...formData, des: e.target.value })}
                  rows={4}
                  className="input resize-none"
                  placeholder="用朴素的话语进一步描述你的需求"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact" className="form-label">
                  联系方式 <span className="text-gray-400 font-normal">(选填)</span>
                </label>
                <input
                  id="contact"
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="input"
                  placeholder="邮箱、QQ、微信等任意方式均可"
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    提交需求
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-800 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                没有账号？
                <Link href="/register" className="link ml-1">立即注册</Link>
                {' '}即可参与投票
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center border-t border-gray-200 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © 2024 在虎
        </p>
      </footer>
    </div>
  );
}
