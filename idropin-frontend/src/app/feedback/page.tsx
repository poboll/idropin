'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Send, CheckCircle } from 'lucide-react';

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
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSuccess(true);
      setFormData({ title: '', des: '', contact: '' });
    } catch {
      setError('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-cyan-700 flex flex-col">
        <header className="p-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回首页</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              提交成功
            </h1>
            <p className="text-white/80 mb-8">
              感谢你的反馈！你的需求已进入审核阶段，我们会认真评估每一条建议。
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setIsSuccess(false)}
                className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                继续提交
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-white text-purple-900 rounded-xl hover:bg-white/90 transition-colors"
              >
                返回首页
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-cyan-700 flex flex-col">
      <header className="p-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回首页</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-light text-white mb-4">
              需求墙
            </h1>
            <p className="text-white/80">
              通过投票决定下一个新功能是什么
            </p>
            <p className="text-white/80">
              票数越多优先级越高
            </p>
            <p className="text-white/80 mt-2">
              当然你也可以提出你的需求，让大家来投票
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              提交需求
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  需求标题 <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="一句简单明了的话概括一下"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="des" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  详细描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="des"
                  value={formData.des}
                  onChange={(e) => setFormData({ ...formData, des: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  placeholder="用朴素的话语进一步描述你的需求"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  联系方式 <span className="text-slate-400 text-xs">（选填）</span>
                </label>
                <input
                  id="contact"
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="邮箱、QQ、微信等任意方式均可"
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    提交需求
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center">
                没有账号？
                <Link href="/register" className="text-blue-500 hover:text-blue-600 ml-1">
                  立即注册
                </Link>
                {' '}即可参与投票
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center">
        <p className="text-white/60 text-sm">
          © 2024 Idrop.in 云集
        </p>
      </footer>
    </div>
  );
}
