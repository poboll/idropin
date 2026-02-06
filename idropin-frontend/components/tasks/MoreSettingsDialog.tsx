import React, { useEffect, useState, useRef } from 'react';
import Modal from '@/components/Modal';
import { Task } from '@/lib/stores/task';
import * as TaskApi from '@/lib/api/tasks';
import { addPeopleByUser, getPeople, deletePeople } from '@/lib/api/people';
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
  const [requiredFields, setRequiredFields] = useState<RequiredField[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [bindFieldName, setBindFieldName] = useState('姓名'); // 绑定字段名称
  
  // Name list state
  const [nameList, setNameList] = useState<NameListPerson[]>([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [nameListEnabled, setNameListEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  
  // Tip images state
  const [tipImages, setTipImages] = useState<string[]>([]);
  const tipImageInputRef = useRef<HTMLInputElement>(null);
  
  // File attributes state
  const [fileTypeRestriction, setFileTypeRestriction] = useState<'none' | 'restricted'>('none');
  const [allowedFileTypes, setAllowedFileTypes] = useState<string>('');
  const [maxFileCount, setMaxFileCount] = useState<number>(10);
  const [maxFileSizeValue, setMaxFileSizeValue] = useState<number>(0);
  
  // Auto rename state
  const [autoRename, setAutoRename] = useState<boolean>(true); // 默认开启
  
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
      
      // 加载文件属性设置
      if (taskDetails.allowedTypes && taskDetails.allowedTypes.length > 0) {
        setFileTypeRestriction('restricted');
        setAllowedFileTypes(taskDetails.allowedTypes.join(','));
      } else {
        setFileTypeRestriction('none');
        setAllowedFileTypes('');
      }
      setMaxFileCount(taskDetails.maxFileCount || 10);
      setMaxFileSizeValue(taskDetails.maxFileSize || 0);
      
      const info = await TaskApi.getTaskMoreInfo(key);
      setTaskInfo(info);
      
      // 加载自动重命名设置（默认为true）
      setAutoRename(info.autoRename !== undefined ? info.autoRename : true);
      
      // 解析必填字段
      if (info.info) {
        try {
          const fields = JSON.parse(info.info);
          if (Array.isArray(fields)) {
            setRequiredFields(fields.map((f: any, idx: number) => ({
              id: `field-${idx}`,
              name: typeof f === 'string' ? f : (f.name || '未命名字段'),
              isDefault: false
            })));
          }
        } catch (e) {
          console.error('Failed to parse required fields:', e);
        }
      }
      
      // 解析绑定字段和名单
      if (info.bindField) {
        try {
          const parsed = JSON.parse(info.bindField);
          if (parsed.fieldName) {
            // 新格式：包含 fieldName 和 nameList
            setBindFieldName(parsed.fieldName);
            if (parsed.nameList && Array.isArray(parsed.nameList)) {
              setNameList(parsed.nameList.map((p: any, idx: number) => ({
                id: p.id || `person-${idx}`,
                name: typeof p === 'string' ? p : (p.name || '')
              })));
            }
          } else if (Array.isArray(parsed)) {
            // 旧格式：bindField 直接存储名单列表
            setNameList(parsed.map((p: any, idx: number) => ({
              id: p.id || `person-${idx}`,
              name: typeof p === 'string' ? p : (p.name || '')
            })));
            setBindFieldName('姓名');
          }
        } catch {
          // 不是 JSON，直接作为字段名称使用
          setBindFieldName(info.bindField);
        }
      }
      
      // 解析批注信息（包含文本和图片）
      if (info.tip) {
        try {
          const parsed = JSON.parse(info.tip);
          if (parsed.text !== undefined) {
            setTaskInfo(prev => ({ ...prev, tip: parsed.text }));
          }
          if (parsed.imgs && Array.isArray(parsed.imgs)) {
            setTipImages(parsed.imgs.map((img: any) => img.name || img));
          }
        } catch {
          // 如果不是 JSON，直接作为文本使用
          setTaskInfo(prev => ({ ...prev, tip: info.tip }));
        }
      }
      
      // people 字段表示是否启用名单验证
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
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || error.response?.data?.message || '获取任务列表失败';
      alert(`获取任务列表失败: ${errorMessage}`);
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
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || error.response?.data?.message || '导入失败';
      alert(`导入失败: ${errorMessage}`);
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
        // 使用模板下载接口预览
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'}/files/template?template=${encodeURIComponent(taskInfo.template)}&key=${task?.key}`;
        window.open(url, '_blank');
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
        // 使用模板下载接口
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'}/files/template?template=${encodeURIComponent(taskInfo.template)}&key=${task?.key}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = taskInfo.template;
        link.click();
      }
    }
  };

  const handleSave = async () => {
    if (!task) return;
    setSaving(true);
    try {
      const currentTask = await TaskApi.getTask(task.key);
      
      // 处理文件类型限制
      const allowedTypesArray = fileTypeRestriction === 'restricted' && allowedFileTypes.trim()
        ? allowedFileTypes.split(',').map(t => t.trim().toLowerCase()).filter(t => t)
        : [];
      
      // Only update deadline if it has changed
      // Don't send description to avoid overwriting it with incorrect values
      await TaskApi.updateTask(task.key, {
        title: currentTask.title,
        deadline: deadline ? deadline.toISOString() : null,
        requireLogin: currentTask.requireLogin,
        limitOnePerDevice: currentTask.limitOnePerDevice,
        maxFileSize: maxFileSizeValue,
        allowedTypes: allowedTypesArray,
        maxFileCount: maxFileCount
      });

      // 构建 tip 数据（包含文本和图片）
      const tipData = {
        text: taskInfo.tip || '',
        imgs: tipImages.map((img, idx) => ({
          uid: idx + 1,
          name: img
        }))
      };

      // 保存名单到 bindField 和 people_list 表
      const nameListData = nameListEnabled ? nameList : [];

      // 如果启用了名单验证，同步名单到 people_list 表
      if (nameListEnabled && nameListData.length > 0) {
        try {
          // 获取当前数据库中的名单
          const existingPeople = await getPeople(task.key);
          const existingNames = new Set(existingPeople.map(p => p.name));
          
          // 找出需要添加的新人员
          const newPeople = nameListData.filter(p => !existingNames.has(p.name));
          
          // 批量添加新人员到数据库
          for (const person of newPeople) {
            try {
              await addPeopleByUser(person.name, task.key);
            } catch (e) {
              // 忽略重复添加错误
              console.warn(`添加人员 ${person.name} 失败:`, e);
            }
          }
          
          // 找出需要删除的人员（在数据库中但不在当前名单中）
          const currentNames = new Set(nameListData.map(p => p.name));
          const peopleToDelete = existingPeople.filter(p => !currentNames.has(p.name));
          
          // 删除不再需要的人员
          for (const person of peopleToDelete) {
            try {
              await deletePeople(task.key, person.id);
            } catch (e) {
              console.warn(`删除人员 ${person.name} 失败:`, e);
            }
          }
        } catch (e) {
          console.warn('同步名单到数据库失败:', e);
        }
      }

      await TaskApi.updateTaskMoreInfo(task.key, {
        ddl: deadline ? deadline.toISOString() : null,
        tip: JSON.stringify(tipData), // 保存批注信息（包含文本和图片）
        people: nameListEnabled,
        format: taskInfo.format,
        template: taskInfo.template,
        bindField: JSON.stringify({
          fieldName: bindFieldName, // 绑定字段名称
          nameList: nameListData // 名单列表
        }),
        rewrite: taskInfo.rewrite,
        autoRename: autoRename, // 保存自动重命名设置
        info: JSON.stringify(requiredFields.map(f => f.name)) // 只保存字段名称数组
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
    { id: 'fileProps', label: '文件属性管理', icon: Settings },
  ];

  if (!task) return null;

  return (
    <Modal isOpen={open} onClose={onClose} title="更多设置" size="lg">
      <div className="flex flex-col h-[600px]">
        <div className="flex border-b border-gray-100 dark:border-gray-800/50 overflow-x-auto bg-gray-50/50 dark:bg-gray-900/30">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white bg-white dark:bg-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin mx-auto mb-3" />
                <span>加载中...</span>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'ddl' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">截止日期设置</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">设置任务的自动截止时间，过期后将无法提交。</p>
                    <div className="max-w-sm">
                      <DatePicker 
                        value={deadline} 
                        onChange={setDeadline} 
                        placeholder="点击设置截止时间"
                      />
                    </div>
                  </div>
                  {deadline ? (
                    <div className="p-5 bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-2xl text-sm border border-blue-100 dark:border-blue-800/50 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <span>任务将在 <strong>{deadline.toLocaleString()}</strong> 截止</span>
                    </div>
                  ) : (
                    <div className="p-5 bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-2xl text-sm border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5" />
                      </div>
                      <span>当前任务永久有效，无截止时间限制</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tip' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">批注/备注信息</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">在提交页面展示给用户的提示信息。</p>
                    <textarea
                      className="w-full h-48 py-3.5 px-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
                      placeholder="请输入提示信息..."
                      value={taskInfo.tip || ''}
                      onChange={(e) => setTaskInfo({...taskInfo, tip: e.target.value})}
                    />
                  </div>

                  {/* 图片上传区域 */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">批注图片</h4>
                        <p className="text-xs text-gray-400 mt-0.5">最多可上传3张图片</p>
                      </div>
                      <button
                        onClick={() => tipImageInputRef.current?.click()}
                        disabled={tipImages.length >= 3}
                        className={`px-4 py-2 text-sm rounded-xl flex items-center gap-2 transition-all font-medium ${
                          tipImages.length >= 3
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02]'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        上传图片
                      </button>
                    </div>

                    {/* 图片预览网格 */}
                    {tipImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-4">
                        {tipImages.map((image, index) => (
                          <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-gray-200/80 dark:border-gray-700/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md">
                            <img
                              src={image}
                              alt={`批注图片 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3">
                              <button
                                onClick={() => {
                                  window.open(image, '_blank');
                                }}
                                className="p-2.5 bg-white/95 rounded-full hover:bg-white transition-all hover:scale-110 shadow-lg"
                              >
                                <Eye className="w-4 h-4 text-gray-700" />
                              </button>
                              <button
                                onClick={() => removeTipImage(index)}
                                className="p-2.5 bg-red-500/95 rounded-full hover:bg-red-500 transition-all hover:scale-110 shadow-lg"
                              >
                                <Trash2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {tipImages.length === 0 && (
                      <div 
                        onClick={() => tipImageInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-200/80 dark:border-gray-700/80 rounded-2xl p-8 text-center text-gray-400 dark:text-gray-500 text-sm cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all"
                      >
                        <ImageIcon className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p>点击或拖拽图片到此处上传</p>
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
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">分类列表</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">只有名单里的成员，才可提交文件</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setNameListEnabled(false)}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        !nameListEnabled
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/25'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      关闭
                    </button>
                    <button
                      onClick={() => setNameListEnabled(true)}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        nameListEnabled
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      查看提交情况
                    </button>
                  </div>

                  {nameListEnabled && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all flex items-center gap-2 text-gray-700 dark:text-gray-300"
                        >
                          <Upload className="w-4 h-4" />
                          文件导入
                        </button>
                        <button
                          onClick={handleTaskImport}
                          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all flex items-center gap-2 text-gray-700 dark:text-gray-300"
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
                          className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          手动添加
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPersonName}
                          onChange={(e) => setNewPersonName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addPersonManually()}
                          placeholder="请输入姓名"
                          className="flex-1 py-3 px-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                        />
                        <button
                          onClick={addPersonManually}
                          className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                        >
                          确定
                        </button>
                      </div>

                      <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                        💡 会自动判重，不会重复添加。大量名单优先推荐使用文件导入。
                      </p>

                      <div className="border border-gray-200/80 dark:border-gray-700/80 rounded-2xl overflow-hidden">
                        <div className="bg-gray-50/80 dark:bg-gray-800/80 px-4 py-3 flex items-center border-b border-gray-200/80 dark:border-gray-700/80">
                          <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">绑定表单项</span>
                          <span className="w-24 text-sm font-medium text-gray-700 dark:text-gray-300 text-center">姓名</span>
                          <span className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300 text-center">操作</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {nameList.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 dark:text-gray-500">
                              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <Users className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                              </div>
                              暂无名单，请添加
                            </div>
                          ) : (
                            nameList.map((person, index) => (
                              <div key={person.id} className={`px-4 py-3.5 flex items-center hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors ${index !== nameList.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 font-medium">{person.name}</span>
                                <span className="w-24 text-sm text-gray-500 dark:text-gray-400 text-center">姓名</span>
                                <div className="w-20 flex justify-center">
                                  <button
                                    onClick={() => removePerson(person.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all hover:scale-110"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        和表单项同名字段，可以避免重复填写
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
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">必填信息</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">用户提交文件时必须填写的信息。</p>
                  </div>
                  
                  <div className="space-y-3">
                    {requiredFields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all group">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-bold shadow-sm">{index + 1}</span>
                        <input 
                          type="text" 
                          value={field.name} 
                          onChange={(e) => updateRequiredField(field.id, e.target.value)}
                          placeholder="字段名称"
                          className="flex-1 bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-0 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        />
                        <button
                          onClick={() => removeRequiredField(field.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                          title="删除字段"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {requiredFields.length === 0 && (
                      <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <Info className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                        </div>
                        暂无必填字段，点击下方添加
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addRequiredField()}
                        placeholder="输入字段名称（如：姓名、学号）"
                        className="flex-1 py-3.5 px-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                      />
                      <button
                        onClick={addRequiredField}
                        className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-all flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        添加
                      </button>
                    </div>
                  </div>
                  
                  {/* 绑定字段选择器 */}
                  {nameListEnabled && requiredFields.length > 0 && (
                    <div className="pt-5 border-t border-gray-200/80 dark:border-gray-700/80">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        绑定字段（用于名单验证）
                      </label>
                      <select
                        value={bindFieldName}
                        onChange={(e) => setBindFieldName(e.target.value)}
                        className="w-full py-3.5 px-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all appearance-none cursor-pointer"
                      >
                        {requiredFields.map(field => (
                          <option key={field.id} value={field.name}>{field.name}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        选择哪个字段用于验证参与名单
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'template' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">模板文件</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">上传模板文件，供用户下载填写。</p>
                  </div>
                  
                  {taskInfo.template ? (
                    <div className="p-5 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl bg-white dark:bg-gray-800/50 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/25">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{taskInfo.template}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">已上传的模板文件</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handleTemplatePreview}
                            className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all hover:scale-110"
                            title="预览"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleTemplateDownload}
                            className="p-2.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all hover:scale-110"
                            title="下载"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setTaskInfo({...taskInfo, template: undefined})}
                            className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all hover:scale-110"
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
                    className="border-2 border-dashed border-gray-200/80 dark:border-gray-700/80 rounded-2xl p-10 text-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all cursor-pointer bg-gray-50/50 dark:bg-gray-800/30"
                  >
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Upload className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">点击或拖拽上传模板文件</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">支持 Word, Excel, PDF 等格式</p>
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

              {activeTab === 'fileProps' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">文件属性管理</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">设置文件上传的限制条件。</p>
                  </div>

                  {/* 自动更新文件名 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      使用提交信息自动更新文件名
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setAutoRename(true)}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                          autoRename
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        开启
                      </button>
                      <button
                        onClick={() => setAutoRename(false)}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                          !autoRename
                            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/25'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        关闭
                      </button>
                    </div>
                    <div className="p-4 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/80 dark:border-blue-800/50 rounded-xl">
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        开启后，文件名将自动更新为：<span className="font-mono font-medium">任务名_必填信息_原文件名</span>
                        <br />
                        例如：<span className="font-mono font-medium">智协_25-26社团骨干备案表_朱思鑫.docx</span>
                      </p>
                    </div>
                  </div>

                  {/* 文件类型限制 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      文件类型限制
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setFileTypeRestriction('none')}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                          fileTypeRestriction === 'none'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        不限制文件类型
                      </button>
                      <button
                        onClick={() => setFileTypeRestriction('restricted')}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                          fileTypeRestriction === 'restricted'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        限制文件类型
                      </button>
                    </div>
                    
                    {fileTypeRestriction === 'restricted' && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="text"
                          value={allowedFileTypes}
                          onChange={(e) => setAllowedFileTypes(e.target.value)}
                          placeholder="例如: txt,png,jpeg,webp,pdf,doc,docx"
                          className="w-full py-3.5 px-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          输入允许的文件扩展名，用逗号分隔，不区分大小写
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 最大文件数量 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      最大同时提交文件数量
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="16"
                        value={maxFileCount}
                        onChange={(e) => setMaxFileCount(parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="16"
                          value={maxFileCount}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val >= 1 && val <= 16) {
                              setMaxFileCount(val);
                            }
                          }}
                          className="w-20 py-2.5 px-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                        />
                        <span className="text-sm text-gray-500 dark:text-gray-400">个</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      设置用户一次最多可以提交多少个文件（1-16个）
                    </p>
                  </div>

                  {/* 文件最大大小 */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      单个文件最大大小
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        value={maxFileSizeValue}
                        onChange={(e) => setMaxFileSizeValue(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="flex-1 py-3.5 px-4 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">字节 (Bytes)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl border border-gray-200/80 dark:border-gray-700/80 text-center">
                        <div className="font-medium text-gray-600 dark:text-gray-400">1 KB = 1,024 B</div>
                      </div>
                      <div className="p-2.5 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl border border-gray-200/80 dark:border-gray-700/80 text-center">
                        <div className="font-medium text-gray-600 dark:text-gray-400">1 MB = 1,024 KB</div>
                      </div>
                      <div className="p-2.5 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl border border-gray-200/80 dark:border-gray-700/80 text-center">
                        <div className="font-medium text-gray-600 dark:text-gray-400">1 GB = 1,024 MB</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      设置为 0 表示不限制文件大小。常用值：10MB = 10485760，100MB = 104857600
                    </p>
                  </div>

                  {/* 预览当前设置 */}
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/80 dark:border-blue-800/50 rounded-2xl">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      当前设置预览
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        文件类型：{fileTypeRestriction === 'none' ? '不限制' : `仅允许 ${allowedFileTypes || '未设置'}`}
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        最多提交：{maxFileCount} 个文件
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        文件大小：{maxFileSizeValue === 0 ? '不限制' : `最大 ${(maxFileSizeValue / 1024 / 1024).toFixed(2)} MB`}
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-5 border-t border-gray-200/80 dark:border-gray-800/80 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-900/30">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>

      {/* 任务导入对话框 */}
      {showTaskImportDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setShowTaskImportDialog(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl border border-gray-200/50 dark:border-gray-800/50" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">从其他任务导入名单</h3>
            {availableTasks.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">暂无其他任务</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableTasks.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleImportFromTask(t.key)}
                    className="w-full p-4 text-left border border-gray-200/80 dark:border-gray-700/80 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-500 transition-all group"
                  >
                    <p className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{t.name}</p>
                    {t.createdAt && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">创建于 {new Date(t.createdAt).toLocaleDateString()}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowTaskImportDialog(false)}
              className="mt-5 w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
