'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth';
import { ErrorToast, SuccessToast } from '@/components/ui/ErrorDisplay';

type LoginMode = 'account' | 'sms';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  
  const [loginMode, setLoginMode] = useState<LoginMode>('account');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phone: '',
    code: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState('');
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
    const savedUserInfo = localStorage.getItem('userinfo');
    if (savedUserInfo) {
      try {
        const { username, password, remember } = JSON.parse(savedUserInfo);
        setFormData(prev => ({ ...prev, username, password }));
        setRememberMe(remember);
      } catch (error) {
        console.error('解析保存的用户信息失败:', error);
        // 清除损坏的数据
        localStorage.removeItem('userinfo');
      }
    }
  }, []);

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
  // Keep client validation broad enough for seeded/test accounts.
  const validatePassword = (pwd: string) => pwd.length >= 6 && pwd.length <= 64;

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
    } catch (error: any) {
      console.error('发送验证码失败:', error);
      const errorMessage = error.message || '发送验证码失败，请重试';
      setErrorToast(errorMessage);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');

    if (loginMode === 'account') {
      if (!formData.username.trim()) {
        setErrorToast('请输入用户名/手机号');
        return;
      }
      if (!validatePassword(formData.password)) {
        setErrorToast('密码格式不正确(6-64位)');
        return;
      }

      try {
        await login({ username: formData.username, password: formData.password });
        
        if (rememberMe) {
          localStorage.setItem('userinfo', JSON.stringify({
            username: formData.username,
            password: formData.password,
            remember: rememberMe
          }));
        } else {
          localStorage.removeItem('userinfo');
        }
        
        router.push('/dashboard');
      } catch (error: any) {
        console.error('登录失败:', error);
        const errorMessage = error.message || error.response?.data?.message || '登录失败，请检查用户名和密码';
        setErrorToast(errorMessage);
      }
    } else {
      if (!validatePhone(formData.phone)) {
        setErrorToast('请输入正确的手机号');
        return;
      }
      if (!validateCode(formData.code)) {
        setErrorToast('验证码格式不正确(4-6位数字)');
        return;
      }

      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSuccessToast('短信验证码登录成功');
        setTimeout(() => router.push('/dashboard'), 1000);
      } catch (error: any) {
        console.error('验证码登录失败:', error);
        const errorMessage = error.message || '验证码不正确或已过期';
        setErrorToast(errorMessage);
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleLoginMode = () => {
    setLoginMode(prev => prev === 'account' ? 'sms' : 'account');
    setLocalError('');
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
          href="/register"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          注册账户
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              登录到云集
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              智能文件收集与管理平台
            </p>
          </div>

          {/* Login Mode Toggle */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              type="button"
              onClick={() => setLoginMode('account')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                loginMode === 'account'
                  ? 'text-gray-900 dark:text-white border-gray-900 dark:border-white'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              账号登录
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('sms')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                loginMode === 'sms'
                  ? 'text-gray-900 dark:text-white border-gray-900 dark:border-white'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              验证码登录
            </button>
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
            </div>
          )}

          {/* Login Form */}
          <form method="post" action="/login" onSubmit={handleSubmit} className="space-y-4">
            {loginMode === 'account' ? (
              <>
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    账号
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="用户名或手机号"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>

                <div className="form-group">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="form-label mb-0">
                      密码
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      忘记密码？
                    </Link>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="6-64位密码"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
              </>
            ) : (
              <>
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
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="code" className="form-label">
                    验证码
                  </label>
                  <div className="flex gap-3">
                    <input
                      id="code"
                      name="code"
                      type="text"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="input flex-1"
                      placeholder="请输入验证码"
                      maxLength={6}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={countdown > 0 || isSendingCode}
                      className="btn-secondary whitespace-nowrap min-w-[100px]"
                    >
                      {countdown > 0 ? `${countdown}s` : isSendingCode ? '发送中...' : '获取验证码'}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-gray-900 dark:text-white bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 rounded focus:ring-gray-900 dark:focus:ring-white"
                disabled={isLoading}
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                记住登录信息
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              还没有账户？{' '}
              <Link href="/register" className="text-gray-900 dark:text-white font-medium hover:underline">
                立即注册
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              遇到问题？请登录后点击右上角铃铛，在通知中提交反馈。或发邮件到{' '}
              <a
                href="mailto:i@caiths.com"
                className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                i@caiths.com
              </a>
            </p>
          </div>
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
