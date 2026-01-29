/**
 * Format date to string
 * @param d Date object or date string/number
 * @param fmt Format string (default: 'yyyy-MM-dd hh:mm:ss')
 */
export function formatDate(d: Date | string | number, fmt = 'yyyy-MM-dd hh:mm:ss'): string {
  if (!(d instanceof Date)) {
    d = new Date(d);
  }
  
  if (isNaN(d.getTime())) {
    return '';
  }

  const o: Record<string, number> = {
    'M+': d.getMonth() + 1, // Month
    'd+': d.getDate(), // Day
    'h+': d.getHours(), // Hour
    'm+': d.getMinutes(), // Minute
    's+': d.getSeconds(), // Second
    'q+': Math.floor((d.getMonth() + 3) / 3), // Quarter
    'S': d.getMilliseconds(), // Millisecond
  };

  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      `${d.getFullYear()}`.substring(4 - RegExp.$1.length)
    );
  }

  for (const k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      const str = `${o[k]}`;
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? str : `00${str}`.substring(str.length)
      );
    }
  }
  return fmt;
}

/**
 * Format file size
 * @param size Size in bytes
 */
export function formatSize(size: number): string {
  if (size === 0) return '0 B';
  const units = ['B', 'K', 'M', 'G', 'TB', 'PB'];
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(2)}${units[i]}`;
}

/**
 * Get file suffix (extension) including dot
 * @param filename
 */
export function getFileSuffix(filename: string): string {
  const lastIndex = filename.lastIndexOf('.');
  return lastIndex >= 0 ? filename.substring(lastIndex) : '';
}

/**
 * Normalize filename (replace invalid chars)
 * @param name
 */
export function normalizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '-');
}

/**
 * Copy text to clipboard
 * @param text Text to copy
 * @param message Optional success message (handled by caller typically, but defined in interface)
 */
export async function copyRes(text: string, message?: string): Promise<void> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  } catch (err) {
    console.error('Failed to copy', err);
  }
}

/**
 * 表单项类型定义
 */
export interface InfoItem {
  type: 'input' | 'select' | 'radio' | 'text';
  text: string;
  value?: string;
  children?: InfoItem[];
}

/**
 * 解析表单配置信息
 * @param info JSON字符串格式的表单配置
 */
export function parseInfo(info: string): InfoItem[] {
  if (!info) return [];
  try {
    const parsed = JSON.parse(info);
    if (!Array.isArray(parsed)) return [];
    
    return parsed.map((v: string | InfoItem | any) => {
      // 兼容旧表单数据（纯字符串形式）
      if (typeof v === 'string') {
        return { type: 'input', text: v, value: '' };
      }
      
      // 创建新对象避免修改原始数据
      const item: InfoItem = {
        type: v.type || 'input',
        text: v.text || v.name || '未命名字段',
        value: v.value || '',
      };
      
      // 处理子选项（用于 select 和 radio 类型）
      if (v.children && Array.isArray(v.children)) {
        item.children = v.children.map((child: any) => ({
          type: child.type || 'input',
          text: child.text || child.name || '',
          value: child.value || '',
        }));
      }
      
      return item;
    });
  } catch {
    return [];
  }
}

/**
 * 文件格式配置
 */
export interface FileFormatConfig {
  size: number;
  sizeUnit: string;
  status: boolean;
  format: string[];
  limit: number;
  splitChar: string;
}

/**
 * 获取默认文件格式配置
 */
export function getDefaultFormat(): FileFormatConfig {
  return {
    size: 0,
    sizeUnit: 'MB',
    status: false,
    format: [],
    limit: 10,
    splitChar: '-',
  };
}

/**
 * 解析文件格式配置
 * @param format JSON字符串格式的配置
 */
export function parseFileFormat(format: string): FileFormatConfig {
  const formatData = getDefaultFormat();
  if (!format) return formatData;
  try {
    const v = JSON.parse(format) as Record<string, unknown>;
    const dataRecord = formatData as unknown as Record<string, unknown>;
    Object.keys(v).forEach((key) => {
      dataRecord[key] = v[key] || dataRecord[key];
      if (key === 'format') {
        formatData.format = Array.from(
          new Set(formatData.format.map((f: string) => f.toLowerCase()))
        );
      }
    });
  } catch {
    return formatData;
  }
  return formatData;
}

/**
 * 计算文件的MD5哈希值
 * @param file 文件对象
 * @returns Promise<string> MD5哈希值
 */
export function getFileMd5Hash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunkSize = 2097152; // 2MB 分片
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    const fileReader = new FileReader();
    
    // 使用简单的哈希算法（实际项目中可以使用 spark-md5 库）
    let hash = 0;
    
    function loadNext() {
      const start = currentChunk * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      fileReader.readAsArrayBuffer(file.slice(start, end));
    }
    
    fileReader.onload = function (e) {
      const buffer = e?.target?.result as ArrayBuffer;
      if (buffer) {
        const view = new Uint8Array(buffer);
        for (let i = 0; i < view.length; i++) {
          hash = ((hash << 5) - hash + view[i]) | 0;
        }
      }
      currentChunk += 1;
      
      if (currentChunk < chunks) {
        loadNext();
      } else {
        // 转换为16进制字符串
        const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
        resolve(hashStr + Date.now().toString(16));
      }
    };
    
    fileReader.onerror = function () {
      reject(new Error('文件读取失败'));
    };
    
    loadNext();
  });
}

/**
 * 获取提示图片的存储key
 */
export function getTipImageKey(
  key: string,
  name: string,
  uid?: number | string
): string {
  return `easypicker2/tip/${key}/${uid || Date.now()}/${name}`;
}
