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
      const response = await fetch('https://dl.caiths.com/api/one', {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'zh-CN,zh;q=0.9',
        },
      });
      const data = await response.json();
      if (data.code === 200 && data.data) {
        setHitokoto({
          content: data.data.content,
          name: data.data.name,
          origin: data.data.origin,
        });
      }
    } catch (error) {
      console.error('Failed to fetch hitokoto:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHitokoto();
  }, []);

  if (!hitokoto) return null;

  return (
    <div className="hidden xl:flex items-center gap-2 max-w-xs mr-2">
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
