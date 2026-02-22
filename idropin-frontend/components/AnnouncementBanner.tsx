'use client';

import { useState, useEffect } from 'react';
import { getAnnouncementConfig } from '@/lib/api/announcement';
import { X, Sparkles } from 'lucide-react';

export default function AnnouncementBanner() {
  const [enabled, setEnabled] = useState(false);
  const [content, setContent] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const fetchAnnouncement = async () => {
      const config = await getAnnouncementConfig();
      const newContent = config.content || '🎉 欢迎使用云集文件管理平台！查看 <a href="/about" class="announcement-link">关于我们</a> 了解更多功能。';
      
      setEnabled(config.enabled || true);
      setContent(newContent);
      
      const lastContent = sessionStorage.getItem('announcement-content');
      const sessionDismissed = sessionStorage.getItem('announcement-dismissed');
      
      if (lastContent !== newContent) {
        sessionStorage.setItem('announcement-content', newContent);
        sessionStorage.removeItem('announcement-dismissed');
        setDismissed(false);
        setTimeout(() => setIsVisible(true), 500);
      } else if (sessionDismissed === 'true') {
        setDismissed(true);
      } else {
        setTimeout(() => setIsVisible(true), 500);
      }
    };

    fetchAnnouncement();
  }, [mounted]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setDismissed(true);
      sessionStorage.setItem('announcement-dismissed', 'true');
    }, 300);
  };

  if (!mounted || !enabled || !content || dismissed) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        .announcement-link {
          @apply text-blue-600 dark:text-blue-400 underline decoration-blue-400/50 dark:decoration-blue-500/50 underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 hover:decoration-blue-600 dark:hover:decoration-blue-400 transition-all duration-200;
        }
      `}</style>
        <div 
          className={`w-full backdrop-blur-sm overflow-hidden transition-all duration-300 ease-in-out ${
            isVisible ? 'max-h-[32px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="relative bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 dark:from-slate-900/95 dark:via-blue-950/95 dark:to-indigo-950/95 h-[32px] flex items-center">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200/50 dark:via-slate-700/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400/20 dark:via-blue-500/20 to-transparent blur-sm" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center h-full">
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 animate-pulse" />
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <p 
                  className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
              
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 group relative p-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all duration-200 hover:scale-110 hover:rotate-90"
                aria-label="关闭公告"
              >
                <X className="w-3.5 h-3.5" />
                <div className="absolute inset-0 rounded-full bg-blue-400/0 group-hover:bg-blue-400/10 dark:group-hover:bg-blue-500/10 transition-colors duration-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
