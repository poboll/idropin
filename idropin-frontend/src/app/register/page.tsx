'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, Loader2, Check } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';
import { RouteGuard } from '@/components/RouteGuard';
import { ErrorToast, SuccessToast } from '@/components/ui/ErrorDisplay';

function RegisterForm() {
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
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

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

  // 自动关闭Toast
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const validatePhone = (phone: string) => /^1[3-9]\d{9}$/.test(phone);
  const validateCode = (code: string) => /^\d{4,6}$/.test(code);

  const handleSendCode = async () => {
    if (!validatePhone(formData.phone)) {
      setErrorToast('请输入正确的手机号');
      return;
    }
    
    setIsSendingCode(true);
    setLocalError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCountdown(120);
      setSuccessToast('验证码已发送，请注意查看手机短信');
    } catch {
      setErrorToast('发送验证码失败，请重试');
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
    <div className="min-h-screen bg-white dark:bg-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
            <Upload className="w-4 h-4 text-white dark:text-gray-900" />
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">云集</span>
        </Link>
        <Link
          href="/login"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          登录
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              创建账户
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              注册云集，开始智能文件管理
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">注册成功！</p>
                <p className="text-xs text-green-600 dark:text-green-400">正在跳转到登录页...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {displayError && !success && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                className="input"
                placeholder="3-50个字符"
                disabled={isLoading || success}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                邮箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input"
                placeholder="your@email.com"
                disabled={isLoading || success}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input"
                placeholder="6-16位密码"
                disabled={isLoading || success}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                确认密码
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="input"
                placeholder="再次输入密码"
                disabled={isLoading || success}
                autoComplete="new-password"
              />
            </div>

            {/* Optional Phone Binding */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bindPhone}
                  onChange={(e) => setBindPhone(e.target.checked)}
                  className="w-4 h-4 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 rounded focus:ring-gray-900 dark:focus:ring-white"
                  disabled={isLoading || success}
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  绑定手机号（可选）
                </span>
              </label>

              {bindPhone && (
                <div className="mt-4 space-y-4">
                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      手机号
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="请输入手机号"
                      maxLength={11}
                      disabled={isLoading || success}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phoneCode" className="form-label">
                      验证码
                    </label>
                    <div className="flex gap-3">
                      <input
                        id="phoneCode"
                        name="phoneCode"
                        type="text"
                        value={formData.phoneCode}
                        onChange={handleInputChange}
                        className="input flex-1"
                        placeholder="请输入验证码"
                        maxLength={6}
                        disabled={isLoading || success}
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={countdown > 0 || isSendingCode || isLoading || success}
                        className="btn-secondary whitespace-nowrap min-w-[100px]"
                      >
                        {countdown > 0 ? `${countdown}s` : isSendingCode ? '发送中...' : '获取验证码'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || success}
              className="btn-primary w-full mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              已有账户？{' '}
              <Link href="/login" className="text-gray-900 dark:text-white font-medium hover:underline">
                立即登录
              </Link>
            </p>
          </div>

          <p className="mt-6 text-xs text-center text-gray-400 dark:text-gray-500">
            注册即表示您同意我们的{' '}
            <Link href="/terms" className="underline hover:text-gray-600 dark:hover:text-gray-400">
              服务条款
            </Link>
            {' '}和{' '}
            <Link href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-400">
              隐私政策
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          © 2024 在虎
        </p>
      </footer>

      {/* Error Toast */}
      {errorToast && (
        <ErrorToast
          message={errorToast}
          onClose={() => setErrorToast(null)}
        />
      )}

      {/* Success Toast */}
      {successToast && (
        <SuccessToast
          message={successToast}
          onClose={() => setSuccessToast(null)}
        />
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <RouteGuard>
      <RegisterForm />
    </RouteGuard>
  );
}
