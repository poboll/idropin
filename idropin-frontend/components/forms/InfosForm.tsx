'use client';

import { InfoItem } from '@/lib/utils/string';

interface InfosFormProps {
  infos: InfoItem[];
  disabled?: boolean;
  maxInputLength?: number;
  onChange?: (infos: InfoItem[]) => void;
}

export default function InfosForm({
  infos,
  disabled = false,
  maxInputLength = 50,
  onChange,
}: InfosFormProps) {
  const handleValueChange = (index: number, value: string) => {
    if (onChange) {
      const newInfos = [...infos];
      newInfos[index] = { ...newInfos[index], value };
      onChange(newInfos);
    }
  };

  if (!infos || infos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {infos.map((info, idx) => (
        <div key={idx}>
          {info.type === 'text' ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800">
              {info.text}
            </div>
          ) : (
            <>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span className="text-red-500 mr-1">*</span>
                {info.text || '未命名字段'}
              </label>

              {info.type === 'input' && (
                <input
                  type="text"
                  value={info.value || ''}
                  onChange={(e) => handleValueChange(idx, e.target.value)}
                  disabled={disabled}
                  maxLength={maxInputLength}
                  placeholder={`请输入 ${info.text || '内容'}`}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg 
                    bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-300 dark:focus:border-gray-600
                    disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
                    transition-all placeholder:text-gray-400"
                />
              )}

              {info.type === 'select' && info.children && (
                <select
                  value={info.value || ''}
                  onChange={(e) => handleValueChange(idx, e.target.value)}
                  disabled={disabled}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg 
                    bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-300 dark:focus:border-gray-600
                    disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed
                    transition-all"
                >
                  <option value="">请选择 {info.text || '选项'}</option>
                  {info.children.map((child, childIdx) => (
                    <option key={childIdx} value={child.text}>
                      {child.text}
                    </option>
                  ))}
                </select>
              )}

              {info.type === 'radio' && info.children && (
                <div className="flex flex-wrap gap-3">
                  {info.children.map((child, childIdx) => (
                    <label
                      key={childIdx}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all
                        ${info.value === child.text 
                          ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`radio-${idx}`}
                        value={child.text}
                        checked={info.value === child.text}
                        onChange={(e) => handleValueChange(idx, e.target.value)}
                        disabled={disabled}
                        className="sr-only"
                      />
                      <span className="text-sm">
                        {child.text}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
