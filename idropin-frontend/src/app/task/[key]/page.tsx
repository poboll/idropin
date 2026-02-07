'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Loader2, X, Clock, Users, FileText, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import HomeFooter from '@/components/layout/HomeFooter';
import InfosForm from '@/components/forms/InfosForm';
import SubmissionUploader, { UploadFile } from '@/components/submission/SubmissionUploader';
import ErrorDisplay, { ErrorToast, SuccessToast } from '@/components/ui/ErrorDisplay';
import SubmissionSuccessModal from '@/components/submission/SubmissionSuccessModal';
import SubmissionHistoryModal from '@/components/submission/SubmissionHistoryModal';
import { getTaskInfoPublic, getTaskMoreInfoPublic, TaskInfo, getPublicSubmissions, InfoSubmission, withdrawSubmission } from '@/lib/api/tasks';
import { checkPeopleIsExist, updatePeopleStatus } from '@/lib/api/people';
import { getUploadToken, checkSubmitStatus, getTemplateUrl } from '@/lib/api/files';
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
  
  // 错误状态
  const [loadError, setLoadError] = useState<{ message: string; details?: string } | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<{ message: string; details?: string } | null>(null);

  const [waitTime, setWaitTime] = useState(0);
  const isOver = waitTime <= 0 && !!taskMoreInfo.ddl;

  const [tipData, setTipData] = useState<{ text: string; imgs: { uid: number; name: string }[] }>({
    text: '',
    imgs: [],
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 提交成功弹窗状态
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmissionData, setLastSubmissionData] = useState<{
    id: string;
    submitterName: string;
    infoData: Record<string, string>;
    submittedAt: string;
    taskTitle: string;
    collectionType: 'INFO' | 'FILE';
    fileName?: string;
  } | null>(null);

  // 历史记录弹窗状态
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySubmissions, setHistorySubmissions] = useState<InfoSubmission[]>([]);

  // 自动关闭ErrorToast
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => {
        setErrorToast(null);
      }, 5000); // 5秒后自动关闭
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  // 自动关闭SuccessToast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 5000); // 5秒后自动关闭
      return () => clearTimeout(timer);
    }
  }, [successToast]);

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
  
  const uploadProgress = (() => {
    const readyOrUploading = files.filter(f => ['ready', 'uploading', 'success'].includes(f.status));
    if (readyOrUploading.length === 0) return null;
    const completed = files.filter(f => f.status === 'success').length;
    return { completed, total: readyOrUploading.length };
  })();

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
        console.error('加载任务信息失败:', err);
        const error = err as { code?: number; message?: string };
        if (error.code === 4001) {
          setTaskInfo({ name: '任务不存在' });
        } else {
          // 设置错误状态，显示美观的错误UI
          const errorMessage = error.message || 'Network Error';
          setLoadError({
            message: '加载任务信息失败',
            details: errorMessage
          });
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
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || '验证失败，请重试';
      alert(`验证失败: ${errorMessage}`);
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

          // 检查 HTTP 状态码
          if (!response.ok) {
            const error = await response.text();
            throw new Error(error || '提交失败');
          }

          // 检查响应体中的业务错误码
          const result = await response.json();
          if (result.code && result.code !== 200) {
            throw new Error(result.message || '提交失败');
          }

          // 显示成功弹窗
          setLastSubmissionData({
            id: result.data?.id || '',
            submitterName: isSameFieldName?.value || peopleName || '',
            infoData: infoData,
            submittedAt: new Date().toISOString(),
            taskTitle: taskInfo.name,
            collectionType: 'INFO',
          });
          setShowSuccessModal(true);
        } catch (error) {
          console.error('Submit failed:', error);
          const errorMessage = (error as any).message || '提交失败，请重试';
          alert(`提交失败: ${errorMessage}`);
        }
      } else {
        // 原有的文件上传逻辑
        const readyFiles = files.filter(f => f.status === 'ready' && f.md5);

        for (const uploadFile of readyFiles) {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
          ));

          const originName = uploadFile.name;

          try {
            // 准备表单数据
            const formData = new FormData();
            formData.append('file', uploadFile.file);
            formData.append('submitterName', isSameFieldName?.value || peopleName || '');
            formData.append('submitterEmail', '');
            
            // 将必填信息序列化为JSON并传递给后端
            const infoDataObj = infos.reduce((acc, item) => {
              acc[item.text] = item.value || '';
              return acc;
            }, {} as Record<string, string>);
            formData.append('infoData', JSON.stringify(infoDataObj));
            
            // Use the proper task submission endpoint that uploads file AND creates submission record
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api'}/tasks/${taskKey}/submit`, {
              method: 'POST',
              body: formData,
              credentials: 'include',
            });

            // 解析响应
            const result = await response.json().catch(() => ({ code: response.status, message: '服务器响应异常' }));

            // 检查 HTTP 状态码
            if (!response.ok) {
              throw new Error(result?.message || '上传失败');
            }

            // 检查响应体中的业务错误码
            if (result.code && result.code !== 200) {
              throw new Error(result.message || '上传失败');
            }

            const submissionId = result.data?.id;
            const renamedFileName = result.data?.fileName;

            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { 
                ...f, 
                status: 'success' as const, 
                progress: 100,
                submissionId: submissionId,
                renamedName: renamedFileName
              } : f
            ));

            if (taskMoreInfo.people) {
              const name = isSameFieldName?.value || peopleName;
              await updatePeopleStatus(taskKey, originName, name, uploadFile.md5!);
            }

            if (renamedFileName && renamedFileName !== originName) {
              setSuccessToast({ 
                message: `文件提交成功`, 
                details: `已重命名为: ${renamedFileName}` 
              });
            } else {
              setSuccessToast({ message: `文件 ${originName} 提交成功` });
            }
          } catch (error: any) {
            console.error('Upload failed:', error);
            const errorMessage = error.message || '上传失败';
            alert(`提交失败: ${errorMessage}`);
            setFiles(prev => prev.map(f =>
              f.id === uploadFile.id ? { ...f, status: 'fail' as const, error: errorMessage } : f
            ));
          }
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || '提交失败';
      alert(`提交失败: ${errorMessage}`);
      console.error(error);
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
        const submitterName = isSameFieldName?.value || peopleName;
        await withdrawSubmission(taskKey, file.id, submitterName);

        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'withdrawn' as const } : f
        ));

        alert(`文件: ${file.name} 撤回成功`);
      } catch (error: any) {
        // 显示后端返回的真实错误信息
        const errorMessage = error.message || error.response?.data?.message || '撤回失败';
        alert(`撤回失败: ${errorMessage}`);
        console.error('Withdraw error:', error);
      }
    }
  };

  const handleCheckStatus = async () => {
    if (!isWriteFinish) {
      setErrorToast('请先完成必要信息的填写，需和提交时信息完全一致');
      return;
    }

    const isValid = await validatePeople();
    if (!isValid) return;

    try {
      const submitterName = isSameFieldName?.value || peopleName;

      // 获取提交历史记录
      const historyResult = await getPublicSubmissions(taskKey, submitterName);

      if (historyResult.count > 0) {
        // 显示历史记录弹窗
        setHistorySubmissions(historyResult.submissions);
        setShowHistoryModal(true);
      } else {
        setSuccessToast({ message: '还未提交过哟' });
      }
    } catch (error: any) {
      console.error('查询提交状态失败:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Network Error';
      setErrorToast(`查询失败: ${errorMessage}`);
    }
  };

  const handleDownloadTemplate = () => {
    if (taskMoreInfo.template) {
      const url = getTemplateUrl(taskMoreInfo.template, taskKey);
      window.open(url, '_blank');
    }
  };

  // Loading state - Apple style with elegant animation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black flex items-center justify-center">
        <div className="text-center animate-in fade-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-700/30 rounded-full blur-xl animate-pulse" />
            <Loader2 className="w-10 h-10 animate-spin text-gray-500 dark:text-gray-400 mx-auto relative" />
          </div>
          <p className="mt-6 text-gray-500 dark:text-gray-400 text-sm font-medium tracking-wide">加载中...</p>
        </div>
      </div>
    );
  }

  // Error state - Vercel style
  if (loadError) {
    return (
      <ErrorDisplay
        title="加载失败"
        message={loadError.message}
        details={loadError.details}
        onRetry={() => {
          setLoadError(null);
          window.location.reload();
        }}
        showHomeButton
      />
    );
  }

  // Task not found
  if (!taskKey || taskInfo.name === '任务不存在') {
    return (
      <ErrorDisplay
        title="任务不存在"
        message="请检查链接是否正确，或联系任务发起人"
        showHomeButton
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/80 to-white dark:from-gray-950 dark:to-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-black/70 backdrop-blur-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-none">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 active:scale-[0.98] transition-all duration-200">
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
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/50 rounded-full transition-all duration-200"
          >
            我也要收集 →
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Task Title Card */}
        <div className="bg-white/90 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-800/50 p-10 mb-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {taskInfo.name}
                </h1>
                {taskInfo.collectionType && (
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full tracking-wide ${
                    taskInfo.collectionType === 'FILE'
                      ? 'bg-blue-100/80 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                      : 'bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    {taskInfo.collectionType === 'FILE' ? '📁 收集文件' : '📝 收集信息'}
                  </span>
                )}
              </div>
              
              {taskInfo.description && taskInfo.description.trim() && (
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed whitespace-pre-wrap">
                  {taskInfo.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Task Meta Info */}
          <div className="flex flex-wrap gap-8 pt-6 border-t border-gray-100/80 dark:border-gray-800/50">
            {taskInfo.creatorName && (
              <div className="flex items-center gap-3 group">
                {taskInfo.creatorAvatarUrl ? (
                  <img
                    src={taskInfo.creatorAvatarUrl}
                    alt={taskInfo.creatorName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800 group-hover:ring-gray-200 dark:group-hover:ring-gray-700 transition-all duration-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold text-sm ring-2 ring-gray-100 dark:ring-gray-800">
                    {taskInfo.creatorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">收件人</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{taskInfo.creatorName}</p>
                </div>
              </div>
            )}
            {(taskInfo.deadline || ddlStr) && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">截止时间</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {ddlStr || (taskInfo.deadline ? formatDate(new Date(taskInfo.deadline)) : '')}
                  </p>
                </div>
              </div>
            )}
            {taskMoreInfo.people && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">验证方式</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">需验证名单</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Storage Full Warning */}
        {disabledUpload && (
          <div className="bg-red-50/80 dark:bg-red-950/20 backdrop-blur-sm border border-red-200/60 dark:border-red-900/30 rounded-2xl p-5 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-red-800 dark:text-red-300 text-sm">存储空间已满</p>
                <p className="text-red-700/80 dark:text-red-400/70 text-sm mt-1 leading-relaxed">
                  任务存储空间容量已达到上限，请联系发起人扩容空间
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Deadline Countdown */}
        {ddlStr && (
          <div className="bg-white/90 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-800/50 p-5 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">截止时间</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{ddlStr}</span>
            </div>
            {!isOver && (
              <div className="mt-4 pt-4 border-t border-gray-100/80 dark:border-gray-800/50">
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 tabular-nums">{waitTimeStr()}</span>
                </div>
              </div>
            )}
            {isOver && (
              <div className="mt-5 text-center py-10">
                <p className="text-gray-500 dark:text-gray-400 font-medium">任务已结束，无法继续提交</p>
              </div>
            )}
          </div>
        )}

        {/* Tips Section */}
        {(tipData.text || tipData.imgs.length > 0) && (!ddlStr || !isOver) && (
          <div className="bg-amber-50/60 dark:bg-amber-950/15 backdrop-blur-sm rounded-2xl border border-amber-200/40 dark:border-amber-900/20 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">注意事项</span>
            </div>
            
            {tipData.text && (
              <p className="text-sm text-amber-900/70 dark:text-amber-200/70 whitespace-pre-wrap leading-relaxed">
                {tipData.text}
              </p>
            )}
            
            {tipData.imgs && tipData.imgs.length > 0 && (
              <div className="mt-5">
                <p className="text-xs text-amber-700/60 dark:text-amber-400/60 mb-3 font-medium uppercase tracking-wider">批注图片</p>
                <div className="flex flex-wrap justify-center gap-4">
                  {tipData.imgs.map((img, index) => (
                    <div 
                      key={img.uid || index} 
                      className="relative group w-full sm:w-[calc(50%-0.5rem)] max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-amber-200/30 dark:border-amber-800/20 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-amber-300 dark:hover:border-amber-700"
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
              <div className="bg-gray-50/80 dark:bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-800/50 p-5 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">参与名单验证</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 leading-relaxed">
                      需要填写 <span className="font-semibold text-gray-800 dark:text-gray-200">{limitBindField}</span> 字段，且必须在参与名单中
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Section */}
            <div className="bg-white/90 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-800/50 p-8 mb-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">必要信息</span>
              </div>

              {showValidForm && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="w-full px-4 py-3.5 text-sm border border-gray-200/80 dark:border-gray-700/50 rounded-xl 
                      bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-2 focus:ring-gray-900/5 dark:focus:ring-white/10 focus:border-gray-300 dark:focus:border-gray-600 focus:bg-white dark:focus:bg-gray-800
                      disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed
                      transition-all duration-200 placeholder:text-gray-400"
                  />
                </div>
              )}

              <InfosForm
                infos={infos}
                disabled={isUploading}
                onChange={setInfos}
              />
            </div>

            {/* Upload Section */}
            {taskInfo.collectionType === 'FILE' && (
              <div className="bg-white/90 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-gray-800/50 p-8 mb-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">文件上传</span>
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

            {/* Upload Progress Indicator */}
            {isSubmitting && uploadProgress && uploadProgress.total > 1 && (
              <div className="flex items-center justify-center gap-3 py-4 px-6 bg-gray-50/80 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-800/50 mb-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500 dark:text-gray-400" />
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  正在提交 <span className="font-semibold tabular-nums">{uploadProgress.completed + 1}</span> / <span className="font-semibold tabular-nums">{uploadProgress.total}</span> 个文件
                </div>
                <div className="flex-1 max-w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-white transition-all duration-300 rounded-full"
                    style={{ width: `${((uploadProgress.completed + 1) / uploadProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              {isWithdrawMode ? (
                <button
                  onClick={handleWithdraw}
                  disabled={!allowWithdraw || isSubmitting}
                  className="px-8 py-3.5 bg-gradient-to-b from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm font-semibold rounded-xl
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:from-orange-400 disabled:to-orange-500
                    flex items-center gap-2.5 transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98]"
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
                    className="px-8 py-3.5 bg-gradient-to-b from-gray-800 to-gray-900 dark:from-white dark:to-gray-100 
                      hover:from-gray-900 hover:to-black dark:hover:from-gray-100 dark:hover:to-gray-200
                      text-white dark:text-gray-900 text-sm font-semibold rounded-xl
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center gap-2.5 transition-all duration-200 
                      shadow-lg shadow-gray-900/20 dark:shadow-gray-200/20 
                      hover:shadow-xl hover:shadow-gray-900/30 dark:hover:shadow-gray-200/30 
                      hover:scale-[1.02] active:scale-[0.98]"
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
                className="px-6 py-3.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-700
                  text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl
                  border border-gray-200/80 dark:border-gray-700/50
                  flex items-center gap-2.5 transition-all duration-200
                  hover:border-gray-300 dark:hover:border-gray-600 hover:scale-[1.02] active:scale-[0.98]"
              >
                🔍 查询提交情况
              </button>
            </div>

            {/* Help Tips */}
            <div className="bg-gray-50/60 dark:bg-gray-900/30 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-800/50 p-6 mb-8">
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2.5 leading-relaxed">
                {isWithdrawMode ? (
                  <>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3">撤回说明</p>
                    <p className="flex items-start gap-2"><span className="text-gray-400">①</span> 须保证选择的文件与提交时的文件一致</p>
                    <p className="flex items-start gap-2"><span className="text-gray-400">②</span> 填写表单信息一致</p>
                    <p className="flex items-start gap-2"><span className="text-gray-400">③</span> 完全一模一样的文件的提交记录将会一次性全部撤回</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3">温馨提示</p>
                    <p className="flex items-start gap-2"><span className="text-gray-400">•</span> 查询提交情况，需填写和提交时一样的表单信息</p>
                    <p className="flex items-start gap-2"><span className="text-gray-400">①</span> 选择完文件，点击「提交文件」即可</p>
                    <p className="flex items-start gap-2"><span className="text-gray-400">②</span> 选择大文件后需要等待一会儿才展示处理</p>
                    {taskMoreInfo.template && !disabledUpload && (
                      <p className="flex items-start gap-2"><span className="text-gray-400">③</span> 右下角可「查看提交示例」</p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-5">
              {taskMoreInfo.template && !disabledUpload && (
                <button
                  onClick={handleDownloadTemplate}
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 
                    flex items-center gap-2 transition-all duration-200 hover:gap-2.5"
                >
                  <Download className="w-4 h-4" />
                  查看提交示例
                </button>
              )}
              <button
                onClick={() => setIsWithdrawMode(!isWithdrawMode)}
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200"
              >
                {isWithdrawMode ? '✏️ 正常提交' : '↩️ 我要撤回'}
              </button>
            </div>
          </>
        )}
      </main>

      <div className="py-12">
        <HomeFooter type="simple" />
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div 
            className="relative w-[90vw] h-[90vh] max-w-5xl animate-in zoom-in-95 duration-300"
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
          message={successToast.message}
          details={successToast.details}
          onClose={() => setSuccessToast(null)}
        />
      )}

      {/* Submission Success Modal */}
      {lastSubmissionData && (
        <SubmissionSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          submissionData={lastSubmissionData}
        />
      )}

      {/* Submission History Modal */}
      <SubmissionHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        submissions={historySubmissions}
        taskTitle={taskInfo.name}
        taskId={taskKey}
        collectionType={taskInfo.collectionType || 'FILE'}
        onWithdrawSuccess={() => {
          const currentSubmitterName = infos.find(v => v.text === limitBindField)?.value || peopleName;
          if (currentSubmitterName) {
            getPublicSubmissions(taskKey, currentSubmitterName).then(result => {
              setHistorySubmissions(result.submissions);
            }).catch(console.error);
          }
        }}
      />
    </div>
  );
}
