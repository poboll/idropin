'use client';

import Link from 'next/link';

interface HomeFooterProps {
  type?: 'default' | 'dashboard' | 'simple';
}

export default function HomeFooter({ type = 'default' }: HomeFooterProps) {
  const currentYear = new Date().getFullYear();

  if (type === 'simple') {
    return (
      <footer className="py-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            &copy; 2024 在虎. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-t ${type === 'dashboard' ? 'border-slate-200/50 dark:border-slate-800/50 mt-auto' : 'border-slate-100/50 dark:border-slate-800/50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-slate-200 rounded-md flex items-center justify-center">
               <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
               </svg>
            </div>
            <span className="text-sm font-semibold text-slate-600">云集</span>
            <span className="text-sm text-slate-400">v1.0.0</span>
          </div>
          
          <div className="flex space-x-6 text-sm text-slate-500">
            <Link href="/about" className="hover:text-blue-600 transition-colors">
              关于
            </Link>
            <Link href="/contact" className="hover:text-blue-600 transition-colors">
              联系作者
            </Link>
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              通知
            </Link>
            <a href="https://github.com/your-org/idropin" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
              GitHub
            </a>
          </div>

          <div className="text-sm text-slate-400">
            &copy; 2024 在虎
          </div>
        </div>
      </div>
    </footer>
  );
}
