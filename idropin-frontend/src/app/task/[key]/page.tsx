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
import { getUploadToken, addFile, withdrawFile, checkSubmitStatus, getTemplateUrl } from '@/lib/api/files';
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
  category?: string;
  limitUpload?: boolean;
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

  // 图片预览模态框状态
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const limitBindField = (() => {
    const field = taskMoreInfo.bindField;
    if (!field) return '姓名';
    
    // 尝试解析 JSON
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (parsed.fieldName) {
          // 新格式：包含 fieldName 和 nameList
          return parsed.fieldName;
        } else if (Array.isArray(parsed)) {
          // 旧格式：bindField 直接存储名单列表
          return '姓名';
        }
      } catch {
        // 不是 JSON，直接使用字符串
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
    return `剩余${day}天${hour}时${minute}分${seconds}秒`;
  }, [waitTime]);

  const ddlStr = taskMoreInfo.ddl ? formatDate(new Date(taskMoreInfo.ddl)) : '';

  useEffect(() => {
    if (!taskKey) return;

    const loadTaskInfo = async () => {
      setIsLoading(true);
      try {
        const info = await getTaskInfoPublic(taskKey);
        setTaskInfo({
          name: info.title || '',
          limitUpload: false,
        });
        setDisabledUpload(false);

        const moreInfo = await getTaskMoreInfoPublic(taskKey);
        setTaskMoreInfo(moreInfo);
        setInfos(parseInfo(moreInfo.info || ''));
        setFormatConfig(parseFileFormat(moreInfo.format || ''));

        if (moreInfo.tip) {
          try {
            const parsed = JSON.parse(moreInfo.tip);
            setTipData({
              text: parsed.text || '',
              imgs: parsed.imgs || [],
            });
          } catch {
            setTipData({ text: '', imgs: [] });
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
      await getUploadToken(); // Verify upload permission
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
          await addFile({
            name: fileName,
            hash: uploadFile.md5!,
            size: uploadFile.file.size,
            key: taskKey,
            info: JSON.stringify(infos),
            peopleName: isSameFieldName?.value || peopleName,
          });

          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, status: 'success' as const, progress: 100 } : f
          ));

          if (taskMoreInfo.people) {
            const name = isSameFieldName?.value || peopleName;
            await updatePeopleStatus(taskKey, fileName, name, uploadFile.md5!);
          }

          alert(`文件: ${originName} 提交成功`);
        } catch {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, status: 'fail' as const, error: '上传失败' } : f
          ));
        }
      }
    } catch (err) {
      alert('获取上传凭证失败');
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
          id: parseInt(file.id),
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-gray-500 dark:text-gray-400 animate-pulse">加载中...</p>
        </div>
      </div>
    );
  }

  if (!taskKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto p-4 pt-20">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-12 text-center border border-white/20 dark:border-gray-700/50">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {taskInfo.name || '任务不存在'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">请检查链接是否正确</p>
          </div>
        </div>
        <HomeFooter type="simple" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
      </div>

      <header className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-lg border-b border-white/20 dark:border-gray-700/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-all hover:scale-105">
            <div className="relative h-10 w-32">
              <Image
                src="https://pic.imgdb.cn/item/668cd877d9c307b7e99e9061.png"
                alt="EasyPicker"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <a
            href="https://docs.ep.sugarat.top/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 
              font-medium transition-all px-4 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
          >
            <span className="group-hover:animate-bounce">🚀</span>
            <span>我也要收集</span>
          </a>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto p-4 py-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 border border-white/20 dark:border-gray-700/50 overflow-hidden">
          {/* 卡片顶部装饰 */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/25">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              {taskInfo.name}
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-300 dark:to-blue-700"></div>
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-purple-300 dark:to-purple-700"></div>
            </div>
          </div>

          {disabledUpload && (
            <div className="mb-8 p-5 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl border border-red-200/50 dark:border-red-800/50 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-1">存储空间已满</h3>
                  <p className="text-sm text-red-600/80 dark:text-red-400/80">任务存储空间容量已达到上限，已经无法进行上传，请联系发起人扩容空间</p>
                </div>
              </div>
            </div>
          )}

          {(tipData.text || tipData.imgs.length > 0) && (!ddlStr || !isOver) && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent dark:via-amber-700"></div>
                <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium text-sm bg-amber-50 dark:bg-amber-900/30 px-4 py-1.5 rounded-full">
                  <AlertCircle className="w-4 h-4" />
                  注意事项
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent dark:via-amber-700"></div>
              </div>
              
              {tipData.text && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5 rounded-2xl mb-4 border border-amber-200/50 dark:border-amber-800/50 shadow-sm">
                  <p className="text-amber-800 dark:text-amber-300 text-sm whitespace-pre-wrap leading-relaxed">{tipData.text}</p>
                </div>
              )}
              
              {tipData.imgs && tipData.imgs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-xs">📷</span>
                    批注图片
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {tipData.imgs.map((img, index) => (
                      <div 
                        key={img.uid || index} 
                        className="group relative rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer"
                        onClick={() => setPreviewImage(img.name)}
                      >
                        <div className="aspect-video relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                          <Image
                            src={img.name}
                            alt={`批注图片 ${index + 1}`}
                            fill
                            className="object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                          <span className="text-white text-xs font-medium px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                            点击查看大图
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {ddlStr && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent dark:via-blue-700"></div>
                <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium text-sm bg-blue-50 dark:bg-blue-900/30 px-4 py-1.5 rounded-full">
                  <Clock className="w-4 h-4" />
                  截止时间
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent dark:via-blue-700"></div>
              </div>
              
              <div className="text-center">
                <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-semibold text-blue-700 dark:text-blue-300">{ddlStr}</span>
                  </div>
                  {!isOver && (
                    <span className="text-sm text-blue-600/80 dark:text-blue-400/80 bg-blue-100/50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                      {waitTimeStr()}
                    </span>
                  )}
                </div>
              </div>
              
              {isOver && (
                <div className="mt-6 text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-5xl">😔</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">任务已结束</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-500">提交时间已过，无法继续提交</p>
                </div>
              )}
            </div>
          )}

          {(!ddlStr || !isOver) && (
            <>
              <div className="flex items-center gap-3 mb-6 mt-8">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium text-sm bg-gray-50 dark:bg-gray-800 px-4 py-1.5 rounded-full">
                  <FileText className="w-4 h-4" />
                  必要信息填写
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
              </div>

              {taskMoreInfo.people && (
                <div className="mb-6 p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/50 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-1">参与名单验证</h3>
                      <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                        需要填写 <span className="font-semibold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg">{limitBindField}</span> 字段，且必须在参与名单中才能正常提交
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {showValidForm && (
                <div className="mb-6 p-5 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-900/50 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
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
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl 
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      dark:bg-gray-800 dark:text-white transition-all text-base"
                  />
                </div>
              )}

              <div className="mb-8">
                <InfosForm
                  infos={infos}
                  disabled={isUploading}
                  onChange={setInfos}
                />
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
                <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium text-sm bg-gray-50 dark:bg-gray-800 px-4 py-1.5 rounded-full">
                  <Upload className="w-4 h-4" />
                  文件上传
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
              </div>

              <SubmissionUploader
                files={files}
                onFilesChange={setFiles}
                formatConfig={formatConfig}
                disabled={disabledUpload || isUploading}
                isMobile={isMobile}
              />

              <div className="flex flex-wrap gap-4 justify-center mt-10">
                {isWithdrawMode ? (
                  <button
                    onClick={handleWithdraw}
                    disabled={!allowWithdraw || isSubmitting}
                    className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl 
                      hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg
                      flex items-center gap-3 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="text-xl group-hover:animate-spin">🔄</span>
                    )}
                    一键撤回
                  </button>
                ) : (
                  !disabledUpload && (
                    <button
                      onClick={handleSubmit}
                      disabled={!allowUpload || isSubmitting}
                      className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl 
                        hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg
                        flex items-center gap-3 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      )}
                      提交文件
                    </button>
                  )
                )}
                <button
                  onClick={handleCheckStatus}
                  className="group px-8 py-4 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-700 dark:to-slate-700 
                    text-gray-700 dark:text-gray-200 rounded-2xl hover:from-gray-200 hover:to-slate-200 dark:hover:from-gray-600 dark:hover:to-slate-600 
                    shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-600/50
                    flex items-center gap-3 font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  <span className="text-xl group-hover:animate-pulse">🔍</span>
                  查询提交情况
                </button>
              </div>

              <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2.5">
                  {isWithdrawMode ? (
                    <>
                      <p className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-xs">📋</span>
                        撤回说明
                      </p>
                      <p className="flex items-start gap-2"><span className="text-blue-400">①</span> 须保证选择的文件与提交时的文件一致</p>
                      <p className="flex items-start gap-2"><span className="text-blue-400">②</span> 填写表单信息一致</p>
                      <p className="flex items-start gap-2"><span className="text-blue-400">③</span> 完全一模一样的文件的提交记录（内容md5+命名），将会一次性全部撤回</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-xs">💡</span>
                        温馨提示
                      </p>
                      <p className="flex items-start gap-2"><span className="text-blue-400">•</span> <strong>查询提交情况，需填写和提交时一样的表单信息</strong></p>
                      <p className="flex items-start gap-2"><span className="text-blue-400">①</span> 选择完文件，点击 &quot;提交文件&quot; 即可</p>
                      <p className="flex items-start gap-2"><span className="text-blue-400">②</span> <strong>选择大文件后需要等待一会儿才展示处理</strong></p>
                      {taskMoreInfo.template && !disabledUpload && (
                        <p className="flex items-start gap-2"><span className="text-blue-400">③</span> <strong>右下角可 &quot;查看提交示例&quot;</strong></p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                {taskMoreInfo.template && !disabledUpload && (
                  <button
                    onClick={handleDownloadTemplate}
                    className="group text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 
                      flex items-center gap-2 font-medium px-4 py-2 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 
                      border border-transparent hover:border-green-200 dark:hover:border-green-800 transition-all"
                  >
                    <Download className="w-4 h-4 group-hover:animate-bounce" />
                    查看提交示例
                  </button>
                )}
                <button
                  onClick={() => setIsWithdrawMode(!isWithdrawMode)}
                  className="group text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 
                    font-medium px-4 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 
                    border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                >
                  {isWithdrawMode ? '✏️ 正常提交' : '↩️ 我要撤回'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <div className="relative py-8">
        <HomeFooter type="simple" />
      </div>

      {/* 图片预览模态框 */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full shadow-2xl transition-all duration-200 z-10 group"
          >
            <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" />
          </button>
          <div 
            className="relative w-[90vw] h-[90vh] max-w-6xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewImage}
              alt="预览大图"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
