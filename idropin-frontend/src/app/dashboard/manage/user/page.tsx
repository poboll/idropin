'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, MessageSquare } from 'lucide-react';
import Modal from '@/components/Modal';
import { formatDate, formatSize } from '@/lib/utils/string';

enum UserStatus {
  NORMAL = 0,
  FREEZE = 1,
  BAN = 2,
}

interface UserItem {
  id: number;
  account: string;
  phone?: string;
  status: UserStatus;
  joinTime: string;
  loginTime?: string;
  loginCount: number;
  openTime?: string;
  fileCount: number;
  ossCount: number;
  usage: number;
  limitSize: number;
  wallet: number;
  cost: number;
  downloadCount: number;
  downloadSize: number;
  limitUpload: boolean;
}

const statusTypeList = [
  { label: '正常', type: UserStatus.NORMAL },
  { label: '冻结', type: UserStatus.FREEZE },
  { label: '封禁', type: UserStatus.BAN },
];

const sortTypeList = [
  { label: 'ID', value: 'id' },
  { label: '累计上传数量', value: 'fileCount' },
  { label: '累计占用空间', value: 'usage' },
  { label: '登录次数', value: 'loginCount' },
  { label: '累计费用', value: 'cost' },
];

export default function UserManagePage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userStatusType, setUserStatusType] = useState<UserStatus>(UserStatus.NORMAL);
  const [sortType, setSortType] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchWord, setSearchWord] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pageCurrent, setPageCurrent] = useState(1);

  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showResetPwdDialog, setShowResetPwdDialog] = useState(false);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<UserStatus>(UserStatus.NORMAL);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [newLimitSize, setNewLimitSize] = useState(2);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const mockUsers: UserItem[] = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      account: `user${i + 1}@example.com`,
      phone: i % 3 === 0 ? `138${String(i).padStart(8, '0')}` : undefined,
      status: i % 10 === 0 ? UserStatus.FREEZE : i % 20 === 0 ? UserStatus.BAN : UserStatus.NORMAL,
      joinTime: new Date(Date.now() - i * 86400000 * 10).toISOString(),
      loginTime: new Date(Date.now() - i * 3600000).toISOString(),
      loginCount: Math.floor(Math.random() * 100),
      fileCount: Math.floor(Math.random() * 500),
      ossCount: Math.floor(Math.random() * 200),
      usage: Math.floor(Math.random() * 2 * 1024 * 1024 * 1024),
      limitSize: 2,
      wallet: 2 + Math.random() * 10,
      cost: Math.random() * 5,
      downloadCount: Math.floor(Math.random() * 1000),
      downloadSize: Math.floor(Math.random() * 5 * 1024 * 1024 * 1024),
      limitUpload: i % 15 === 0,
    }));
    setUsers(mockUsers);
    alert('列表数据刷新成功');
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => u.status === userStatusType)
      .filter(u => {
        if (!searchWord) return true;
        return `${u.id} ${u.account} ${u.phone || ''}`.toLowerCase().includes(searchWord.toLowerCase());
      })
      .sort((a, b) => {
        const aVal = a[sortType as keyof UserItem] as number;
        const bVal = b[sortType as keyof UserItem] as number;
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
  }, [users, userStatusType, searchWord, sortType, sortOrder]);

  const pageCount = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = useMemo(() => {
    const start = (pageCurrent - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, pageCurrent, pageSize]);

  const handleChangeStatus = (userId: number, status: UserStatus) => {
    setSelectedUserId(userId);
    setNewStatus(status);
    setShowStatusDialog(true);
  };

  const handleSaveStatus = () => {
    setUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, status: newStatus } : u));
    setShowStatusDialog(false);
    alert('修改成功');
  };

  const handleResetPassword = (userId: number) => {
    setSelectedUserId(userId);
    setNewPassword('');
    setNewPasswordConfirm('');
    setShowResetPwdDialog(true);
  };

  const handleSavePassword = () => {
    if (newPassword.length < 6 || newPassword.length > 16) {
      alert('密码格式不正确(6-16位)');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      alert('两次输入的密码不一致');
      return;
    }
    setShowResetPwdDialog(false);
    alert('重置成功');
  };

  const handleChangeLimit = (userId: number, size: number) => {
    setSelectedUserId(userId);
    setNewLimitSize(size);
    setShowLimitDialog(true);
  };

  const handleSaveLimit = () => {
    setUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, limitSize: newLimitSize } : u));
    setShowLimitDialog(false);
    alert('修改成功');
  };

  const handleSendMessage = (userId: number) => {
    setSelectedUserId(userId);
    setMessageText('');
    setShowMessageDialog(true);
  };

  const handleConfirmSendMessage = () => {
    setShowMessageDialog(false);
    alert('推送成功');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">状态</span>
            <select
              value={userStatusType}
              onChange={(e) => { setUserStatusType(Number(e.target.value)); setPageCurrent(1); }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
            >
              {statusTypeList.map((item) => (
                <option key={item.type} value={item.type}>{item.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">排序</span>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
            >
              {sortTypeList.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="asc">升序</option>
              <option value="desc">降序</option>
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchWord}
              onChange={(e) => setSearchWord(e.target.value)}
              placeholder="请输入要检索的内容"
              className="w-full pl-9 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            onClick={loadUsers}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>

          <button
            onClick={() => handleSendMessage(0)}
            className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600"
          >
            <MessageSquare className="w-4 h-4" />
            推送全局消息
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">ID</th>
                <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">账号</th>
                <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">手机号</th>
                <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">统计</th>
                <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">文件</th>
                <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">云空间</th>
                <th className="py-2 px-2 text-left font-medium text-gray-600 dark:text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${user.limitUpload ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                >
                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{user.id}</td>
                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300 max-w-[150px] truncate">{user.account}</td>
                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{user.phone || '-'}</td>
                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300 text-xs">
                    <div>登录次数: {user.loginCount}</div>
                    <div>最后登录: {user.loginTime ? formatDate(new Date(user.loginTime)) : '-'}</div>
                  </td>
                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300 text-xs">
                    <div>累计: {user.fileCount} / {formatSize(user.usage)}</div>
                    <div>OSS: {user.ossCount}</div>
                  </td>
                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300 text-xs">
                    <div>￥: {user.cost.toFixed(2)} / {user.wallet.toFixed(2)}</div>
                    <div>空间: {formatSize(user.usage)} / {user.limitSize}GB</div>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => handleChangeStatus(user.id, user.status)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        状态
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        密码
                      </button>
                      <button
                        onClick={() => handleChangeLimit(user.id, user.limitSize)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        上限
                      </button>
                      <button
                        onClick={() => handleSendMessage(user.id)}
                        className="text-xs text-orange-600 hover:text-orange-700"
                      >
                        消息
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <span className="text-sm text-gray-500">共 {filteredUsers.length} 条</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPageCurrent(1); }}
              className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
            >
              <option value={10}>10条/页</option>
              <option value={50}>50条/页</option>
              <option value={100}>100条/页</option>
            </select>
            <div className="flex gap-1">
              <button
                onClick={() => setPageCurrent(p => Math.max(1, p - 1))}
                disabled={pageCurrent <= 1}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm">{pageCurrent} / {pageCount}</span>
              <button
                onClick={() => setPageCurrent(p => Math.min(pageCount, p + 1))}
                disabled={pageCurrent >= pageCount}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showStatusDialog} onClose={() => setShowStatusDialog(false)} title="状态修改">
        <div className="space-y-4">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            {statusTypeList.map((item) => (
              <option key={item.type} value={item.type}>{item.label}</option>
            ))}
          </select>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowStatusDialog(false)} className="px-4 py-2 text-sm border rounded">取消</button>
            <button onClick={handleSaveStatus} className="px-4 py-2 text-sm bg-blue-600 text-white rounded">确定</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showResetPwdDialog} onClose={() => setShowResetPwdDialog(false)} title="密码重置">
        <div className="space-y-4">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="请输入新密码"
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            placeholder="请再次输入"
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowResetPwdDialog(false)} className="px-4 py-2 text-sm border rounded">取消</button>
            <button onClick={handleSavePassword} className="px-4 py-2 text-sm bg-blue-600 text-white rounded">确定</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showLimitDialog} onClose={() => setShowLimitDialog(false)} title="修改空间上限">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={newLimitSize}
              onChange={(e) => setNewLimitSize(Number(e.target.value))}
              className="flex-1 px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-gray-500">GB</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowLimitDialog(false)} className="px-4 py-2 text-sm border rounded">取消</button>
            <button onClick={handleSaveLimit} className="px-4 py-2 text-sm bg-blue-600 text-white rounded">确定</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showMessageDialog} onClose={() => setShowMessageDialog(false)} title="消息推送">
        <div className="space-y-4">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={6}
            placeholder="输入要推送的消息，支持HTML内容"
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowMessageDialog(false)} className="px-4 py-2 text-sm border rounded">取消</button>
            <button onClick={handleConfirmSendMessage} className="px-4 py-2 text-sm bg-blue-600 text-white rounded">确定</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
