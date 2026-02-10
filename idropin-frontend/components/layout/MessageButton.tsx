'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useMessageStore } from '@/lib/stores/messages';
import { MessagePanel } from '../messages/MessagePanel';

interface MessageButtonProps {
  className?: string;
}

export function MessageButton({ className }: MessageButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, fetchUnreadCount } = useMessageStore();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
        aria-label="消息"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-medium text-white bg-red-500 rounded-full px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      <MessagePanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
