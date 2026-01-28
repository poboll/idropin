'use client';

import { useState, useEffect } from 'react';
import { getUserTasks, deleteTask, type CollectionTask } from '@/lib/api/tasks';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, Clock, Eye, Trash2, Share2, Settings, MoreVertical, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function TaskList() {
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await getUserTasks();
      setTasks(data);
    } catch (err: any) {
      setError(err.message || '加载任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？此操作不可恢复。')) {
      return;
    }

    try {
      await deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      
      // 显示成功提示
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50';
      successDiv.innerHTML = `<span>任务已删除</span>`;
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 2000);
    } catch (err: any) {
      alert(err.message || '删除任务失败');
    }
  };

  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { label: string; icon: any; className: string; bgClass: string }> = {
      OPEN: { 
        label: '进行中', 
        icon: CheckCircle2,
        className: 'text-green-700 border-green-200',
        bgClass: 'bg-green-50'
      },
      CLOSED: { 
        label: '已关闭', 
        icon: XCircle,
        className: 'text-gray-700 border-gray-200',
        bgClass: 'bg-gray-50'
      },
      EXPIRED: { 
        label: '已过期', 
        icon: AlertCircle,
        className: 'text-red-700 border-red-200',
        bgClass: 'bg-red-50'
      },
    };

    return statusMap[status] || statusMap.OPEN;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-900">加载失败</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
          <svg
            className="w-10 h-10 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">暂无收集任务</h3>
        <p className="text-slate-500 mb-6">创建一个新的收集任务开始吧</p>
        <button
          onClick={() => window.location.href = '/dashboard/tasks/new'}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
        >
          创建任务
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tasks.map((task) => {
        const statusConfig = getStatusConfig(task.status);
        const StatusIcon = statusConfig.icon;
        
        return (
          <div
            key={task.id}
            className="group relative bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* 状态标签 */}
            <div className="absolute top-4 right-4">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${statusConfig.className} ${statusConfig.bgClass} text-xs font-semibold`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </div>
            </div>

            {/* 任务标题 */}
            <h3 className="text-xl font-bold text-slate-800 mb-3 pr-24 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {task.title}
            </h3>

            {/* 任务描述 */}
            {task.description && (
              <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* 任务信息 */}
            <div className="space-y-2 mb-6">
              {task.deadline && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">截止时间</p>
                    <p className="font-medium text-slate-700">{new Date(task.deadline).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">创建时间</p>
                  <p className="font-medium text-slate-700">
                    {formatDistanceToNow(new Date(task.createdAt), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => (window.location.href = `/dashboard/tasks/${task.id}`)}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                查看详情
              </button>
              <button
                onClick={() => setActiveMenu(activeMenu === task.id ? null : task.id)}
                className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors relative"
              >
                <MoreVertical className="w-5 h-5" />
                
                {/* 下拉菜单 */}
                {activeMenu === task.id && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-10">
                    <button
                      onClick={() => {
                        window.location.href = `/dashboard/tasks/${task.id}/settings`;
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                    >
                      <Settings className="w-4 h-4" />
                      设置
                    </button>
                    <button
                      onClick={async () => {
                        const shareUrl = `${window.location.origin}/task/${task.id}`;
                        try {
                          await navigator.clipboard.writeText(shareUrl);
                          // 显示成功提示
                          const toast = document.createElement('div');
                          toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slide-in';
                          toast.innerHTML = `
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>已复制分享链接到剪贴板</span>
                          `;
                          document.body.appendChild(toast);
                          setTimeout(() => toast.remove(), 3000);
                        } catch (err) {
                          alert('复制失败，请手动复制链接');
                        }
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                    >
                      <Share2 className="w-4 h-4" />
                      分享
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        handleDelete(task.id);
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                )}
              </button>
            </div>

            {/* 悬停效果装饰 */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
        );
      })}
    </div>
  );
}
