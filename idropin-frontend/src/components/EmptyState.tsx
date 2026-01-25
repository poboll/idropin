import { FileText, Search, Upload, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  type?: 'files' | 'search' | 'upload' | 'default';
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  type = 'default',
  title,
  description,
  action
}: EmptyStateProps) {
  const configs = {
    files: {
      icon: <FolderOpen className="h-16 w-16 text-gray-400" />,
      title: title || '暂无文件',
      description: description || '您还没有上传任何文件，点击下方按钮开始上传',
    },
    search: {
      icon: <Search className="h-16 w-16 text-gray-400" />,
      title: title || '未找到结果',
      description: description || '没有找到匹配的文件，请尝试其他关键字或筛选条件',
    },
    upload: {
      icon: <Upload className="h-16 w-16 text-gray-400" />,
      title: title || '上传文件',
      description: description || '点击下方按钮上传您的第一个文件',
    },
    default: {
      icon: <FileText className="h-16 w-16 text-gray-400" />,
      title: title || '暂无数据',
      description: description || '暂时没有可显示的内容',
    },
  };

  const config = configs[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          {config.icon}
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {config.title}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {config.description}
        </p>

        {action && (
          <button
            onClick={action.onClick}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
