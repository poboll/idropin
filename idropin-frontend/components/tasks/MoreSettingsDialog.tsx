import React, { useEffect, useState, useRef } from 'react';
import Modal from '@/components/Modal';
import { Task } from '@/lib/stores/task';
import * as TaskApi from '@/lib/api/tasks';
import { Calendar, Info, Users, FileText, Settings, Plus, X, Clock, Check, Upload, Trash2, Image as ImageIcon, Download, Eye } from 'lucide-react';
import { DatePicker } from '@/components/ui/DatePicker';

interface MoreSettingsDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

interface RequiredField {
  id: string;
  name: string;
  isDefault: boolean;
}

interface NameListPerson {
  id: string;
  name: string;
}

interface TaskWithCreatedAt extends Task {
  createdAt?: string;
}

export const MoreSettingsDialog: React.FC<MoreSettingsDialogProps> = ({ task, open, onClose }) => {
  const [activeTab, setActiveTab] = useState('ddl');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [taskInfo, setTaskInfo] = useState<TaskApi.TaskInfo>({});
  const [deadline, setDeadline] = useState<Date | null>(null);
  
  // Required fields state
  const [requiredFields, setRequiredFields] = useState<RequiredField[]>([
    { id: '1', name: '姓名', isDefault: true }
  ]);
  const [newFieldName, setNewFieldName] = useState('');
  
  // Name list state
  const [nameList, setNameList] = useState<NameListPerson[]>([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [nameListEnabled, setNameListEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  
  // Tip images state
  const [tipImages, setTipImages] = useState<string[]>([]);
  const tipImageInputRef = useRef<HTMLInputElement>(null);
  
  // Task import dialog state
  const [showTaskImportDialog, setShowTaskImportDialog] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<TaskWithCreatedAt[]>([]);

  useEffect(() => {
    if (task && open) {
      loadInfo(task.key);
    }
  }, [task, open]);

  const loadInfo = async (key: string) => {
    setLoading(true);
    try {
      const taskDetails = await TaskApi.getTask(key);
      if (taskDetails.deadline) {
        setDeadline(new Date(taskDetails.deadline));
      }
      
      const info = await TaskApi.getTaskMoreInfo(key);
      setTaskInfo(info);
      
      if (info.info) {
        try {
          const fields = JSON.parse(info.info);
          if (Array.isArray(fields)) {
            setRequiredFields(fields);
          }
        } catch (e) {
          console.error('Failed to parse required fields:', e);
        }
      }
      
      if (info.bindField) {
        try {
          const names = JSON.parse(info.bindField);
          if (Array.isArray(names)) {
            setNameList(names);
          }
        } catch (e) {
          console.error('Failed to parse name list:', e);
        }
      }
      
      setNameListEnabled(!!info.people);
    } catch (e) {
      console.error(e);
      setTaskInfo({});
    } finally {
      setLoading(false);
    }
  };

  const addRequiredField = () => {
    if (!newFieldName.trim()) return;
    const newField: RequiredField = {
      id: Date.now().toString(),
      name: newFieldName.trim(),
      isDefault: false
    };
    setRequiredFields([...requiredFields, newField]);
    setNewFieldName('');
  };

  const removeRequiredField = (id: string) => {
    setRequiredFields(requiredFields.filter(f => f.id !== id));
  };

  const updateRequiredField = (id: string, name: string) => {
    setRequiredFields(requiredFields.map(f => 
      f.id === id ? { ...f, name } : f
    ));
  };

  const addPersonManually = () => {
    if (!newPersonName.trim()) return;
    const exists = nameList.some(p => p.name === newPersonName.trim());
    if (exists) {
      alert('该姓名已存在');
      return;
    }
    const newPerson: NameListPerson = {
      id: Date.now().toString(),
      name: newPersonName.trim()
    };
    setNameList([...nameList, newPerson]);
    setNewPersonName('');
  };

  const removePerson = (id: string) => {
    setNameList(nameList.filter(p => p.id !== id));
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.csv')) {
      alert('请上传 .txt 或 .csv 文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const newPeople = lines.map((name, index) => ({
        id: `${Date.now()}-${index}`,
        name: name.trim()
      })).filter(p => !nameList.some(existing => existing.name === p.name));
      
      if (newPeople.length > 0) {
        setNameList([...nameList, ...newPeople]);
        // 显示成功提示
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50';
        successDiv.innerHTML = `<span>成功导入 ${newPeople.length} 个名单</span>`;
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 2000);
      } else {
        alert('没有新的名单可导入（可能都已存在）');
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTaskImport = async () => {
    try {
      const tasks = await TaskApi.getUserTasks();
      // 转换 CollectionTask 到 TaskWithCreatedAt 类型
      const mappedTasks: TaskWithCreatedAt[] = tasks
        .filter(t => t.id !== task?.key)
        .map(t => ({
          key: t.id,
          name: t.title,
          category: 'default',
          recentLog: [],
          createdAt: t.createdAt
        }));
      setAvailableTasks(mappedTasks);
      setShowTaskImportDialog(true);
    } catch (e) {
      console.error(e);
      alert('获取任务列表失败');
    }
  };

  const handleImportFromTask = async (sourceTaskId: string) => {
    try {
      const sourceInfo = await TaskApi.getTaskMoreInfo(sourceTaskId);
      if (sourceInfo.bindField) {
        const sourceNames = JSON.parse(sourceInfo.bindField);
        if (Array.isArray(sourceNames)) {
          const newPeople = sourceNames.filter(
            (p: NameListPerson) => !nameList.some(existing => existing.name === p.name)
          );
          setNameList([...nameList, ...newPeople]);
          setShowTaskImportDialog(false);
          
          // 显示成功提示
          const successDiv = document.createElement('div');
          successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50';
          successDiv.innerHTML = `<span>成功导入 ${newPeople.length} 个名单</span>`;
          document.body.appendChild(successDiv);
          setTimeout(() => successDiv.remove(), 2000);
        }
      } else {
        alert('该任务没有名单数据');
      }
    } catch (e) {
      console.error(e);
      alert('导入失败');
    }
  };

  const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 直接设置文件名，不显示alert
    setTaskInfo({...taskInfo, template: file.name});
    
    if (templateInputRef.current) {
      templateInputRef.current.value = '';
    }
  };

  const handleTipImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // 限制最多3张图片
    if (tipImages.length >= 3) {
      alert('最多只能上传3张图片');
      return;
    }

    const file = files[0];
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    // 读取图片并转换为base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      if (tipImages.length < 3) {
        setTipImages([...tipImages, imageUrl]);
      }
    };
    reader.readAsDataURL(file);

    if (tipImageInputRef.current) {
      tipImageInputRef.current.value = '';
    }
  };

  const removeTipImage = (index: number) => {
    setTipImages(tipImages.filter((_, i) => i !== index));
  };

  const handleTemplatePreview = () => {
    if (taskInfo.template) {
      // 如果是URL，直接打开
      if (taskInfo.template.startsWith('http')) {
        window.open(taskInfo.template, '_blank');
      } else {
        alert('模板文件预览功能开发中');
      }
    }
  };

  const handleTemplateDownload = () => {
    if (taskInfo.template) {
      // 如果是URL，直接下载
      if (taskInfo.template.startsWith('http')) {
        const link = document.createElement('a');
        link.href = taskInfo.template;
        link.download = taskInfo.template.split('/').pop() || 'template';
        link.click();
      } else {
        alert('模板文件下载功能开发中');
      }
    }
  };

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      const currentTask = await TaskApi.getTask(task.key);
      await TaskApi.updateTask(task.key, {
        title: currentTask.title,
        description: currentTask.description,
        deadline: deadline ? deadline.toISOString() : null,
        allowAnonymous: currentTask.allowAnonymous,
        requireLogin: currentTask.requireLogin,
        maxFileSize: currentTask.maxFileSize,
        allowedTypes: currentTask.allowedTypes
      });

      await TaskApi.updateTaskMoreInfo(task.key, {
        ddl: deadline ? deadline.toISOString() : null,
        tip: taskInfo.tip,
        people: nameListEnabled,
        format: taskInfo.format,
        template: taskInfo.template,
        bindField: JSON.stringify(nameList),
        rewrite: taskInfo.rewrite,
        info: JSON.stringify(requiredFields)
      });
      
      // 显示成功提示（2秒后自动消失）
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in';
      successDiv.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span>设置保存成功</span>
      `;
      document.body.appendChild(successDiv);
      setTimeout(() => {
        successDiv.remove();
      }, 2000);
      
      onClose();
    } catch (e) {
      console.error(e);
      // 显示错误提示
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50';
      errorDiv.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span>保存失败，请重试</span>
      `;
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        errorDiv.remove();
      }, 3000);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'ddl', label: '截止日期', icon: Calendar },
    { id: 'tip', label: '批注信息', icon: Info },
    { id: 'people', label: '限制名单', icon: Users },
    { id: 'info', label: '必填信息', icon: Settings },
    { id: 'template', label: '模板文件', icon: FileText },
  ];

  if (!task) return null;

  return (
    <Modal isOpen={open} onClose={onClose} title="更多设置" size="lg">
      <div className="flex flex-col h-[600px]">
        <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              加载中...
            </div>
          ) : (
            <>
              {activeTab === 'ddl' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">截止日期设置</h3>
                    <p className="text-sm text-slate-500 mb-4">设置任务的自动截止时间，过期后将无法提交。</p>
                    <div className="max-w-sm">
                      <DatePicker 
                        value={deadline} 
                        onChange={setDeadline} 
                        placeholder="点击设置截止时间"
                      />
                    </div>
                  </div>
                  {deadline ? (
                    <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      任务将在 {deadline.toLocaleString()} 截止
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      当前任务永久有效，无截止时间限制
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tip' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">批注/备注信息</h3>
                    <p className="text-sm text-slate-500 mb-4">在提交页面展示给用户的提示信息。</p>
                    <textarea
                      className="w-full h-48 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                      placeholder="请输入提示信息..."
                      value={taskInfo.tip || ''}
                      onChange={(e) => setTaskInfo({...taskInfo, tip: e.target.value})}
                    />
                  </div>

                  {/* 图片上传区域 */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        批注图片 <span className="text-slate-400">（可以设置图片啦！最多3张）</span>
                      </h4>
                      <button
                        onClick={() => tipImageInputRef.current?.click()}
                        disabled={tipImages.length >= 3}
                        className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-all ${
                          tipImages.length >= 3
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        上传图片
                      </button>
                    </div>

                    {/* 图片预览网格 */}
                    {tipImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {tipImages.map((image, index) => (
                          <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-blue-400 transition-all">
                            <img
                              src={image}
                              alt={`批注图片 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  window.open(image, '_blank');
                                }}
                                className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                              >
                                <Eye className="w-4 h-4 text-slate-700" />
                              </button>
                              <button
                                onClick={() => removeTipImage(index)}
                                className="p-2 bg-red-500/90 rounded-full hover:bg-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {tipImages.length === 0 && (
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-400 text-sm">
                        暂无图片，点击上方按钮添加
                      </div>
                    )}

                    <input
                      ref={tipImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleTipImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'people' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">分类列表</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">只有名单里的成员，才可提交文件 💡</p>
                  
                  <div className="flex gap-4 mb-6">
                    <button
                      onClick={() => setNameListEnabled(false)}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                        !nameListEnabled
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      关闭
                    </button>
                    <button
                      onClick={() => setNameListEnabled(true)}
                      className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                        nameListEnabled
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      查看提交情况
                    </button>
                  </div>

                  {nameListEnabled && (
                    <>
                      <div className="flex gap-2 mb-4">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          文件导入
                        </button>
                        <button
                          onClick={handleTaskImport}
                          className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          任务导入
                        </button>
                        <button
                          onClick={() => {
                            const name = prompt('请输入姓名：');
                            if (name) {
                              setNewPersonName(name);
                              setTimeout(() => addPersonManually(), 0);
                            }
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          手动添加
                        </button>
                      </div>

                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={newPersonName}
                          onChange={(e) => setNewPersonName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addPersonManually()}
                          placeholder="请输入姓名"
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={addPersonManually}
                          className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                        >
                          确定
                        </button>
                      </div>

                      <p className="text-xs text-slate-400 mb-4">
                        会自动判重，不会重复添加<br />
                        大量名单优先推荐使用文件导入
                      </p>

                      <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 flex items-center border-b border-slate-200">
                          <span className="flex-1 text-sm font-medium text-slate-700">绑定表单项</span>
                          <span className="w-24 text-sm font-medium text-slate-700 text-center">姓名</span>
                          <span className="w-20 text-sm font-medium text-slate-700 text-center">确定</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {nameList.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                              暂无名单，请添加
                            </div>
                          ) : (
                            nameList.map((person) => (
                              <div key={person.id} className="px-4 py-3 flex items-center border-b border-slate-100 hover:bg-slate-50">
                                <span className="flex-1 text-sm text-slate-700">{person.name}</span>
                                <span className="w-24 text-sm text-slate-500 text-center">姓名</span>
                                <div className="w-20 flex justify-center">
                                  <button
                                    onClick={() => removePerson(person.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-2">
                        和表单项同名字段，可以避免重复填写！！
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.csv"
                        onChange={handleFileImport}
                        className="hidden"
                      />
                    </>
                  )}
                </div>
              )}

              {activeTab === 'info' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">必填信息</h3>
                  <p className="text-sm text-slate-500">用户提交文件时必须填写的信息。</p>
                  
                  <div className="space-y-3">
                    {requiredFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">{index + 1}</span>
                        <input 
                          type="text" 
                          value={field.name} 
                          disabled={field.isDefault}
                          onChange={(e) => updateRequiredField(field.id, e.target.value)}
                          className="flex-1 bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 disabled:opacity-50"
                        />
                        {field.isDefault ? (
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">默认</span>
                        ) : (
                          <button
                            onClick={() => removeRequiredField(field.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addRequiredField()}
                        placeholder="输入字段名称"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={addRequiredField}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        添加
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'template' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">模板文件</h3>
                  <p className="text-sm text-slate-500">上传模板文件，供用户下载填写。</p>
                  
                  {taskInfo.template ? (
                    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">{taskInfo.template}</p>
                            <p className="text-xs text-slate-500">已上传的模板文件</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleTemplatePreview}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="预览"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleTemplateDownload}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="下载"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setTaskInfo({...taskInfo, template: undefined})}
                            className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  <div 
                    onClick={() => templateInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800/50"
                  >
                    <Upload className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">点击上传模板文件</p>
                    <p className="text-xs text-slate-400 mt-1">支持 Word, Excel, PDF 等格式</p>
                  </div>
                  
                  <input
                    ref={templateInputRef}
                    type="file"
                    accept=".doc,.docx,.xls,.xlsx,.pdf"
                    onChange={handleTemplateUpload}
                    className="hidden"
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-slate-200"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 hover:-translate-y-0.5"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>

      {/* 任务导入对话框 */}
      {showTaskImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setShowTaskImportDialog(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">从其他任务导入名单</h3>
            {availableTasks.length === 0 ? (
              <p className="text-slate-500 text-center py-8">暂无其他任务</p>
            ) : (
              <div className="space-y-2">
                {availableTasks.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleImportFromTask(t.key)}
                    className="w-full p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-400 transition-all"
                  >
                    <p className="font-medium text-slate-800">{t.name}</p>
                    {t.createdAt && (
                      <p className="text-xs text-slate-500 mt-1">创建于 {new Date(t.createdAt).toLocaleDateString()}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowTaskImportDialog(false)}
              className="mt-4 w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
