'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/api/auth';
import { Key, Check, ArrowLeft, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('请输入邮箱地址');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '发送重置邮件失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-full max-w-sm px-6">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              邮件已发送
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              请检查您的邮箱
            </p>
          </div>

          <div className="card p-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                我们已向 <span className="font-medium text-gray-900 dark:text-white">{email}</span> 发送了密码重置链接。
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                请在24小时内点击邮件中的链接重置密码。如果没有收到邮件，请检查垃圾邮件文件夹。
              </p>
              <div className="pt-2">
                <Link href="/login" className="btn-primary w-full">
                  返回登录
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Key className="w-7 h-7 text-gray-600 dark:text-gray-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            忘记密码
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            输入您的邮箱地址，我们将发送重置链接
          </p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="alert alert-error mb-5">
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label htmlFor="email" className="form-label">邮箱地址</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleInputChange}
                className="input"
                placeholder="请输入邮箱地址"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  发送中...
                </>
              ) : (
                '发送重置链接'
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link href="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              返回登录
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2024 Idrop.in 云集
        </p>
      </div>
    </div>
  );
}
