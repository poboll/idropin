'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores';
import { apiClient, extractApiError } from '@/lib/api/client';
import { User, Mail, Calendar, Key, Camera, Lock, Loader2, ChevronDown } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [verifyType, setVerifyType] = useState<'password' | 'email' | 'phone'>('password');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);
    try {
      await apiClient.put('/user/password', {
        oldPassword: verifyType === 'password' ? oldPassword : undefined,
        newPassword,
        verifyType,
        verifyCode: verifyType !== 'password' ? verifyCode : undefined,
      });
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setVerifyCode('');
      setTimeout(() => setShowPasswordForm(false), 2000);
    } catch (err) {
      const apiError = extractApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="page-header">
        <h1 className="page-title">个人资料</h1>
        <p className="page-description">管理你的账户信息</p>
      </div>

      <div className="card p-8">
        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="relative group cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 text-2xl font-semibold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.username}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">普通用户</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="form-group">
            <label className="form-label">用户名</label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">{user?.username}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">邮箱</label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">{user?.email || '未绑定邮箱'}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">注册时间</label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white">
                {user?.createdAt ? formatDate(user.createdAt) : '-'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">账户ID</label>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Key className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900 dark:text-white font-mono">{user?.id}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-8">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowPasswordForm(!showPasswordForm)}
        >
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-400" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">修改密码</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">更新你的登录密码</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showPasswordForm ? 'rotate-180' : ''}`} />
        </div>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">密码修改成功！</p>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">验证方式</label>
              <div className="grid grid-cols-3 gap-2">
                {(['password', 'email', 'phone'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setVerifyType(type)}
                    className={`p-2 rounded-lg border text-sm transition-colors ${
                      verifyType === type
                        ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {type === 'password' ? '原密码验证' : type === 'email' ? '邮箱验证码' : '手机验证码'}
                  </button>
                ))}
              </div>
            </div>

            {verifyType === 'password' ? (
              <div className="form-group">
                <label className="form-label">原密码</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="请输入原密码"
                  className="input"
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">{verifyType === 'email' ? '邮箱' : '手机'}验证码</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="请输入验证码"
                    className="input flex-1"
                    required
                  />
                  <button type="button" className="btn-secondary whitespace-nowrap">
                    发送验证码
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
                className="input"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                className="input"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  '确认修改'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
