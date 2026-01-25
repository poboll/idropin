'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    phoneCode: '',
  });
  const [bindPhone, setBindPhone] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

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
      setLocalError('请输入正确的手机号');
      return;
    }
    
    setIsSendingCode(true);
    setLocalError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCountdown(120);
      alert('验证码已发送，请注意查看手机短信');
    } catch {
      setLocalError('发送验证码失败，请重试');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');

    if (!formData.username.trim()) {
      setLocalError('请输入用户名');
      return;
    }

    if (formData.username.length < 3 || formData.username.length > 50) {
      setLocalError('用户名长度必须在3-50个字符之间');
      return;
    }

    if (!formData.email.trim()) {
      setLocalError('请输入邮箱');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setLocalError('请输入有效的邮箱地址');
      return;
    }

    if (!formData.password) {
      setLocalError('请输入密码');
      return;
    }

    if (formData.password.length < 6 || formData.password.length > 16) {
      setLocalError('密码长度应为6-16位');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('两次密码输入不一致');
      return;
    }

    if (bindPhone) {
      if (!validatePhone(formData.phone)) {
        setLocalError('请输入正确的手机号');
        return;
      }
      if (!validateCode(formData.phoneCode)) {
        setLocalError('验证码格式不正确(4-6位数字)');
        return;
      }
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch {
      // error handled in store
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 py-12">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="relative w-full max-w-md px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
            云集
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            智能文件收集与管理平台
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 border border-white/50 dark:border-slate-700/50 p-8">
          <h2 className="text-xl font-medium text-slate-800 dark:text-white mb-6">
            创建账户
          </h2>

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl">
              <p className="text-green-600 dark:text-green-400 text-sm">注册成功！正在跳转到登录页...</p>
            </div>
          )}

          {displayError && !success && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-sm">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="3-50个字符"
                  disabled={isLoading || success}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  disabled={isLoading || success}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="6-16位密码"
                  disabled={isLoading || success}
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
                  placeholder="再次输入密码"
                  disabled={isLoading || success}
                />
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <label className="flex items-center cursor-pointer mb-4">
                <input
                  type="checkbox"
                  checked={bindPhone}
                  onChange={(e) => setBindPhone(e.target.checked)}
                  className="w-4 h-4 text-blue-500 bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading || success}
                />
                <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                  绑定手机号（可选）
                </span>
              </label>

              {bindPhone && (
                <>
                  <div className="mb-4">
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
                        disabled={isLoading || success}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phoneCode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      验证码
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          id="phoneCode"
                          name="phoneCode"
                          type="text"
                          value={formData.phoneCode}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="请输入验证码"
                          maxLength={6}
                          disabled={isLoading || success}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={countdown > 0 || isSendingCode || isLoading || success}
                        className="px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap min-w-[100px]"
                      >
                        {countdown > 0 ? `${countdown}s` : isSendingCode ? '发送中...' : '获取验证码'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              已有账户？{' '}
              <Link href="/login" className="text-blue-500 hover:text-blue-600 font-medium">
                立即登录
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-8">
          © 2024 Idrop.in 云集
        </p>
      </div>
    </div>
  );
}
