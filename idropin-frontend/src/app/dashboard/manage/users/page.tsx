'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, RefreshCw, Send, Key, Phone, MessageSquare, 
  HardDrive, LogOut, MoreHorizontal, Check, X, User,
  ChevronLeft, ChevronRight, Shield
} from 'lucide-react';
import { 
  getUsers, updateUserStatus, resetUserPassword, bindUserPhone,
  sendMessageToUser, updateUserQuota, forceUserLogout, broadcastMessage,
  formatFileSize, AdminUser, updateUserRole
} from '@/lib/api/admin';

type DialogType = 'message' | 'quota' | 'phone' | 'broadcast' | 'role' | null;

export default function UsersManagePage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog form states
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [storageLimit, setStorageLimit] = useState('');
  const [taskLimit, setTaskLimit] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers({
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        page,
        size: pageSize
      });
      setUsers(data.records);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleStatusChange = async (user: AdminUser, newStatus: string) => {
    try {
      await updateUserStatus(user.id, newStatus);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    if (!confirm(`确定要重置用户 ${user.username} 的密码吗？`)) return;
    try {
      const newPassword = await resetUserPassword(user.id);
      alert(`密码已重置为: ${newPassword}`);
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      const errorMessage = error.message || error.response?.data?.message || '重置密码失败';
      alert(`重置密码失败: ${errorMessage}`);
    }
  };

  const handleForceLogout = async (user: AdminUser) => {
    if (!confirm(`确定要强制用户 ${user.username} 下线吗？`)) return;
    try {
      await forceUserLogout(user.id);
      alert('用户已被强制下线');
    } catch (error: any) {
      console.error('Failed to force logout:', error);
      const errorMessage = error.message || error.response?.data?.message || '操作失败';
      alert(`操作失败: ${errorMessage}`);
    }
  };

  const openDialog = (type: DialogType, user?: AdminUser) => {
    setDialogType(type);
    if (user) {
      setSelectedUser(user);
      if (type === 'phone') setPhoneNumber(user.phone || '');
      if (type === 'quota') {
        setStorageLimit(String(Math.round(user.storageLimit / 1024 / 1024)));
        setTaskLimit(String(user.taskLimit));
      }
      if (type === 'role') setSelectedRole(user.role);
    }
    setMessageTitle('');
    setMessageContent('');
  };

  const closeDialog = () => {
    setDialogType(null);
    setSelectedUser(null);
    setMessageTitle('');
    setMessageContent('');
    setPhoneNumber('');
    setStorageLimit('');
    setTaskLimit('');
    setSelectedRole('');
  };

  const handleSendMessage = async () => {
    if (!messageTitle.trim() || !messageContent.trim()) {
      alert('请填写标题和内容');
      return;
    }
    setActionLoading(true);
    try {
      if (dialogType === 'broadcast') {
        await broadcastMessage(messageTitle, messageContent);
        alert('全局消息已发送');
      } else if (selectedUser) {
        await sendMessageToUser(selectedUser.id, messageTitle, messageContent);
        alert('消息已发送');
      }
      closeDialog();
    } catch (error: any) {
      console.error('Failed to send message:', error);
      const errorMessage = error.message || error.response?.data?.message || '发送失败';
      alert(`发送失败: ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBindPhone = async () => {
    if (!phoneNumber.trim() || !selectedUser) return;
    setActionLoading(true);
    try {
      await bindUserPhone(selectedUser.id, phoneNumber);
      alert('手机号已绑定');
      closeDialog();
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to bind phone:', error);
      const errorMessage = error.message || error.response?.data?.message || '绑定失败';
      alert(`绑定失败: ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateQuota = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const storageLimitBytes = parseInt(storageLimit) * 1024 * 1024;
      const taskLimitNum = parseInt(taskLimit);
      await updateUserQuota(selectedUser.id, storageLimitBytes, taskLimitNum);
      alert('配额已更新');
      closeDialog();
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to update quota:', error);
      const errorMessage = error.message || error.response?.data?.message || '更新失败';
      alert(`更新失败: ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !selectedRole) return;
    setActionLoading(true);
    try {
      await updateUserRole(selectedUser.id, selectedRole);
      alert('角色已更新');
      closeDialog();
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      const errorMessage = error.message || error.response?.data?.message || '更新失败';
      alert(`更新失败: ${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">用户管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理平台用户账号</p>
        </div>
        <button
          onClick={() => openDialog('broadcast')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Send className="w-4 h-4" />
          推送全局消息
        </button>
      </div>

      {/* 子导航 */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        <Link href="/dashboard/manage" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">概况</Link>
        <Link href="/dashboard/manage/users" className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg font-medium">用户</Link>
        <Link href="/dashboard/manage/feedback" className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">需求</Link>
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
          <option value="active">正常</option>
          <option value="disabled">禁用</option>
        </select>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 用户列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">手机号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后登录</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">暂无用户数据</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{user.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'SUPER_ADMIN' 
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : user.role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {user.role === 'SUPER_ADMIN' ? '超级管理员' : user.role === 'ADMIN' ? '管理员' : '普通用户'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatTime(user.lastLoginAt)}</p>
                      {user.lastLoginIp && <p className="text-xs text-gray-400">{user.lastLoginIp}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {user.status === 'active' ? '正常' : '禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStatusChange(user, user.status === 'active' ? 'disabled' : 'active')}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title={user.status === 'active' ? '禁用' : '启用'}
                        >
                          {user.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openDialog('role', user)}
                          className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                          title="修改角色"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                          title="重置密码"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDialog('phone', user)}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          title="绑定手机号"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDialog('message', user)}
                          className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                          title="发送消息"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDialog('quota', user)}
                          className="p-1.5 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition-colors"
                          title="修改配额"
                        >
                          <HardDrive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleForceLogout(user)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="强制下线"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* 对话框 */}
      {dialogType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeDialog}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            {(dialogType === 'message' || dialogType === 'broadcast') && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {dialogType === 'broadcast' ? '推送全局消息' : `发送消息给 ${selectedUser?.username}`}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
                    <input
                      type="text"
                      value={messageTitle}
                      onChange={(e) => setMessageTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      placeholder="请输入消息标题"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">内容</label>
                    <textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                      placeholder="请输入消息内容"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={closeDialog} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">取消</button>
                  <button
                    onClick={handleSendMessage}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? '发送中...' : '发送'}
                  </button>
                </div>
              </>
            )}

            {dialogType === 'phone' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  绑定手机号 - {selectedUser?.username}
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">手机号</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    placeholder="请输入手机号"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={closeDialog} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">取消</button>
                  <button
                    onClick={handleBindPhone}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? '绑定中...' : '绑定'}
                  </button>
                </div>
              </>
            )}

            {dialogType === 'quota' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  修改配额 - {selectedUser?.username}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">存储上限 (MB)</label>
                    <input
                      type="number"
                      value={storageLimit}
                      onChange={(e) => setStorageLimit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      placeholder="请输入存储上限"
                    />
                    <p className="text-xs text-gray-500 mt-1">当前已用: {formatFileSize(selectedUser?.storageUsed || 0)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">任务上限</label>
                    <input
                      type="number"
                      value={taskLimit}
                      onChange={(e) => setTaskLimit(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      placeholder="请输入任务上限"
                    />
                    <p className="text-xs text-gray-500 mt-1">当前任务数: {selectedUser?.taskCount || 0}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={closeDialog} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">取消</button>
                  <button
                    onClick={handleUpdateQuota}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? '更新中...' : '更新'}
                  </button>
                </div>
              </>
            )}

            {dialogType === 'role' && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  修改角色 - {selectedUser?.username}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">选择角色</label>
                    <div className="space-y-2">
                      {[
                        { value: 'USER', label: '普通用户', desc: '可以创建和管理自己的任务' },
                        { value: 'ADMIN', label: '管理员', desc: '可以管理用户和查看统计数据' },
                        { value: 'SUPER_ADMIN', label: '超级管理员', desc: '拥有所有权限' }
                      ].map((role) => (
                        <button
                          key={role.value}
                          onClick={() => setSelectedRole(role.value)}
                          className={`w-full text-left p-3 border rounded-lg transition-colors ${
                            selectedRole === role.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{role.label}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{role.desc}</p>
                            </div>
                            {selectedRole === role.value && (
                              <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">当前角色: {
                      selectedUser?.role === 'SUPER_ADMIN' ? '超级管理员' : 
                      selectedUser?.role === 'ADMIN' ? '管理员' : 
                      '普通用户'
                    }</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={closeDialog} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">取消</button>
                  <button
                    onClick={handleUpdateRole}
                    disabled={actionLoading || !selectedRole}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? '更新中...' : '更新'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
