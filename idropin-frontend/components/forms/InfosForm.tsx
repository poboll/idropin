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
        <div key={idx} className="space-y-1">
          {info.type === 'text' ? (
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-sm">
              {info.text}
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="text-red-500 mr-1">*</span>
                {info.text}
              </label>

              {info.type === 'input' && (
                <input
                  type="text"
                  value={info.value || ''}
                  onChange={(e) => handleValueChange(idx, e.target.value)}
                  disabled={disabled}
                  maxLength={maxInputLength}
                  placeholder={`请输入 ${info.text}`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    dark:bg-gray-800 dark:text-white"
                />
              )}

              {info.type === 'select' && info.children && (
                <select
                  value={info.value || ''}
                  onChange={(e) => handleValueChange(idx, e.target.value)}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    disabled:bg-gray-100 disabled:cursor-not-allowed
                    dark:bg-gray-800 dark:text-white"
                >
                  <option value="">请选择 {info.text}</option>
                  {info.children.map((child, childIdx) => (
                    <option key={childIdx} value={child.text}>
                      {child.text}
                    </option>
                  ))}
                </select>
              )}

              {info.type === 'radio' && info.children && (
                <div className="flex flex-wrap gap-4">
                  {info.children.map((child, childIdx) => (
                    <label
                      key={childIdx}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`radio-${idx}`}
                        value={child.text}
                        checked={info.value === child.text}
                        onChange={(e) => handleValueChange(idx, e.target.value)}
                        disabled={disabled}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500
                          disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
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
