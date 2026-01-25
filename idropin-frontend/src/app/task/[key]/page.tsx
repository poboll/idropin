'use client';

import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import HomeFooter from '@/components/layout/HomeFooter';
import InfosForm from '@/components/forms/InfosForm';
import SubmissionUploader, { UploadFile } from '@/components/submission/SubmissionUploader';
import { getTaskInfo, getTaskMoreInfo, TaskInfo } from '@/lib/api/tasks';
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

  const limitBindField = taskMoreInfo.bindField?.trim() || '姓名';
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
        const info = await getTaskInfo(taskKey);
        setTaskInfo({
          name: info.title || '',
          limitUpload: false,
        });
        setDisabledUpload(false);

        const moreInfo = await getTaskMoreInfo(taskKey);
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
      const token = await getUploadToken();
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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!taskKey) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {taskInfo.name || '任务不存在'}
            </h1>
          </div>
        </div>
        <HomeFooter type="simple" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-10 w-32">
              <Image
                src="https://img.cdn.sugarat.top/easypicker/EasyPicker.png"
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
            className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
          >
            我也要收集
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
            {taskInfo.name}
          </h1>

          {disabledUpload && (
            <div className="text-center text-red-600 font-medium mb-4">
              任务存储空间容量已达到上限，已经无法进行上传，请联系发起人扩容空间
            </div>
          )}

          {tipData.text && (!ddlStr || !isOver) && (
            <>
              <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                <span className="h-px flex-1 bg-gray-200" />
                <span>⚠️ 注意事项 ⚠️</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 p-4 rounded mb-4 text-sm whitespace-pre-wrap">
                {tipData.text}
              </div>
            </>
          )}

          {ddlStr && (
            <>
              <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                <span className="h-px flex-1 bg-gray-200" />
                <span>截止时间</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="text-center text-gray-600 dark:text-gray-400 mb-4">
                {ddlStr} {!isOver && waitTimeStr()}
              </div>
              {isOver && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">😔</div>
                  <div>已经结束啦！</div>
                </div>
              )}
            </>
          )}

          {(!ddlStr || !isOver) && (
            <>
              <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
                <span className="h-px flex-1 bg-gray-200" />
                <span>必要信息填写</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              {taskMoreInfo.people && (
                <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 p-3 rounded mb-4 text-sm">
                  &quot;{limitBindField}&quot; 在参与名单里才能正常提交
                </div>
              )}

              {showValidForm && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      dark:bg-gray-800 dark:text-white"
                  />
                </div>
              )}

              <div className="mb-6">
                <InfosForm
                  infos={infos}
                  disabled={isUploading}
                  onChange={setInfos}
                />
              </div>

              <SubmissionUploader
                files={files}
                onFilesChange={setFiles}
                formatConfig={formatConfig}
                disabled={disabledUpload || isUploading}
                isMobile={isMobile}
              />

              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {isWithdrawMode ? (
                  <button
                    onClick={handleWithdraw}
                    disabled={!allowWithdraw || isSubmitting}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 
                      disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    一键撤回
                  </button>
                ) : (
                  !disabledUpload && (
                    <button
                      onClick={handleSubmit}
                      disabled={!allowUpload || isSubmitting}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 
                        disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      提交文件
                    </button>
                  )
                )}
                <button
                  onClick={handleCheckStatus}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                    rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  查询提交情况
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {isWithdrawMode ? (
                  <>
                    <p>① 须保证选择的文件与提交时的文件一致</p>
                    <p>② 填写表单信息一致</p>
                    <p>③ 完全一模一样的文件的提交记录（内容md5+命名），将会一次性全部撤回</p>
                  </>
                ) : (
                  <>
                    <p><strong>查询提交情况，需填写和提交时一样的表单信息</strong></p>
                    <p>① 选择完文件，点击 &quot;提交文件&quot; 即可</p>
                    <p>② <strong>选择大文件后需要等待一会儿才展示处理</strong></p>
                    {taskMoreInfo.template && !disabledUpload && (
                      <p>③ <strong>右下角可 &quot;查看提交示例&quot;</strong></p>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                {taskMoreInfo.template && !disabledUpload && (
                  <button
                    onClick={handleDownloadTemplate}
                    className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    查看提交示例
                  </button>
                )}
                <button
                  onClick={() => setIsWithdrawMode(!isWithdrawMode)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {isWithdrawMode ? '正常提交' : '我要撤回'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <div className="py-5">
        <HomeFooter type="simple" />
      </div>
    </div>
  );
}
