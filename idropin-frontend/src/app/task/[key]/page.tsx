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
      <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
            className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 
              font-medium transition-colors px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            🚀 我也要收集
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {taskInfo.name}
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"></div>
          </div>

          {disabledUpload && (
            <div className="text-center mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 font-medium">
              ⚠️ 任务存储空间容量已达到上限，已经无法进行上传，请联系发起人扩容空间
            </div>
          )}

          {(tipData.text || tipData.imgs.length > 0) && (!ddlStr || !isOver) && (
            <>
              <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span className="text-sm font-medium">⚠️ 注意事项 ⚠️</span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
              
              {tipData.text && (
                <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 p-4 rounded-lg mb-4 text-sm whitespace-pre-wrap border border-orange-200 dark:border-orange-800">
                  {tipData.text}
                </div>
              )}
              
              {tipData.imgs && tipData.imgs.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                    📷 批注图片：
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {tipData.imgs.map((img, index) => (
                      <div 
                        key={img.uid || index} 
                        className="relative group rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                      >
                        <div className="aspect-video relative bg-gray-100 dark:bg-gray-800">
                          <Image
                            src={img.name}
                            alt={`批注图片 ${index + 1}`}
                            fill
                            className="object-contain cursor-pointer"
                            onClick={() => window.open(img.name, '_blank')}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                          <button
                            onClick={() => window.open(img.name, '_blank')}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium shadow-lg"
                          >
                            点击查看大图
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {ddlStr && (
            <>
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-3">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span className="text-sm font-medium">⏰ 截止时间</span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="font-medium">{ddlStr}</span>
                  {!isOver && (
                    <span className="text-sm">({waitTimeStr()})</span>
                  )}
                </div>
              </div>
              {isOver && (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <div className="text-6xl mb-3">😔</div>
                  <div className="text-xl font-medium text-gray-600 dark:text-gray-400">任务已结束</div>
                  <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">提交时间已过，无法继续提交</div>
                </div>
              )}
            </>
          )}

          {(!ddlStr || !isOver) && (
            <>
              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-4 mt-6">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span className="text-sm font-medium">📝 必要信息填写</span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>

              {taskMoreInfo.people && (
                <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-4 rounded-lg mb-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">👥</span>
                    <div className="flex-1">
                      <div className="font-medium mb-1">参与名单验证</div>
                      <div className="text-sm">
                        需要填写 <span className="font-semibold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded">{limitBindField}</span> 字段，且必须在参与名单中才能正常提交
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showValidForm && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
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
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      dark:bg-gray-800 dark:text-white transition-all"
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

              <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span className="text-sm font-medium">📤 文件上传</span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>

              <SubmissionUploader
                files={files}
                onFilesChange={setFiles}
                formatConfig={formatConfig}
                disabled={disabledUpload || isUploading}
                isMobile={isMobile}
              />

              <div className="flex flex-wrap gap-3 justify-center mt-8">
                {isWithdrawMode ? (
                  <button
                    onClick={handleWithdraw}
                    disabled={!allowWithdraw || isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg 
                      hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md
                      flex items-center gap-2 font-medium transition-all transform hover:scale-105 active:scale-95"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    🔄 一键撤回
                  </button>
                ) : (
                  !disabledUpload && (
                    <button
                      onClick={handleSubmit}
                      disabled={!allowUpload || isSubmitting}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg 
                        hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md
                        flex items-center gap-2 font-medium transition-all transform hover:scale-105 active:scale-95"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      ✅ 提交文件
                    </button>
                  )
                )}
                <button
                  onClick={handleCheckStatus}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                    rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 shadow-md hover:shadow-lg
                    font-medium transition-all transform hover:scale-105 active:scale-95"
                >
                  🔍 查询提交情况
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                  {isWithdrawMode ? (
                    <>
                      <p className="font-medium mb-2">📋 撤回说明：</p>
                      <p>① 须保证选择的文件与提交时的文件一致</p>
                      <p>② 填写表单信息一致</p>
                      <p>③ 完全一模一样的文件的提交记录（内容md5+命名），将会一次性全部撤回</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium mb-2">💡 温馨提示：</p>
                      <p><strong>查询提交情况，需填写和提交时一样的表单信息</strong></p>
                      <p>① 选择完文件，点击 &quot;提交文件&quot; 即可</p>
                      <p>② <strong>选择大文件后需要等待一会儿才展示处理</strong></p>
                      {taskMoreInfo.template && !disabledUpload && (
                        <p>③ <strong>右下角可 &quot;查看提交示例&quot;</strong></p>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                {taskMoreInfo.template && !disabledUpload && (
                  <button
                    onClick={handleDownloadTemplate}
                    className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 
                      flex items-center gap-1 font-medium px-3 py-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    查看提交示例
                  </button>
                )}
                <button
                  onClick={() => setIsWithdrawMode(!isWithdrawMode)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 
                    font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                >
                  {isWithdrawMode ? '✏️ 正常提交' : '↩️ 我要撤回'}
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
