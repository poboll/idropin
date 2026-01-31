'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Loader2, X, Clock, Users, FileText, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import HomeFooter from '@/components/layout/HomeFooter';
import InfosForm from '@/components/forms/InfosForm';
import SubmissionUploader, { UploadFile } from '@/components/submission/SubmissionUploader';
import { getTaskInfoPublic, getTaskMoreInfoPublic, TaskInfo } from '@/lib/api/tasks';
import { checkPeopleIsExist, updatePeopleStatus } from '@/lib/api/people';
import { getUploadToken, withdrawFile, checkSubmitStatus, getTemplateUrl } from '@/lib/api/files';
import { 
  formatDate, 
  parseInfo, 
  parseFileFormat, 
  getFileSuffix, 
  normalizeFileName,
  InfoItem,
  FileFormatConfig 
} from '@/lib/utils/string';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

interface TaskBasicInfo {
  name: string;
  description?: string;
  category?: string;
  limitUpload?: boolean;
  deadline?: string;
  creatorName?: string;
  creatorAvatarUrl?: string;
  collectionType?: 'INFO' | 'FILE'; // 收集类型
}

export default function TaskSubmissionPage() {
  const params = useParams();
  const taskKey = params.key as string;
  const isMobile = useIsMobile();

  const [isLoading, setIsLoading] = useState(true);
  const [taskInfo, setTaskInfo] = useState<TaskBasicInfo>({ name: '' });
  const [taskMoreInfo, setTaskMoreInfo] = useState<TaskInfo>({});
  const [infos, setInfos] = useState<InfoItem[]>([]);
  const [formatConfig, setFormatConfig] = useState<FileFormatConfig | undefined>();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [peopleName, setPeopleName] = useState('');
  const [isWithdrawMode, setIsWithdrawMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disabledUpload, setDisabledUpload] = useState(false);

  const [waitTime, setWaitTime] = useState(0);
  const isOver = waitTime <= 0 && !!taskMoreInfo.ddl;

  const [tipData, setTipData] = useState<{ text: string; imgs: { uid: number; name: string }[] }>({
    text: '',
    imgs: [],
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const limitBindField = (() => {
    const field = taskMoreInfo.bindField;
    if (!field) return '姓名';
    
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (parsed.fieldName) {
          return parsed.fieldName;
        } else if (Array.isArray(parsed)) {
          return '姓名';
        }
      } catch {
        return field.trim() || '姓名';
      }
    }
    
    if (Array.isArray(field)) return field[0] || '姓名';
    return '姓名';
  })();
  const isSameFieldName = infos.find(v => v.text === limitBindField);
  const showValidForm = taskMoreInfo.people && !isSameFieldName;

  const isWriteFinish = infos.every(item => item.value);
  const allowUpload = files.some(f => f.status === 'ready');
  const allowWithdraw = files.some(f => ['success', 'ready'].includes(f.status));
  const isUploading = files.some(f => f.status === 'uploading');

  const waitTimeStr = useCallback(() => {
    let seconds = Math.floor(waitTime / 1000);
    let hour = Math.floor(seconds / 3600);
    const day = Math.floor(hour / 24);
    hour %= 24;
    const minute = Math.floor((seconds % 3600) / 60);
    seconds %= 60;
    return `剩余 ${day}天 ${hour}时 ${minute}分 ${seconds}秒`;
  }, [waitTime]);

  const ddlStr = taskMoreInfo.ddl ? formatDate(new Date(taskMoreInfo.ddl)) : '';

  useEffect(() => {
    if (!taskKey) return;

    const loadTaskInfo = async () => {
      setIsLoading(true);
      try {
        const info = await getTaskInfoPublic(taskKey);
        console.log('Task info from API:', info); // 调试日志
        console.log('Creator avatar URL:', info.creatorAvatarUrl); // 调试日志
        setTaskInfo({
          name: info.title || '',
          description: info.description || '',
          limitUpload: false,
          deadline: info.deadline || '',
          creatorName: info.creatorName || '',
          creatorAvatarUrl: info.creatorAvatarUrl || undefined,
          collectionType: info.collectionType || 'FILE', // 默认为收集文件
        });
        setDisabledUpload(false);

        const moreInfo = await getTaskMoreInfoPublic(taskKey);
        setTaskMoreInfo(moreInfo);
        
        // 解析必填信息字段，如果为空则默认添加"姓名"字段
        const parsedInfos = parseInfo(moreInfo.info || '');
        if (parsedInfos.length === 0) {
          // 默认添加姓名字段
          setInfos([{ type: 'input', text: '姓名', value: '' }]);
        } else {
          setInfos(parsedInfos);
        }
        
        setFormatConfig(parseFileFormat(moreInfo.format || ''));

        if (moreInfo.tip) {
          try {
            const parsed = JSON.parse(moreInfo.tip);
            // 如果解析成功且是对象格式
            if (typeof parsed === 'object' && parsed !== null) {
              setTipData({
                text: parsed.text || '',
                imgs: parsed.imgs || [],
              });
            } else {
              // 如果解析结果不是对象，当作纯文本处理
              setTipData({ text: moreInfo.tip, imgs: [] });
            }
          } catch {
            // 解析失败，当作纯文本处理
            setTipData({ text: moreInfo.tip, imgs: [] });
          }
        }
      } catch (err: unknown) {
        const error = err as { code?: number };
        if (error.code === 4001) {
          setTaskInfo({ name: '任务不存在' });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTaskInfo();
  }, [taskKey]);

  useEffect(() => {
    if (!taskMoreInfo.ddl) return;

    const updateWaitTime = () => {
      const ddl = new Date(taskMoreInfo.ddl!).getTime();
      setWaitTime(ddl - Date.now());
    };

    updateWaitTime();
    const timer = setInterval(updateWaitTime, 1000);
    return () => clearInterval(timer);
  }, [taskMoreInfo.ddl]);

  const validatePeople = async (): Promise<boolean> => {
    if (!taskMoreInfo.people) return true;

    const name = isSameFieldName ? isSameFieldName.value : peopleName;
    if (!name) {
      alert(`请输入${limitBindField}`);
      return false;
    }

    try {
      const result = await checkPeopleIsExist(taskKey, name);
      if (!result.exist) {
        alert('你不在此次提交名单中，如有疑问请联系管理员');
        return false;
      }
      return true;
    } catch {
      alert('验证失败，请重试');
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!isWriteFinish) {
      alert('请先完成必要信息的填写');
      return;
    }

    const isValid = await validatePeople();
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      // 如果是仅收集信息类型，直接提交表单信息
      if (taskInfo.collectionType === 'INFO') {
        // 创建一个仅包含信息的提交记录
        const formData = new FormData();
        formData.append('taskKey', taskKey);
        formData.append('submitterName', isSameFieldName?.value || peopleName || '');
        formData.append('submitterEmail', '');
        // 将表单信息序列化为JSON
        const infoData = infos.reduce((acc, item) => {
          acc[item.text] = item.value || '';
          return acc;
        }, {} as Record<string, string>);
        formData.append('infoData', JSON.stringify(infoData));

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'}/tasks/${taskKey}/submit-info`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(error || '提交失败');
          }

          alert('信息提交成功！');
        } catch (error) {
          console.error('Submit failed:', error);
          alert('提交失败，请重试');
        }
      } else {
        // 原有的文件上传逻辑
        const readyFiles = files.filter(f => f.status === 'ready' && f.md5);

        for (const uploadFile of readyFiles) {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
          ));

          let fileName = uploadFile.name;
          const originName = fileName;

          if (taskMoreInfo.rewrite) {
            fileName = infos.map(v => v.value).join(formatConfig?.splitChar || '-') + getFileSuffix(fileName);
          }
          fileName = normalizeFileName(fileName);

          try {
            // First upload the actual file content to storage
            const formData = new FormData();
            formData.append('file', uploadFile.file);
            formData.append('taskKey', taskKey);
            formData.append('submitterName', isSameFieldName?.value || peopleName || '');
            formData.append('submitterEmail', '');
            
            // Use the proper task submission endpoint that uploads file AND creates submission record
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'}/tasks/${taskKey}/submit`, {
              method: 'POST',
              body: formData,
              credentials: 'include',
            });

            if (!response.ok) {
              const error = await response.text();
              throw new Error(error || '上传失败');
            }

            const result = await response.json();
            const submissionId = result.data?.id; // 获取返回的submission ID

            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { 
                ...f, 
                status: 'success' as const, 
                progress: 100,
                submissionId: submissionId // 保存submission ID用于撤回
              } : f
            ));

            if (taskMoreInfo.people) {
              const name = isSameFieldName?.value || peopleName;
              await updatePeopleStatus(taskKey, fileName, name, uploadFile.md5!);
            }

            alert(`文件: ${originName} 提交成功`);
          } catch (error) {
            console.error('Upload failed:', error);
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { ...f, status: 'fail' as const, error: '上传失败' } : f
            ));
          }
        }
      }
    } catch (err) {
      alert('提交失败');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!isWriteFinish) {
      alert('请先完成必要信息的填写');
      return;
    }

    const isValid = await validatePeople();
    if (!isValid) return;

    const withdrawableFiles = files.filter(f => ['success', 'ready'].includes(f.status) && f.md5);

    for (const file of withdrawableFiles) {
      let fileName = file.name;
      if (taskMoreInfo.rewrite) {
        fileName = infos.map(v => v.value).join(formatConfig?.splitChar || '-') + getFileSuffix(fileName);
      }
      fileName = normalizeFileName(fileName);

      try {
        await withdrawFile({
          key: taskKey,
          id: (file as any).submissionId || parseInt(file.id), // 优先使用submissionId
          filename: fileName,
        });

        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'withdrawn' as const } : f
        ));

        alert(`文件: ${file.name} 撤回成功`);
      } catch {
        alert(`撤回失败: 没有文件 ${file.name} 对应提交记录`);
      }
    }
  };

  const handleCheckStatus = async () => {
    if (!isWriteFinish) {
      alert('请先完成必要信息的填写，需和提交时信息完全一致');
      return;
    }

    const isValid = await validatePeople();
    if (!isValid) return;

    try {
      const result = await checkSubmitStatus(taskKey, infos, isSameFieldName?.value || peopleName);
      if (result.isSubmit) {
        alert('已经提交过啦');
      } else {
        alert('还未提交过哟');
      }
    } catch {
      alert('查询失败');
    }
  };

  const handleDownloadTemplate = () => {
    if (taskMoreInfo.template) {
      const url = getTemplateUrl(taskMoreInfo.template, taskKey);
      window.open(url, '_blank');
    }
  };

  // Loading state - Vercel style
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // Task not found
  if (!taskKey || taskInfo.name === '任务不存在') {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-2xl mx-auto px-4 pt-20">
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              任务不存在
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">请检查链接是否正确</p>
          </div>
        </div>
        <HomeFooter type="simple" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black">
      {/* Header - Clean minimal style */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <div className="relative h-10 w-32">
              <Image
                src="https://pic.imgdb.cn/item/668cd877d9c307b7e99e9061.png"
                alt="IdropIn"
                fill
                sizes="128px"
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <a
            href="https://idrop.caiths.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            我也要收集 →
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Task Title Card */}
        <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-8 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {taskInfo.name}
                </h1>
                {/* Collection Type Badge - Notion Highlighter Style with Rounded Corners */}
                {taskInfo.collectionType && (
                  <span className={`px-2 py-0.5 text-sm font-medium rounded-md ${
                    taskInfo.collectionType === 'FILE'
                      ? 'bg-blue-200/60 dark:bg-blue-400/30 text-blue-900 dark:text-blue-100'
                      : 'bg-green-200/60 dark:bg-green-400/30 text-green-900 dark:text-green-100'
                  }`}>
                    {taskInfo.collectionType === 'FILE' ? '📁 收集文件' : '📝 收集信息'}
                  </span>
                )}
              </div>
              
              {/* Task Description */}
              {taskInfo.description && taskInfo.description.trim() && (
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed whitespace-pre-wrap">
                  {taskInfo.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Task Meta Info - Enhanced */}
          <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            {taskInfo.creatorName && (
              <div className="flex items-center gap-2">
                {taskInfo.creatorAvatarUrl ? (
                  <img
                    src={taskInfo.creatorAvatarUrl}
                    alt={taskInfo.creatorName}
                    className="w-8 h-8 rounded-full object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium text-sm shadow-sm">
                    {taskInfo.creatorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">收件人</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{taskInfo.creatorName}</p>
                </div>
              </div>
            )}
            {(taskInfo.deadline || ddlStr) && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">截止时间</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {ddlStr || (taskInfo.deadline ? formatDate(new Date(taskInfo.deadline)) : '')}
                  </p>
                </div>
              </div>
            )}
            {taskMoreInfo.people && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">验证方式</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">需验证名单</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Storage Full Warning */}
        {disabledUpload && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-400 text-sm">存储空间已满</p>
                <p className="text-red-600/80 dark:text-red-400/70 text-sm mt-1">
                  任务存储空间容量已达到上限，请联系发起人扩容空间
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Deadline Countdown */}
        {ddlStr && (
          <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">截止时间</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">{ddlStr}</span>
            </div>
            {!isOver && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div className="text-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{waitTimeStr()}</span>
                </div>
              </div>
            )}
            {isOver && (
              <div className="mt-4 text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">任务已结束，无法继续提交</p>
              </div>
            )}
          </div>
        )}

        {/* Tips Section */}
        {(tipData.text || tipData.imgs.length > 0) && (!ddlStr || !isOver) && (
          <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-900/30 p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">注意事项</span>
            </div>
            
            {tipData.text && (
              <p className="text-sm text-amber-800/80 dark:text-amber-300/80 whitespace-pre-wrap leading-relaxed">
                {tipData.text}
              </p>
            )}
            
            {tipData.imgs && tipData.imgs.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mb-3">批注图片</p>
                <div className="flex flex-wrap justify-center gap-4">
                  {tipData.imgs.map((img, index) => (
                    <div 
                      key={img.uid || index} 
                      className="relative group w-full sm:w-[calc(50%-0.5rem)] max-w-md aspect-[4/3] rounded-xl overflow-hidden border border-amber-200/50 dark:border-amber-800/30 cursor-pointer transition-all hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-700"
                      onClick={() => setPreviewImage(img.name)}
                    >
                      <Image
                        src={img.name}
                        alt={`批注图片 ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      {/* 悬停遮罩提示 */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.3-4.3"></path>
                            <path d="M11 8v6"></path>
                            <path d="M8 11h6"></path>
                          </svg>
                          点击放大图片
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Form Section */}
        {(!ddlStr || !isOver) && (
          <>
            {/* People Validation Notice */}
            {taskMoreInfo.people && (
              <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">参与名单验证</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      需要填写 <span className="font-medium text-gray-700 dark:text-gray-300">{limitBindField}</span> 字段，且必须在参与名单中
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Section */}
            <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">必要信息</span>
              </div>

              {showValidForm && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="text-red-500 mr-1">*</span>
                    {limitBindField}
                  </label>
                  <input
                    type="text"
                    value={peopleName}
                    onChange={(e) => setPeopleName(e.target.value)}
                    disabled={isUploading}
                    maxLength={14}
                    placeholder={`请输入 ${limitBindField}`}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg 
                      bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-300 dark:focus:border-gray-600
                      disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
                      transition-all placeholder:text-gray-400"
                  />
                </div>
              )}

              <InfosForm
                infos={infos}
                disabled={isUploading}
                onChange={setInfos}
              />
            </div>

            {/* Upload Section - 仅在收集文件类型时显示 */}
            {taskInfo.collectionType === 'FILE' && (
              <div className="bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">文件上传</span>
                </div>

                <SubmissionUploader
                  files={files}
                  onFilesChange={setFiles}
                  formatConfig={formatConfig}
                  disabled={disabledUpload || isUploading}
                  isMobile={isMobile}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center mb-6">
              {isWithdrawMode ? (
                <button
                  onClick={handleWithdraw}
                  disabled={!allowWithdraw || isSubmitting}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2 transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>↩️</span>
                  )}
                  一键撤回
                </button>
              ) : (
                !disabledUpload && (
                  <button
                    onClick={handleSubmit}
                    disabled={
                      (taskInfo.collectionType === 'FILE' ? !allowUpload : false) || 
                      isSubmitting
                    }
                    className="px-6 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 
                      text-white dark:text-gray-900 text-sm font-medium rounded-lg
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center gap-2 transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {taskInfo.collectionType === 'INFO' ? '提交信息' : '提交文件'}
                  </button>
                )
              )}
              <button
                onClick={handleCheckStatus}
                className="px-6 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700
                  text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg
                  border border-gray-200 dark:border-gray-700
                  flex items-center gap-2 transition-colors"
              >
                🔍 查询提交情况
              </button>
            </div>

            {/* Help Tips */}
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                {isWithdrawMode ? (
                  <>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">撤回说明</p>
                    <p>① 须保证选择的文件与提交时的文件一致</p>
                    <p>② 填写表单信息一致</p>
                    <p>③ 完全一模一样的文件的提交记录将会一次性全部撤回</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">温馨提示</p>
                    <p>• 查询提交情况，需填写和提交时一样的表单信息</p>
                    <p>① 选择完文件，点击「提交文件」即可</p>
                    <p>② 选择大文件后需要等待一会儿才展示处理</p>
                    {taskMoreInfo.template && !disabledUpload && (
                      <p>③ 右下角可「查看提交示例」</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-4">
              {taskMoreInfo.template && !disabledUpload && (
                <button
                  onClick={handleDownloadTemplate}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 
                    flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  查看提交示例
                </button>
              )}
              <button
                onClick={() => setIsWithdrawMode(!isWithdrawMode)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {isWithdrawMode ? '✏️ 正常提交' : '↩️ 我要撤回'}
              </button>
            </div>
          </>
        )}
      </main>

      <div className="py-8">
        <HomeFooter type="simple" />
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div 
            className="relative w-[90vw] h-[90vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewImage}
              alt="预览大图"
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
