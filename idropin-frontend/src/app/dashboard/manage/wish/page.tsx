'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, Edit3 } from 'lucide-react';
import Modal from '@/components/Modal';
import { formatDate } from '@/lib/utils/string';

enum WishStatus {
  REVIEW = 0,
  WAIT = 1,
  CLOSE = 2,
  END = 3,
  START = 4,
}

interface WishItem {
  id: string;
  title: string;
  des: string;
  contact: string;
  status: WishStatus;
  createDate: string;
}

const statusTypeList = [
  { label: '待审核', type: WishStatus.REVIEW },
  { label: '待开始', type: WishStatus.WAIT },
  { label: '关闭', type: WishStatus.CLOSE },
  { label: '已上线', type: WishStatus.END },
  { label: '开发中', type: WishStatus.START },
];

export default function WishManagePage() {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [filterLogType, setFilterLogType] = useState<number>(-1);
  const [searchWord, setSearchWord] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [pageCurrent, setPageCurrent] = useState(1);

  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDesDialog, setShowDesDialog] = useState(false);
  const [selectedWishId, setSelectedWishId] = useState<string>('');
  const [newStatus, setNewStatus] = useState<WishStatus>(WishStatus.REVIEW);
  const [formData, setFormData] = useState({ title: '', des: '' });

  useEffect(() => {
    loadWishes();
  }, []);

  const loadWishes = async () => {
    // Mock data for demonstration
    const mockWishes: WishItem[] = Array.from({ length: 25 }, (_, i) => ({
      id: `wish-${i + 1}`,
      title: `需求标题 #${i + 1}`,
      des: `这是一个详细的需求描述，用于说明第 ${i + 1} 个需求的具体内容和期望。`,
      contact: i % 3 === 0 ? `user${i + 1}@example.com` : `138${String(i).padStart(8, '0')}`,
      status: Object.values(WishStatus).filter(v => typeof v === 'number')[i % 5] as WishStatus,
      createDate: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    }));
    setWishes(mockWishes);
  };

  const filteredWishes = useMemo(() => {
    return wishes
      .filter(v => v.status === filterLogType || filterLogType === -1)
      .filter(v => {
        if (!searchWord) return true;
        const searchStr = `${formatDate(new Date(v.createDate))} ${v.title} ${v.des} ${v.contact}`;
        return searchStr.toLowerCase().includes(searchWord.toLowerCase());
      });
  }, [wishes, filterLogType, searchWord]);

  const pageCount = Math.ceil(filteredWishes.length / pageSize);
  const paginatedWishes = useMemo(() => {
    const start = (pageCurrent - 1) * pageSize;
    return filteredWishes.slice(start, start + pageSize);
  }, [filteredWishes, pageCurrent, pageSize]);

  const handleChangeStatus = (wishId: string, status: WishStatus) => {
    setSelectedWishId(wishId);
    setNewStatus(status);
    setShowStatusDialog(true);
  };

  const handleSaveStatus = () => {
    setWishes(prev => prev.map(w => w.id === selectedWishId ? { ...w, status: newStatus } : w));
    setShowStatusDialog(false);
    alert('修改成功');
  };

  const handleRewriteDes = (id: string, title: string, des: string) => {
    setSelectedWishId(id);
    setFormData({ title, des });
    setShowDesDialog(true);
  };

  const handleUpdateWish = () => {
    setWishes(prev => prev.map(w => w.id === selectedWishId ? { ...w, title: formData.title, des: formData.des } : w));
    setShowDesDialog(false);
    alert('修改成功');
  };

  const getStatusLabel = (status: WishStatus) => {
    return statusTypeList.find(s => s.type === status)?.label || '未知';
  };

  const getStatusColor = (status: WishStatus) => {
    switch (status) {
      case WishStatus.REVIEW: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case WishStatus.WAIT: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case WishStatus.CLOSE: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
      case WishStatus.END: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case WishStatus.START: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">状态</span>
            <select
              value={filterLogType}
              onChange={(e) => { setFilterLogType(Number(e.target.value)); setPageCurrent(1); }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value={-1}>全部</option>
              {statusTypeList.map((item) => (
                <option key={item.type} value={item.type}>{item.label}</option>
              ))}
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
            onClick={loadWishes}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400">提交时间</th>
                <th className="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400">标题</th>
                <th className="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400">详细描述</th>
                <th className="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400">联系方式</th>
                <th className="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400">状态</th>
                <th className="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedWishes.map((wish) => (
                <tr key={wish.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {formatDate(new Date(wish.createDate))}
                  </td>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300 font-medium max-w-[120px] truncate">
                    {wish.title}
                  </td>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                    {wish.des}
                  </td>
                  <td className="py-2 px-3 text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                    {wish.contact}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getStatusColor(wish.status)}`}>
                      {getStatusLabel(wish.status)}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => handleChangeStatus(wish.id, wish.status)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        修改状态
                      </button>
                      <button
                        onClick={() => handleRewriteDes(wish.id, wish.title, wish.des)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        修改描述
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedWishes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex justify-center items-center gap-4 mt-4">
            <span className="text-sm text-gray-500">共 {filteredWishes.length} 条</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPageCurrent(1); }}
              className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
            >
              <option value={10}>10条/页</option>
              <option value={50}>50条/页</option>
              <option value={100}>100条/页</option>
              <option value={200}>200条/页</option>
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

      <Modal isOpen={showDesDialog} onClose={() => setShowDesDialog(false)} title="需求信息">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">需求</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="一句简单明了的话概括一下"
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">详细描述</label>
            <textarea
              value={formData.des}
              onChange={(e) => setFormData({ ...formData, des: e.target.value })}
              placeholder="用朴素的话语进一步描述你的需求"
              rows={4}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowDesDialog(false)} className="px-4 py-2 text-sm border rounded">取消</button>
            <button onClick={handleUpdateWish} className="px-4 py-2 text-sm bg-blue-600 text-white rounded">确定</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
