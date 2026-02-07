'use client';

import { useState, useEffect, FormEvent, ChangeEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Phone, Lock, KeyRound, Mail } from 'lucide-react';
import { confirmPasswordReset } from '@/lib/api/auth';
import { RouteGuard } from '@/components/RouteGuard';

type ResetMode = 'email' | 'phone';

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [resetMode, setResetMode] = useState<ResetMode>(token ? 'email' : 'phone');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
    phone: '',
    code: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);

  useEffect(() => {
    if (token) {
      setResetMode('email');
    }
  }, [token]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validatePhone = (phone: string) => /^1[3-9]\d{9}$/.test(phone);
  const validateCode = (code: string) => /^\d{4,6}$/.test(code);

  const handleSendCode = async () => {
    if (!validatePhone(formData.phone)) {
      setError('请输入正确的手机号');
      return;
    }
    
    setIsSendingCode(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCountdown(120);
      alert('验证码已发送，请注意查看手机短信');
    } catch {
      setError('发送验证码失败，请重试');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!formData.newPassword) {
      setError('请输入新密码');
      return;
    }

    if (formData.newPassword.length < 6 || formData.newPassword.length > 16) {
      setError('密码长度应为6-16位');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (resetMode === 'phone') {
      if (!validatePhone(formData.phone)) {
        setError('请输入正确的手机号');
        return;
      }
      if (!validateCode(formData.code)) {
        setError('验证码格式不正确(4-6位数字)');
        return;
      }
    } else if (!token) {
      setError('无效的重置链接');
      return;
    }

    setIsLoading(true);

    try {
      if (resetMode === 'email' && token) {
        await confirmPasswordReset(token, formData.newPassword);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || '密码重置失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
              密码重置成功
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              正在跳转到登录页面...
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
            <div className="text-center space-y-4">
              <p className="text-slate-600 dark:text-slate-300">
                您的密码已成功重置，请使用新密码登录。
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-block w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-sm transition-colors text-center"
                >
                  立即登录
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
            重置密码
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {resetMode === 'email' ? '通过邮箱链接重置密码' : '通过手机验证码重置密码'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          {!token && (
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setResetMode('phone')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  resetMode === 'phone'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Phone className="w-4 h-4 inline mr-1" />
                手机号重置
              </button>
              <button
                type="button"
                onClick={() => setResetMode('email')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  resetMode === 'email'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-1" />
                邮箱链接重置
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {resetMode === 'email' && !token && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
              <p className="text-blue-600 dark:text-blue-400 text-sm">
                请前往 <Link href="/forgot-password" className="underline">忘记密码</Link> 页面获取重置链接
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {resetMode === 'phone' && (
              <>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    手机号
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入手机号"
                      maxLength={11}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    验证码
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        id="code"
                        name="code"
                        type="text"
                        value={formData.code}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="请输入验证码"
                        maxLength={6}
                        disabled={isLoading}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={countdown > 0 || isSendingCode}
                      className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap min-w-[100px]"
                    >
                      {countdown > 0 ? `${countdown}s` : isSendingCode ? '发送中...' : '获取验证码'}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                新密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="请输入新密码 (6-16位)"
                  disabled={isLoading || (resetMode === 'email' && !token)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="请再次输入新密码"
                  disabled={isLoading || (resetMode === 'email' && !token)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || (resetMode === 'email' && !token)}
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '重置中...' : '重置密码'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 text-sm">
              返回登录
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-8">
          © 2024 在虎
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <RouteGuard>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="text-slate-500">加载中...</div>
        </div>
      }>
        <ResetPasswordFormContent />
      </Suspense>
    </RouteGuard>
  );
}
