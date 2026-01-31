'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface HitokotoData {
  content: string;
  name: string;
  origin: string;
}

export function HitokotoDisplay() {
  const [hitokoto, setHitokoto] = useState<HitokotoData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHitokoto = async () => {
    setLoading(true);
    try {
      // 使用官方一言API（支持CORS）
      const response = await fetch('https://v1.hitokoto.cn/?c=i&c=k', {
        headers: {
          'accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      
      const data = await response.json();
      setHitokoto({
        content: data.hitokoto.length > 30 ? data.hitokoto.substring(0, 30) + '...' : data.hitokoto,
        name: data.from_who || '佚名',
        origin: data.from || '未知',
      });
    } catch (error) {
      console.error('Failed to fetch hitokoto:', error);
      // 使用默认一言
      setHitokoto({
        content: '生活明朗，万物可爱',
        name: '佚名',
        origin: '默认',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHitokoto();
  }, []);

  if (!hitokoto) return null;

  return (
    <div className="hidden md:flex items-center gap-2 max-w-xs mr-2">
      <button
        onClick={fetchHitokoto}
        disabled={loading}
        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        title="换一句"
      >
        <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
      </button>
      <div className="flex flex-col min-w-0">
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={hitokoto.content}>
          {hitokoto.content}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
          —— {hitokoto.name} 《{hitokoto.origin}》
        </p>
      </div>
    </div>
  );
}
